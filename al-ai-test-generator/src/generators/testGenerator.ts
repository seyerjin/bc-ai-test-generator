import * as vscode from 'vscode';
import { ClaudeService } from '../services/claudeService';
import { AlParser, ALObject } from '../services/alParser';
import { FileHandler } from '../handlers/fileHandler';

/**
 * TestGenerator - Orchestriert Testgenerierung
 * Implementiert FA2 - KI-basierte Testfallgenerierung
 */
export class TestGenerator {
    constructor(
        private claudeService: ClaudeService,
        private alParser: AlParser,
        private fileHandler: FileHandler,
        private outputChannel: vscode.OutputChannel
    ) {}

    /**
     * Generate Test for AL File
     */
    public async generateTestForFile(
        sourceUri: vscode.Uri,
        token: vscode.CancellationToken
    ): Promise<boolean> {
        try {
            this.outputChannel.appendLine(`\n=== Generiere Test für: ${sourceUri.fsPath} ===`);
            
            // 1. Read source file
            const sourceCode = await this.fileHandler.readAlFile(sourceUri);
            
            // 2. Parse AL code (FA1)
            const alObject = this.alParser.parse(sourceCode);
            if (!alObject) {
                throw new Error('Konnte AL-Code nicht parsen');
            }
            
            this.outputChannel.appendLine(this.alParser.getSummary(alObject));
            
            // 3. Generate context
            const context = this.buildContext(alObject);
            
            // 4. Generate test code (FA2)
            const testCode = await this.claudeService.generateTestCode(
                sourceCode,
                context,
                token
            );
            
            // 5. Generate test ID
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(sourceUri);
            if (!workspaceFolder) {
                throw new Error('Kein Workspace gefunden');
            }
            
            const testId = await this.fileHandler.getNextTestId(workspaceFolder.uri);
            
            // 6. Replace placeholder ID
            const finalTestCode = testCode.replace(/codeunit\s+\d+/i, `codeunit ${testId}`);
            
            // 7. Write test file (FA7)
            const testUri = this.fileHandler.getTestFilePath(sourceUri);
            await this.fileHandler.writeTestFile(testUri, finalTestCode);
            
            // 8. Open in editor
            await this.fileHandler.openTestFile(testUri);
            
            this.outputChannel.appendLine('✓ Test erfolgreich generiert');
            return true;
            
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(`✗ Fehler: ${errorMsg}`);
            return false;
        }
    }

    /**
     * Generate Test from Raw Code
     */
    public async generateTestFromCode(
        code: string,
        token: vscode.CancellationToken
    ): Promise<string | null> {
        try {
            const alObject = this.alParser.parse(code);
            const context = alObject ? this.buildContext(alObject) : 'Unknown AL Object';
            
            return await this.claudeService.generateTestCode(code, context, token);
        } catch (error) {
            this.outputChannel.appendLine(`Fehler: ${error}`);
            return null;
        }
    }

    /**
     * Build Context String for AI
     */
    private buildContext(alObject: ALObject): string {
        const parts = [
            `Object Type: ${alObject.type}`,
            `Object ID: ${alObject.id}`,
            `Object Name: ${alObject.name}`,
            `Procedures: ${alObject.procedures.length}`,
            `Triggers: ${alObject.triggers.length}`
        ];

        if (alObject.procedures.length > 0) {
            parts.push('\nKey Procedures:');
            alObject.procedures.slice(0, 5).forEach(proc => {
                const params = proc.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
                const returnType = proc.returnType ? `: ${proc.returnType}` : '';
                parts.push(`  - ${proc.name}(${params})${returnType}`);
            });
        }

        if (alObject.dependencies.length > 0) {
            parts.push('\nDependencies:');
            alObject.dependencies.slice(0, 5).forEach(dep => {
                parts.push(`  - ${dep}`);
            });
        }

        return parts.join('\n');
    }
}
