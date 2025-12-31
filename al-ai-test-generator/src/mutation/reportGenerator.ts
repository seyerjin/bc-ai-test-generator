import * as vscode from 'vscode';
import * as path from 'path';
import { MutationTestResult, MutationScore } from './mutationEngine';

export class MutationReportGenerator {
    async generateHtmlReport(
        results: MutationTestResult[],
        score: MutationScore,
        sourceFile: vscode.Uri,
        outputDir: vscode.Uri
    ): Promise<vscode.Uri> {
        const html = this.buildHtmlReport(results, score, sourceFile);
        const reportPath = path.join(outputDir.fsPath, 'mutation-report.html');
        const reportUri = vscode.Uri.file(reportPath);
        
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(reportUri, encoder.encode(html));
        
        return reportUri;
    }

    private buildHtmlReport(results: MutationTestResult[], score: MutationScore, sourceFile: vscode.Uri): string {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Mutation Testing Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; }
        .header { text-align: center; border-bottom: 3px solid #2196F3; padding-bottom: 20px; }
        .score { font-size: 48px; font-weight: bold; color: ${this.getScoreColor(score.mutationScoreIndicator)}; }
        .stats { display: flex; justify-content: space-around; margin: 30px 0; }
        .stat { text-align: center; }
        .stat-value { font-size: 36px; font-weight: bold; }
        .mutants { margin-top: 30px; }
        .mutant { padding: 15px; margin: 10px 0; border-left: 4px solid; }
        .killed { background: #e8f5e9; border-color: #4caf50; }
        .survived { background: #ffebee; border-color: #f44336; }
        .timeout { background: #fff3e0; border-color: #ff9800; }
        .error { background: #f3e5f5; border-color: #9c27b0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Mutation Testing Report</h1>
            <p>${path.basename(sourceFile.fsPath)}</p>
            <div class="score">${score.mutationScoreIndicator}%</div>
            <p>Mutation Score Indicator</p>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value" style="color: #4caf50;">${score.killedMutants}</div>
                <div>Killed</div>
            </div>
            <div class="stat">
                <div class="stat-value" style="color: #f44336;">${score.survivedMutants}</div>
                <div>Survived</div>
            </div>
            <div class="stat">
                <div class="stat-value" style="color: #ff9800;">${score.timeoutMutants}</div>
                <div>Timeout</div>
            </div>
            <div class="stat">
                <div class="stat-value">${score.totalMutants}</div>
                <div>Total</div>
            </div>
        </div>
        
        <div class="mutants">
            <h2>Mutant Details</h2>
            ${results.map((r, i) => this.renderMutant(r, i + 1)).join('')}
        </div>
    </div>
</body>
</html>`;
    }

    private renderMutant(result: MutationTestResult, index: number): string {
        return `<div class="mutant ${result.status}">
            <strong>#${index} ${result.mutantId}</strong> - ${result.status.toUpperCase()}
            <div style="margin-top: 5px; color: #666;">
                Execution time: ${result.executionTime}ms
                ${result.killedBy ? `<br>Killed by: ${result.killedBy.join(', ')}` : ''}
                ${result.errorMessage ? `<br>Error: ${result.errorMessage}` : ''}
            </div>
        </div>`;
    }

    private getScoreColor(score: number): string {
        if (score >= 80) return '#4caf50';
        if (score >= 60) return '#8bc34a';
        if (score >= 40) return '#ff9800';
        return '#f44336';
    }
}
