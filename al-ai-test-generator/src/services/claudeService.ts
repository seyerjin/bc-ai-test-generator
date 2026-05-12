import Anthropic from '@anthropic-ai/sdk';
import * as vscode from 'vscode';
import { AuthService } from './authService';
import { ConfigService } from './configService';
import { SYSTEM_PROMPT } from '../prompts/systemPrompt';
import { buildUserPrompt } from '../prompts/generateTestsPrompt';

interface ApiError {
    status?: number;
    code?: string;
    message: string;
    headers?: Record<string, string>;
}

// Tool Use schema – Claude returns structured AL code instead of free-form text.
// This eliminates the need for fragile brace-counting extraction.
const RETURN_TEST_CODE_TOOL: Anthropic.Tool = {
    name: 'return_test_code',
    description: 'Return the generated AL test codeunit code.',
    input_schema: {
        type: 'object' as const,
        properties: {
            al_code: {
                type: 'string',
                description: 'The complete, compilable AL test codeunit code.',
            },
            test_count: {
                type: 'number',
                description: 'Number of [Test] procedures generated.',
            },
            summary: {
                type: 'string',
                description: 'One-sentence summary of what was generated.',
            },
        },
        required: ['al_code', 'test_count'],
    },
};

/**
 * ClaudeService – Anthropic Claude API Integration
 *
 * Changes vs. previous version:
 *  - Uses `system` parameter for instructions (better quality, cleaner separation)
 *  - Uses Tool Use (structured output) for reliable code extraction
 *  - Uses streaming for real-time progress feedback
 *  - Prompts are imported from src/prompts/ (easier to maintain without recompiling)
 *  - Model defaults to claude-sonnet-4-6
 */
export class ClaudeService {
    private client: Anthropic | null = null;
    private readonly maxRetries = 5;
    private readonly baseDelay = 1000;
    private readonly outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    private async initialize(): Promise<void> {
        const apiKey = await AuthService.instance.getApiKey();
        if (!apiKey) {
            throw new Error('API-Key nicht konfiguriert. Bitte mit "AL: Set Anthropic API Key" eingeben.');
        }
        this.client = new Anthropic({ apiKey });
        this.outputChannel.appendLine('Claude API Client initialisiert');
    }

    /**
     * Generate Test Code using Claude AI.
     * Streams the response into the output channel so the user sees progress.
     */
    public async generateTestCode(
        sourceCode: string,
        context: string,
        token: vscode.CancellationToken
    ): Promise<string> {
        if (!this.client) {
            await this.initialize();
        }
        const client = this.client!;

        return this.executeWithRetry(async () => {
            const timeout = ConfigService.getTimeout() * 1000;
            const controller = new AbortController();

            token.onCancellationRequested(() => {
                this.outputChannel.appendLine('API-Anfrage abgebrochen durch Benutzer');
                controller.abort();
            });
            const timeoutId = setTimeout(() => {
                this.outputChannel.appendLine(`Timeout nach ${timeout / 1000}s`);
                controller.abort();
            }, timeout);

            try {
                const userPrompt = buildUserPrompt({
                    sourceCode,
                    context,
                    generateMocks: ConfigService.shouldGenerateMocks(),
                    includeNegativeTests: ConfigService.shouldIncludeNegativeTests(),
                });

                const model = ConfigService.getModel();
                const maxTokens = ConfigService.getMaxTokens();
                this.outputChannel.appendLine(`\nModell: ${model} | Max Tokens: ${maxTokens}`);
                this.outputChannel.appendLine('Generiere Tests (Streaming)...\n');

                // ── Streaming request ────────────────────────────────────────────────
                const stream = client.messages.stream({
                    model,
                    max_tokens: maxTokens,
                    system: SYSTEM_PROMPT,
                    tools: [RETURN_TEST_CODE_TOOL],
                    tool_choice: { type: 'tool', name: 'return_test_code' },
                    messages: [{ role: 'user', content: userPrompt }],
                });

                // Stream progress dots into output channel
                let dotCount = 0;
                stream.on('text', () => {
                    if (++dotCount % 20 === 0) {
                        this.outputChannel.append('.');
                    }
                });

                const finalMessage = await stream.finalMessage();
                this.outputChannel.appendLine(`\nStop Reason: ${finalMessage.stop_reason}`);
                this.outputChannel.appendLine(`Usage: ${JSON.stringify(finalMessage.usage)}`);

                return this.extractCodeFromToolUse(finalMessage);

            } finally {
                clearTimeout(timeoutId);
            }
        });
    }

    /**
     * Extract AL code from a Tool Use response block.
     * Much more reliable than brace-counting on raw text.
     */
    private extractCodeFromToolUse(message: Anthropic.Message): string {
        const toolBlock = message.content.find(
            (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
        );

        if (!toolBlock) {
            const textBlock = message.content.find(
                (b): b is Anthropic.TextBlock => b.type === 'text'
            );
            if (textBlock?.text) {
                this.outputChannel.appendLine('⚠️ Kein Tool-Use-Block gefunden – Fallback auf Textextraktion');
                return this.extractCodeFallback(textBlock.text);
            }
            throw new Error('Keine verwertbare Antwort von Claude erhalten');
        }

        const input = toolBlock.input as { al_code: string; test_count?: number; summary?: string };

        if (input.test_count !== undefined) {
            this.outputChannel.appendLine(`✓ ${input.test_count} Test(s) generiert`);
        }
        if (input.summary) {
            this.outputChannel.appendLine(`ℹ ${input.summary}`);
        }

        const code = input.al_code?.trim();
        if (!code) {
            throw new Error('Leerer al_code im Tool-Use-Block');
        }
        return code;
    }

    /**
     * Fallback text extraction for cases where tool use is not available.
     */
    private extractCodeFallback(response: string): string {
        let code = response.trim().replace(/^```al\s*/gm, '').replace(/^```\s*/gm, '');
        const match = code.match(/codeunit\s+\d+\s+".+?"/);
        if (!match) {
            throw new Error('Keine gültige Codeunit-Deklaration in Response gefunden');
        }
        return code.substring(code.indexOf(match[0])).trim();
    }

    private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
        let attempt = 0;
        let lastError: Error | null = null;

        while (attempt < this.maxRetries) {
            try {
                return await fn();
            } catch (error: unknown) {
                const err = error as ApiError;
                lastError = error instanceof Error ? error : new Error(String(error));

                if (!this.isRetryableError(error) || attempt >= this.maxRetries - 1) {
                    throw lastError;
                }

                const retryAfter = err.headers?.['retry-after'];
                const delay = retryAfter
                    ? parseInt(retryAfter) * 1000
                    : Math.min(this.baseDelay * Math.pow(2, attempt) + Math.random() * 1000, 60_000);

                this.outputChannel.appendLine(
                    `Fehler: ${err.message}. Retry in ${delay / 1000}s (Versuch ${attempt + 1}/${this.maxRetries})`
                );
                await this.sleep(delay);
                attempt++;
            }
        }
        throw lastError ?? new Error('Max Retries überschritten');
    }

    private isRetryableError(error: unknown): boolean {
        const err = error as ApiError;
        return (
            err.status === 429 ||
            (!!err.status && err.status >= 500 && err.status < 600) ||
            err.code === 'ECONNRESET' ||
            err.code === 'ETIMEDOUT'
        );
    }

    public async validateApiKey(): Promise<boolean> {
        try {
            await this.initialize();
            if (!this.client) { return false; }
            const response = await this.client.messages.create({
                model: ConfigService.getModel(),
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Hello' }],
            });
            return response.stop_reason === 'end_turn' || response.stop_reason === 'max_tokens';
        } catch (error) {
            this.outputChannel.appendLine(`API Key Validierung fehlgeschlagen: ${error}`);
            return false;
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
