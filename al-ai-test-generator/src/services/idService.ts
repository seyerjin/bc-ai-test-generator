import * as vscode from 'vscode';

/**
 * IdService - Verwaltet Test-IDs
 * Fragt User nach Start-ID und vergibt fortlaufende IDs
 */
export class IdService {
    private static readonly ID_KEY = 'al-ai-test-generator.currentTestId';
    private context: vscode.ExtensionContext;
    private outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
        this.context = context;
        this.outputChannel = outputChannel;
    }

    /**
     * Get Next Test ID
     * Fragt beim ersten Mal nach Start-ID, dann fortlaufend
     */
    public async getNextTestId(): Promise<number> {
        let currentId = this.context.workspaceState.get<number>(IdService.ID_KEY);

        // Wenn keine ID gespeichert ist, User fragen
        if (currentId === undefined) {
            currentId = await this.promptForStartId();
            if (currentId === undefined) {
                throw new Error('Keine Test-ID angegeben');
            }
        }

        // ID speichern für nächstes Mal
        const nextId = currentId + 1;
        await this.context.workspaceState.update(IdService.ID_KEY, nextId);

        this.outputChannel.appendLine(`Test-ID verwendet: ${currentId}`);
        return currentId;
    }

    /**
     * Prompt User for Start ID
     */
    private async promptForStartId(): Promise<number | undefined> {
        const input = await vscode.window.showInputBox({
            prompt: 'Geben Sie die Start-ID für Test-Codeunits ein',
            placeHolder: 'z.B. 50100',
            validateInput: (value) => {
                const num = parseInt(value);
                if (isNaN(num)) {
                    return 'Bitte geben Sie eine gültige Zahl ein';
                }
                if (num < 50000 || num > 99999) {
                    return 'ID sollte zwischen 50000 und 99999 liegen';
                }
                return null;
            }
        });

        if (!input) {
            return undefined;
        }

        const startId = parseInt(input);
        this.outputChannel.appendLine(`Start-ID gesetzt: ${startId}`);
        return startId;
    }

    /**
     * Reset Test ID Counter
     * Ermöglicht User neue Start-ID zu setzen
     */
    public async resetTestId(): Promise<void> {
        await this.context.workspaceState.update(IdService.ID_KEY, undefined);
        this.outputChannel.appendLine('Test-ID Counter zurückgesetzt');
        vscode.window.showInformationMessage('Test-ID Counter wurde zurückgesetzt. Bei der nächsten Test-Generierung werden Sie nach einer neuen Start-ID gefragt.');
    }

    /**
     * Get Current Test ID (without incrementing)
     */
    public getCurrentTestId(): number | undefined {
        return this.context.workspaceState.get<number>(IdService.ID_KEY);
    }

    /**
     * Set Test ID manually
     */
    public async setTestId(id: number): Promise<void> {
        await this.context.workspaceState.update(IdService.ID_KEY, id);
        this.outputChannel.appendLine(`Test-ID manuell gesetzt: ${id}`);
    }
}
