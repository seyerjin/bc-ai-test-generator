import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigService } from '../services/configService';

/**
 * FileHandler - Dateioperationen für AL-Tests
 * Implementiert FA7 - Automatisierte Testdateiverwaltung
 * Implementiert N-FA5 - Cross-Platform Kompatibilität
 */
export class FileHandler {
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    /**
     * Get Test File Path for Source File
     * Follows BC naming conventions: SourceFile.Test.al
     */
    public getTestFilePath(sourceUri: vscode.Uri): vscode.Uri {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(sourceUri);
        if (!workspaceFolder) {
            throw new Error('Datei ist nicht Teil eines Workspace');
        }

        const sourceDir = path.dirname(sourceUri.fsPath);
        const sourceName = path.basename(sourceUri.fsPath, '.al');
        const outputFolder = ConfigService.getOutputFolder();
        
        // Test directory: src/Test/
        const testDir = path.join(sourceDir, outputFolder);
        const testFileName = `${sourceName}.Test.al`;
        
        return vscode.Uri.file(path.join(testDir, testFileName));
    }

    /**
     * Write Test File
     * Creates directory if it doesn't exist
     */
    public async writeTestFile(testUri: vscode.Uri, content: string): Promise<void> {
        const testDir = path.dirname(testUri.fsPath);
        
        // Create directory if needed
        try {
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(testDir));
        } catch {
            // Directory might already exist
        }

        // Write file
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(testUri, encoder.encode(content));
        
        this.outputChannel.appendLine(`Test gespeichert: ${testUri.fsPath}`);
    }

    /**
     * Read AL File Content
     */
    public async readAlFile(uri: vscode.Uri): Promise<string> {
        const bytes = await vscode.workspace.fs.readFile(uri);
        const decoder = new TextDecoder();
        return decoder.decode(bytes);
    }

    /**
     * Check if Test File Already Exists
     */
    public async testFileExists(sourceUri: vscode.Uri): Promise<boolean> {
        const testUri = this.getTestFilePath(sourceUri);
        
        try {
            await vscode.workspace.fs.stat(testUri);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Open Test File in Editor
     */
    public async openTestFile(testUri: vscode.Uri): Promise<void> {
        const document = await vscode.workspace.openTextDocument(testUri);
        await vscode.window.showTextDocument(document);
    }

    /**
     * Get Next Available Test ID
     */
    public async getNextTestId(workspaceUri: vscode.Uri): Promise<number> {
        const startRange = ConfigService.getTestIdStartRange();
        
        // Find all test files in workspace
        const pattern = new vscode.RelativePattern(workspaceUri.fsPath, '**/Test/**/*.al');
        const files = await vscode.workspace.findFiles(pattern);
        
        const usedIds: number[] = [];
        
        for (const file of files) {
            const content = await this.readAlFile(file);
            const idMatch = content.match(/codeunit\s+(\d+)/i);
            
            if (idMatch) {
                const id = parseInt(idMatch[1]);
                if (id >= startRange) {
                    usedIds.push(id);
                }
            }
        }
        
        if (usedIds.length === 0) {
            return startRange;
        }
        
        usedIds.sort((a, b) => a - b);
        return usedIds[usedIds.length - 1] + 1;
    }
}
