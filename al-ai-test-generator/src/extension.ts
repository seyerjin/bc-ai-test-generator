import * as vscode from 'vscode';
import { AuthService } from './services/authService';
import { ClaudeService } from './services/claudeService';
import { TestGenerator } from './generators/testGenerator';
import { FileHandler } from './handlers/fileHandler';
import { AlParser } from './services/alParser';
import { ConfigService } from './services/configService';
import { IdService } from './services/idService';
import { MutationTestRunner, MutationTestConfig } from './mutation/mutationRunner';
import { MutationReportGenerator } from './mutation/reportGenerator';
import { MutationEngine } from './mutation/mutationEngine';

let outputChannel: vscode.OutputChannel;
let mutationRunner: MutationTestRunner;
let testGenerator: TestGenerator;

export async function activate(context: vscode.ExtensionContext) {
    console.log('AL AI Test Generator v2.1 (with Mutation Testing) aktiviert');
    
    outputChannel = vscode.window.createOutputChannel('AL AI Test Generator');
    outputChannel.appendLine('==============================================');
    outputChannel.appendLine('AL AI Test Generator v2.1 ACTIVATED');
    outputChannel.appendLine('==============================================');
    outputChannel.appendLine('Extension aktiviert mit Mutation Testing Support');
    outputChannel.appendLine('Commands verfügbar:');
    outputChannel.appendLine('  - AL: Generate Tests with AI');
    outputChannel.appendLine('  - AL: Run Mutation Tests');
    outputChannel.appendLine('  - AL: Set Anthropic API Key');
    outputChannel.appendLine('  - AL: Configure Mutation Testing');
    outputChannel.appendLine('  - AL: Reset Test ID Counter');
    outputChannel.appendLine('==============================================');
    outputChannel.show();
    
    AuthService.initialize(context);
    ConfigService.initialize();
    
    const claudeService = new ClaudeService(outputChannel);
    const alParser = new AlParser();
    const fileHandler = new FileHandler(outputChannel);
    const idService = new IdService(context, outputChannel);
    testGenerator = new TestGenerator(claudeService, alParser, fileHandler, idService, outputChannel);
    
    mutationRunner = new MutationTestRunner(outputChannel);
    
    context.subscriptions.push(
        vscode.commands.registerCommand('alTestGenerator.generateTests', generateTestsCommand),
        vscode.commands.registerCommand('alTestGenerator.setApiKey', setApiKeyCommand),
        vscode.commands.registerCommand('alTestGenerator.runMutationTests', runMutationTestsCommand),
        vscode.commands.registerCommand('alTestGenerator.configureMutationTesting', configureMutationTestingCommand),
        vscode.commands.registerCommand('alTestGenerator.resetTestId', () => resetTestIdCommand(idService))
    );
    
    outputChannel.appendLine('✅ Alle Commands erfolgreich registriert');
    outputChannel.appendLine('✅ Kontextmenü für AL-Dateien aktiv');
    outputChannel.appendLine('➡️  Rechtsklick auf .al Datei für Optionen');
    
    vscode.window.showInformationMessage('AL AI Test Generator v2.1 bereit!');
}

async function generateTestsCommand(uri?: vscode.Uri) {
    try {
        outputChannel.appendLine('\n=== Starting Test Generation ===');
        
        // 1. Get source file
        const sourceFile = uri || vscode.window.activeTextEditor?.document.uri;
        
        if (!sourceFile || !sourceFile.fsPath.endsWith('.al')) {
            vscode.window.showErrorMessage('Bitte wählen Sie eine AL-Datei aus');
            outputChannel.appendLine('❌ Keine AL-Datei ausgewählt');
            return;
        }
        
        outputChannel.appendLine(`📄 Source File: ${sourceFile.fsPath}`);
        
        // 2. Check API Key
        const apiKey = await AuthService.instance.getApiKey();
        if (!apiKey) {
            const setKey = await vscode.window.showErrorMessage(
                'Kein API-Key gefunden. Bitte setzen Sie zuerst Ihren Anthropic API-Key.',
                'API-Key setzen'
            );
            if (setKey) {
                await setApiKeyCommand();
            }
            return;
        }
        
        outputChannel.appendLine('✅ API-Key gefunden');
        
        // 3. Generate tests with progress
        const success = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generiere Tests mit AI...',
            cancellable: true
        }, async (progress, token) => {
            progress.report({ increment: 0, message: 'Analysiere Code...' });
            
            progress.report({ increment: 30, message: 'Generiere Tests...' });
            
            const result = await testGenerator.generateTestForFile(sourceFile, token);
            
            progress.report({ increment: 100, message: 'Fertig!' });
            
            return result;
        });
        
        if (success) {
            // Find generated test file
            const sourceDir = vscode.Uri.joinPath(sourceFile, '..');
            const testDir = vscode.Uri.joinPath(sourceDir, 'Test');
            const basename = sourceFile.fsPath.split('/').pop()?.replace('.al', '') || 'Test';
            const testFile = vscode.Uri.joinPath(testDir, `${basename}.Test.al`);
            
            outputChannel.appendLine(`✅ Test-Datei erstellt: ${testFile.fsPath}`);
            
            // Show success message WITHOUT blocking dialog
            vscode.window.showInformationMessage(
                'Tests erfolgreich generiert!',
                'Datei öffnen',
                'Test-Ordner öffnen'
            ).then(selection => {
                if (selection === 'Datei öffnen') {
                    vscode.workspace.openTextDocument(testFile).then(doc => {
                        vscode.window.showTextDocument(doc);
                    }, error => {
                        outputChannel.appendLine('⚠️  Test-Datei konnte nicht geöffnet werden');
                    });
                } else if (selection === 'Test-Ordner öffnen') {
                    vscode.commands.executeCommand('revealInExplorer', testDir);
                }
            });
            
            // Progress closes automatically after withProgress block
        } else {
            vscode.window.showWarningMessage('Test-Generierung wurde abgebrochen oder ist fehlgeschlagen');
        }
        
    } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        outputChannel.appendLine(`❌ Fehler: ${errorMsg}`);
        vscode.window.showErrorMessage(`Test-Generierung fehlgeschlagen: ${errorMsg}`);
    }
}

async function setApiKeyCommand() {
    const apiKey = await vscode.window.showInputBox({
        prompt: 'Geben Sie Ihren Anthropic API-Key ein',
        password: true,
        placeHolder: 'sk-ant-...'
    });
    
    if (apiKey) {
        await AuthService.instance.storeApiKey(apiKey);
        vscode.window.showInformationMessage('API-Key gespeichert');
    }
}

async function runMutationTestsCommand(uri?: vscode.Uri) {
    try {
        const sourceFile = uri || vscode.window.activeTextEditor?.document.uri;
        
        if (!sourceFile || !sourceFile.fsPath.endsWith('.al')) {
            vscode.window.showErrorMessage('Bitte wählen Sie eine AL-Datei aus');
            return;
        }
        
        const testFile = await findTestFile(sourceFile);
        if (!testFile) {
            vscode.window.showErrorMessage('Keine Test-Datei gefunden. Generieren Sie zuerst Tests.');
            return;
        }
        
        outputChannel.show();
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Running Mutation Tests...',
            cancellable: true
        }, async (progress, token) => {
            const config = getMutationTestConfig();
            const results = await mutationRunner.runMutationTests(sourceFile, testFile, config, token);
            
            if (results.length > 0) {
                const engine = new MutationEngine(outputChannel);
                const score = engine.calculateMutationScore(results);
                
                const reportGen = new MutationReportGenerator();
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(sourceFile);
                if (workspaceFolder) {
                    const reportDir = vscode.Uri.joinPath(workspaceFolder.uri, 'mutation-report');
                    await vscode.workspace.fs.createDirectory(reportDir);
                    
                    const reportUri = await reportGen.generateHtmlReport(results, score, sourceFile, reportDir);
                    
                    const openReport = await vscode.window.showInformationMessage(
                        `Mutation Score: ${score.mutationScoreIndicator}%`,
                        'Open Report'
                    );
                    
                    if (openReport) {
                        await vscode.env.openExternal(reportUri);
                    }
                }
            }
        });
        
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Mutation Testing failed: ${errorMsg}`);
    }
}

async function configureMutationTestingCommand() {
    const config = vscode.workspace.getConfiguration('alTestGenerator.mutation');
    
    const operators = await vscode.window.showQuickPick(
        ['AOR', 'ROR', 'LCR', 'SDL', 'RVR', 'BVR'],
        {
            canPickMany: true,
            placeHolder: 'Select enabled mutation operators',
            title: 'Configure Mutation Testing'
        }
    );
    
    if (operators) {
        await config.update('enabledOperators', operators, vscode.ConfigurationTarget.Workspace);
        vscode.window.showInformationMessage(`Enabled operators: ${operators.join(', ')}`);
    }
}

async function findTestFile(sourceFile: vscode.Uri): Promise<vscode.Uri | null> {
    const dir = vscode.Uri.joinPath(sourceFile, '..');
    const testDir = vscode.Uri.joinPath(dir, 'Test');
    const basename = sourceFile.fsPath.split('/').pop()?.replace('.al', '');
    const testFile = vscode.Uri.joinPath(testDir, `${basename}.Test.al`);
    
    try {
        await vscode.workspace.fs.stat(testFile);
        return testFile;
    } catch {
        return null;
    }
}

function getMutationTestConfig(): MutationTestConfig {
    const config = vscode.workspace.getConfiguration('alTestGenerator.mutation');
    
    return {
        testTimeout: config.get<number>('timeout') || 30000,
        parallelExecution: config.get<boolean>('parallelExecution') || true,
        maxParallelMutants: 5,
        stopOnFirstSurvivor: false,
        enabledOperators: config.get<string[]>('enabledOperators') || ['AOR', 'ROR', 'LCR', 'SDL', 'RVR', 'BVR']
    };
}

async function resetTestIdCommand(idService: IdService) {
    try {
        const result = await vscode.window.showWarningMessage(
            'Möchten Sie wirklich den Test-ID Counter zurücksetzen? Bei der nächsten Test-Generierung werden Sie nach einer neuen Start-ID gefragt.',
            'Ja',
            'Nein'
        );
        
        if (result === 'Ja') {
            await idService.resetTestId();
            vscode.window.showInformationMessage('Test-ID Counter wurde zurückgesetzt');
        }
    } catch (error) {
        outputChannel.appendLine(`Fehler beim Zurücksetzen: ${error}`);
        vscode.window.showErrorMessage('Fehler beim Zurücksetzen des Test-ID Counters');
    }
}

export function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}
