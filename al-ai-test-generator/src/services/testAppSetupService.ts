import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * TestAppSetupService - Erstellt Test App Struktur für BC
 * Implementiert Microsoft BC Best Practice: Separate Test App
 * https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-extension-advanced-example-test
 */
export class TestAppSetupService {
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    /**
     * Ensure Test App Structure Exists
     * Erstellt Ordnerstruktur und Dateien falls nicht vorhanden
     */
    public async ensureTestAppStructure(workspaceFolder: vscode.Uri): Promise<vscode.Uri> {
        const testAppRoot = vscode.Uri.file(path.join(workspaceFolder.fsPath, 'test'));
        const testSourceDir = vscode.Uri.file(path.join(testAppRoot.fsPath, 'source'));

        // Check if test app already exists
        const testAppJsonPath = vscode.Uri.file(path.join(testAppRoot.fsPath, 'app.json'));
        
        try {
            await vscode.workspace.fs.stat(testAppJsonPath);
            this.outputChannel.appendLine('✓ Test App Struktur existiert bereits');
            return testSourceDir;
        } catch {
            this.outputChannel.appendLine('\n=== Erstelle Test App Struktur ===');
            // Test app doesn't exist - create it
            await this.createTestAppStructure(workspaceFolder, testAppRoot, testSourceDir);
            return testSourceDir;
        }
    }

    /**
     * Create Complete Test App Structure
     */
    private async createTestAppStructure(
        workspaceFolder: vscode.Uri,
        testAppRoot: vscode.Uri,
        testSourceDir: vscode.Uri
    ): Promise<void> {
        // 1. Create directories
        this.outputChannel.appendLine('1. Erstelle Ordner...');
        await vscode.workspace.fs.createDirectory(testAppRoot);
        await vscode.workspace.fs.createDirectory(testSourceDir);

        // 2. Read main app.json to get app info
        const mainAppInfo = await this.readMainAppInfo(workspaceFolder);

        // 3. Create test app.json
        this.outputChannel.appendLine('2. Erstelle test/app.json...');
        await this.createTestAppJson(testAppRoot, mainAppInfo);

        // 4. Create launch.json
        this.outputChannel.appendLine('3. Erstelle test/launch.json...');
        await this.createLaunchJson(testAppRoot);

        this.outputChannel.appendLine('✓ Test App Struktur erfolgreich erstellt');
        this.outputChannel.appendLine(`  - ${testAppRoot.fsPath}/`);
        this.outputChannel.appendLine(`  - ${testAppRoot.fsPath}/app.json`);
        this.outputChannel.appendLine(`  - ${testAppRoot.fsPath}/launch.json`);
        this.outputChannel.appendLine(`  - ${testSourceDir.fsPath}/`);

        vscode.window.showInformationMessage(
            'Test App Struktur wurde erstellt. Bitte app.json und launch.json überprüfen.',
            'app.json öffnen'
        ).then(selection => {
            if (selection === 'app.json öffnen') {
                const testAppJsonPath = vscode.Uri.file(path.join(testAppRoot.fsPath, 'app.json'));
                vscode.workspace.openTextDocument(testAppJsonPath).then(doc => {
                    vscode.window.showTextDocument(doc);
                });
            }
        });
    }

    /**
     * Read Main App Information
     */
    private async readMainAppInfo(workspaceFolder: vscode.Uri): Promise<MainAppInfo> {
        // Try to find main app.json in various locations
        const possiblePaths = [
            path.join(workspaceFolder.fsPath, 'app.json'),           // Root
            path.join(workspaceFolder.fsPath, 'app', 'app.json'),    // app/
            path.join(workspaceFolder.fsPath, 'src', 'app.json')     // src/
        ];

        for (const appJsonPath of possiblePaths) {
            try {
                const content = await fs.promises.readFile(appJsonPath, 'utf8');
                const appJson = JSON.parse(content);
                
                this.outputChannel.appendLine(`✓ Haupt-App gefunden: ${appJsonPath}`);
                
                return {
                    id: appJson.id || this.generateGuid(),
                    publisher: appJson.publisher || 'YourPublisher',
                    name: appJson.name || 'YourAppName',
                    version: appJson.version || '1.0.0.0'
                };
            } catch {
                // Try next path
            }
        }

        // If no app.json found, use defaults
        this.outputChannel.appendLine('⚠ Keine Haupt-App app.json gefunden - verwende Defaults');
        return {
            id: this.generateGuid(),
            publisher: 'YourPublisher',
            name: 'YourAppName',
            version: '1.0.0.0'
        };
    }

    /**
     * Create Test App app.json
     */
    private async createTestAppJson(testAppRoot: vscode.Uri, mainAppInfo: MainAppInfo): Promise<void> {
        const testAppJson = {
            "id": this.generateGuid(),
            "name": `${mainAppInfo.name} Tests`,
            "publisher": mainAppInfo.publisher,
            "version": mainAppInfo.version,
            "brief": `Test App for ${mainAppInfo.name}`,
            "description": `Contains test codeunits for ${mainAppInfo.name}`,
            "privacyStatement": "",
            "EULA": "",
            "help": "",
            "url": "",
            "logo": "",
            "dependencies": [
                {
                    "id": mainAppInfo.id,
                    "publisher": mainAppInfo.publisher,
                    "name": mainAppInfo.name,
                    "version": mainAppInfo.version
                },
                {
                    "id": "23de40a6-dfe8-4f80-80db-d70f83ce8caf",
                    "publisher": "Microsoft",
                    "name": "Test Runner",
                    "version": "22.0.0.0"
                },
                {
                    "id": "dd0be2ea-f733-4d65-bb34-a28f4624fb14",
                    "publisher": "Microsoft",
                    "name": "Library Assert",
                    "version": "22.0.0.0"
                },
                {
                    "id": "9856ae4f-d1a7-46ef-89bb-6ef056398228",
                    "publisher": "Microsoft",
                    "name": "Any",
                    "version": "22.0.0.0"
                }
            ],
            "screenshots": [],
            "platform": "22.0.0.0",
            "application": "22.0.0.0",
            "idRanges": [
                {
                    "from": 50100,
                    "to": 50149
                }
            ],
            "resourceExposurePolicy": {
                "allowDebugging": true,
                "allowDownloadingSource": true,
                "includeSourceInSymbolFile": true
            },
            "runtime": "11.0",
            "features": [
                "NoImplicitWith"
            ],
            "target": "Cloud",
            "test": true
        };

        const content = JSON.stringify(testAppJson, null, 2);
        const appJsonPath = vscode.Uri.file(path.join(testAppRoot.fsPath, 'app.json'));
        
        await vscode.workspace.fs.writeFile(appJsonPath, Buffer.from(content, 'utf8'));
    }

    /**
     * Create launch.json for Test Runner
     */
    private async createLaunchJson(testAppRoot: vscode.Uri): Promise<void> {
        const launchJson = {
            "version": "0.2.0",
            "configurations": [
                {
                    "name": "Run Tests: Your own server",
                    "type": "al",
                    "request": "launch",
                    "server": "https://yourbcserver",
                    "serverInstance": "BC",
                    "authentication": "Windows",
                    "startupObjectType": "TestSuite",
                    "startupObjectId": 50100,
                    "breakOnError": "All",
                    "breakOnRecordWrite": false,
                    "launchBrowser": false,
                    "enableLongRunningSqlStatements": true,
                    "enableSqlInformationDebugger": true,
                    "tenant": "default"
                },
                {
                    "name": "Run Tests: BC SaaS",
                    "type": "al",
                    "request": "launch",
                    "environmentType": "Sandbox",
                    "environmentName": "YourSandboxName",
                    "startupObjectType": "TestSuite",
                    "startupObjectId": 50100,
                    "breakOnError": "All",
                    "breakOnRecordWrite": false,
                    "launchBrowser": false,
                    "enableLongRunningSqlStatements": true,
                    "enableSqlInformationDebugger": true
                }
            ]
        };

        const content = JSON.stringify(launchJson, null, 2);
        const launchJsonPath = vscode.Uri.file(path.join(testAppRoot.fsPath, 'launch.json'));
        
        await vscode.workspace.fs.writeFile(launchJsonPath, Buffer.from(content, 'utf8'));
    }

    /**
     * Generate GUID
     */
    private generateGuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Get Test Source Directory
     * Returns existing or creates new test/source/ directory
     */
    public async getTestSourceDirectory(workspaceFolder: vscode.Uri): Promise<vscode.Uri> {
        return await this.ensureTestAppStructure(workspaceFolder);
    }
}

interface MainAppInfo {
    id: string;
    publisher: string;
    name: string;
    version: string;
}
