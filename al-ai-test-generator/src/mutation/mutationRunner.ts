/**
 * Mutation Test Runner
 * Führt Tests gegen Mutanten aus und sammelt Ergebnisse
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { MutatedCode, MutationTestResult, MutationEngine, MutationScore } from './mutationEngine';

export interface MutationTestConfig {
    testTimeout: number; // milliseconds
    parallelExecution: boolean;
    maxParallelMutants: number;
    stopOnFirstSurvivor: boolean;
    enabledOperators: string[];
}

export class MutationTestRunner {
    private outputChannel: vscode.OutputChannel;
    private engine: MutationEngine;
    
    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
        this.engine = new MutationEngine(outputChannel);
    }

    /**
     * Run mutation testing on AL source file
     */
    async runMutationTests(
        sourceFile: vscode.Uri,
        testFile: vscode.Uri,
        config: MutationTestConfig,
        token: vscode.CancellationToken
    ): Promise<MutationTestResult[]> {
        this.outputChannel.appendLine('\n╔══════════════════════════════════════════╗');
        this.outputChannel.appendLine('║     MUTATION TESTING STARTED             ║');
        this.outputChannel.appendLine('╚══════════════════════════════════════════╝\n');
        
        // Read source code
        const sourceCode = await this.readFile(sourceFile);
        
        // Configure operators
        if (config.enabledOperators.length > 0) {
            this.engine.setActiveOperators(config.enabledOperators);
        }
        
        // Generate mutants
        const mutants = this.engine.generateMutants(sourceCode);
        
        if (mutants.length === 0) {
            this.outputChannel.appendLine('⚠️  No mutants generated. Code might be too simple.');
            return [];
        }
        
        this.outputChannel.appendLine(`\n📊 Generated ${mutants.length} mutants`);
        this.outputChannel.appendLine('⚙️  Configuration:');
        this.outputChannel.appendLine(`   - Timeout: ${config.testTimeout}ms`);
        this.outputChannel.appendLine(`   - Parallel: ${config.parallelExecution}`);
        this.outputChannel.appendLine(`   - Operators: ${config.enabledOperators.join(', ')}\n`);
        
        // Run tests against mutants
        const results: MutationTestResult[] = [];
        
        if (config.parallelExecution) {
            results.push(...await this.runParallel(mutants, sourceFile, testFile, config, token));
        } else {
            results.push(...await this.runSequential(mutants, sourceFile, testFile, config, token));
        }
        
        // Calculate and display mutation score
        const score = this.engine.calculateMutationScore(results);
        this.displayMutationScore(score);
        
        return results;
    }

    /**
     * Run mutants sequentially
     */
    private async runSequential(
        mutants: MutatedCode[],
        sourceFile: vscode.Uri,
        testFile: vscode.Uri,
        config: MutationTestConfig,
        token: vscode.CancellationToken
    ): Promise<MutationTestResult[]> {
        const results: MutationTestResult[] = [];
        
        for (let i = 0; i < mutants.length; i++) {
            if (token.isCancellationRequested) {
                this.outputChannel.appendLine('\n❌ Mutation testing cancelled by user');
                break;
            }
            
            const mutant = mutants[i];
            const mutantId = `M${i + 1}`;
            
            this.outputChannel.appendLine(`\n[${i + 1}/${mutants.length}] Testing mutant ${mutantId}...`);
            this.outputChannel.appendLine(`   Mutation: ${mutant.mutation.operator} at line ${mutant.mutation.line + 1}`);
            this.outputChannel.appendLine(`   ${mutant.mutation.original} → ${mutant.mutation.mutated}`);
            
            const result = await this.testMutant(mutantId, mutant, sourceFile, testFile, config);
            results.push(result);
            
            this.displayMutantResult(result);
            
            if (config.stopOnFirstSurvivor && result.status === 'survived') {
                this.outputChannel.appendLine('\n⚠️  Stop on first survivor enabled. Stopping...');
                break;
            }
        }
        
        return results;
    }

    /**
     * Run mutants in parallel
     */
    private async runParallel(
        mutants: MutatedCode[],
        sourceFile: vscode.Uri,
        testFile: vscode.Uri,
        config: MutationTestConfig,
        token: vscode.CancellationToken
    ): Promise<MutationTestResult[]> {
        const results: MutationTestResult[] = [];
        const batchSize = config.maxParallelMutants;
        
        for (let i = 0; i < mutants.length; i += batchSize) {
            if (token.isCancellationRequested) {
                this.outputChannel.appendLine('\n❌ Mutation testing cancelled');
                break;
            }
            
            const batch = mutants.slice(i, Math.min(i + batchSize, mutants.length));
            this.outputChannel.appendLine(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} mutants)...`);
            
            const batchResults = await Promise.all(
                batch.map((mutant, idx) => {
                    const mutantId = `M${i + idx + 1}`;
                    return this.testMutant(mutantId, mutant, sourceFile, testFile, config);
                })
            );
            
            results.push(...batchResults);
            
            // Display batch results
            batchResults.forEach(result => this.displayMutantResult(result));
        }
        
        return results;
    }

    /**
     * Test a single mutant
     */
    private async testMutant(
        mutantId: string,
        mutant: MutatedCode,
        sourceFile: vscode.Uri,
        testFile: vscode.Uri,
        config: MutationTestConfig
    ): Promise<MutationTestResult> {
        const startTime = Date.now();
        
        try {
            // 1. Write mutant to temporary file
            const mutantFile = await this.writeMutantFile(sourceFile, mutant.code);
            
            // 2. Run tests (simulated - in real implementation would use BC Test Runner)
            const testsPassed = await this.runTests(mutantFile, testFile, config.testTimeout);
            
            // 3. Clean up temporary file
            await this.deleteFile(mutantFile);
            
            const executionTime = Date.now() - startTime;
            
            if (testsPassed) {
                // Tests passed → mutant survived (bad!)
                return {
                    mutantId,
                    status: 'survived',
                    executionTime
                };
            } else {
                // Tests failed → mutant killed (good!)
                return {
                    mutantId,
                    status: 'killed',
                    killedBy: ['TestSuite'],
                    executionTime
                };
            }
            
        } catch (error) { // KORREKTUR: :any entfernt
            const executionTime = Date.now() - startTime;
            
            if (executionTime >= config.testTimeout) {
                return {
                    mutantId,
                    status: 'timeout',
                    executionTime,
                    errorMessage: 'Test execution timeout'
                };
            }
            
            // Safe error handling without 'any'
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            return {
                mutantId,
                status: 'error',
                executionTime,
                errorMessage
            };
        }
    }

    /**
     * Run tests against mutant (simulated)
     * In real implementation: use BC Test Runner API
     */
    private async runTests(
        _mutantFile: vscode.Uri, // KORREKTUR: Unterstrich hinzugefügt
        _testFile: vscode.Uri,   // KORREKTUR: Unterstrich hinzugefügt
        _timeout: number         // KORREKTUR: Unterstrich hinzugefügt
    ): Promise<boolean> {
        // Simulation: 80% chance mutant is killed
        await this.sleep(Math.random() * 500); // Simulate test execution
        return Math.random() > 0.8;
    }

    /**
     * Write mutant to temporary file
     */
    private async writeMutantFile(originalFile: vscode.Uri, mutantCode: string): Promise<vscode.Uri> {
        const dir = path.dirname(originalFile.fsPath);
        const basename = path.basename(originalFile.fsPath, '.al');
        const mutantPath = path.join(dir, `.${basename}.mutant.al`);
        const mutantUri = vscode.Uri.file(mutantPath);
        
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(mutantUri, encoder.encode(mutantCode));
        
        return mutantUri;
    }

    /**
     * Delete temporary file
     */
    private async deleteFile(file: vscode.Uri): Promise<void> {
        try {
            await vscode.workspace.fs.delete(file);
        } catch {
            // Ignore deletion errors
        }
    }

    /**
     * Read file content
     */
    private async readFile(file: vscode.Uri): Promise<string> {
        const bytes = await vscode.workspace.fs.readFile(file);
        const decoder = new TextDecoder();
        return decoder.decode(bytes);
    }

    /**
     * Display mutant test result
     */
    private displayMutantResult(result: MutationTestResult): void {
        const icon = this.getStatusIcon(result.status);
        const statusText = result.status.toUpperCase();
        const time = `${result.executionTime}ms`;
        
        this.outputChannel.appendLine(`   ${icon} ${statusText} (${time})`);
        
        if (result.status === 'killed' && result.killedBy) {
            this.outputChannel.appendLine(`      Killed by: ${result.killedBy.join(', ')}`);
        } else if (result.errorMessage) {
            this.outputChannel.appendLine(`      Error: ${result.errorMessage}`);
        }
    }

    /**
     * Display final mutation score
     */
    private displayMutationScore(score: MutationScore): void { // KORREKTUR: Typ von any zu MutationScore geändert
        this.outputChannel.appendLine('\n╔══════════════════════════════════════════╗');
        this.outputChannel.appendLine('║        MUTATION TESTING RESULTS          ║');
        this.outputChannel.appendLine('╚══════════════════════════════════════════╝\n');
        
        this.outputChannel.appendLine('📊 Mutation Statistics:');
        this.outputChannel.appendLine(`   Total Mutants:     ${score.totalMutants}`);
        this.outputChannel.appendLine(`   ✓ Killed:          ${score.killedMutants} (${this.percentage(score.killedMutants, score.totalMutants)}%)`);
        this.outputChannel.appendLine(`   ✗ Survived:        ${score.survivedMutants} (${this.percentage(score.survivedMutants, score.totalMutants)}%)`);
        this.outputChannel.appendLine(`   ⏱  Timeout:         ${score.timeoutMutants} (${this.percentage(score.timeoutMutants, score.totalMutants)}%)`);
        this.outputChannel.appendLine(`   ⚠️  Error:           ${score.errorMutants} (${this.percentage(score.errorMutants, score.totalMutants)}%)`);
        
        this.outputChannel.appendLine(`\n🎯 Mutation Score: ${score.score}%`);
        this.outputChannel.appendLine(`📈 Mutation Score Indicator: ${score.mutationScoreIndicator}%`);
        
        // Interpretation
        const quality = this.getQualityRating(score.mutationScoreIndicator);
        this.outputChannel.appendLine(`\n${quality.icon} Test Quality: ${quality.text}`);
        
        if (score.survivedMutants > 0) {
            this.outputChannel.appendLine(`\n⚠️  ${score.survivedMutants} mutant(s) survived. Consider improving test coverage!`);
        }
    }

    /**
     * Get status icon
     */
    private getStatusIcon(status: string): string {
        switch (status) {
            case 'killed': return '✅';
            case 'survived': return '❌';
            case 'timeout': return '⏱️';
            case 'error': return '⚠️';
            default: return '❓';
        }
    }

    /**
     * Calculate percentage
     */
    private percentage(value: number, total: number): string {
        if (total === 0) return '0.00'; // KORREKTUR: Single quotes sichergestellt
        return ((value / total) * 100).toFixed(2);
    }

    /**
     * Get quality rating based on mutation score
     */
    private getQualityRating(score: number): { icon: string; text: string } {
        if (score >= 80) return { icon: '🌟', text: 'Excellent' };
        if (score >= 60) return { icon: '👍', text: 'Good' };
        if (score >= 40) return { icon: '👌', text: 'Fair' };
        if (score >= 20) return { icon: '⚠️', text: 'Poor' };
        return { icon: '❌', text: 'Very Poor' };
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}