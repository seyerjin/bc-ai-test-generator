#!/usr/bin/env node

/**
 * Mutation Test Report Generator for AL-Code
 * Generiert erweiterte Berichte aus Stryker Mutation Testing Ergebnissen
 * 
 * Verwendung:
 *   node generate-report.js --input <raw.json> --baseline <baseline.json> --output <dir>
 * 
 * @author Matthias Seyer
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('🧬 Mutation Test Report Generator v1.0.0\n'));

// CLI Arguments parsen
const args = process.argv.slice(2);
const getArg = (flag) => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : null;
};

const inputPath = getArg('--input') || '.buildartifacts/mutation-report/raw.json';
const baselinePath = getArg('--baseline') || null;
const outputDir = getArg('--output') || '.buildartifacts/mutation-report';

// Hilfsfunktionen
const calculateMutationScore = (mutants) => {
  const total = mutants.length;
  const killed = mutants.filter(m => m.status === 'Killed').length;
  const timeout = mutants.filter(m => m.status === 'Timeout').length;
  
  return total > 0 ? ((killed + timeout) / total) * 100 : 0;
};

const categorizeMutants = (mutants) => {
  return {
    killed: mutants.filter(m => m.status === 'Killed'),
    survived: mutants.filter(m => m.status === 'Survived'),
    timeout: mutants.filter(m => m.status === 'Timeout'),
    error: mutants.filter(m => m.status === 'CompileError' || m.status === 'RuntimeError'),
    noCoverage: mutants.filter(m => m.status === 'NoCoverage')
  };
};

const getMutatorStats = (mutants) => {
  const stats = {};
  
  mutants.forEach(mutant => {
    const mutatorName = mutant.mutatorName || 'Unknown';
    if (!stats[mutatorName]) {
      stats[mutatorName] = { total: 0, killed: 0, survived: 0, timeout: 0, error: 0 };
    }
    
    stats[mutatorName].total++;
    
    switch (mutant.status) {
      case 'Killed': stats[mutatorName].killed++; break;
      case 'Survived': stats[mutatorName].survived++; break;
      case 'Timeout': stats[mutatorName].timeout++; break;
      default: stats[mutatorName].error++;
    }
  });
  
  Object.keys(stats).forEach(mutator => {
    const s = stats[mutator];
    s.score = s.total > 0 ? ((s.killed + s.timeout) / s.total) * 100 : 0;
  });
  
  return stats;
};

const getFileStats = (mutants) => {
  const fileGroups = {};
  
  mutants.forEach(mutant => {
    const fileName = mutant.fileName || 'Unknown';
    if (!fileGroups[fileName]) fileGroups[fileName] = [];
    fileGroups[fileName].push(mutant);
  });
  
  const fileStats = {};
  Object.keys(fileGroups).forEach(fileName => {
    const fileMutants = fileGroups[fileName];
    fileStats[fileName] = {
      total: fileMutants.length,
      killed: fileMutants.filter(m => m.status === 'Killed').length,
      survived: fileMutants.filter(m => m.status === 'Survived').length,
      score: calculateMutationScore(fileMutants)
    };
  });
  
  return fileStats;
};

const generateSummary = (report, baseline) => {
  const mutants = report.files.flatMap(f => f.mutants);
  const categories = categorizeMutants(mutants);
  const mutationScore = calculateMutationScore(mutants);
  
  const summary = {
    timestamp: new Date().toISOString(),
    mutationScore: mutationScore,
    totalMutants: mutants.length,
    killed: categories.killed.length,
    survived: categories.survived.length,
    timeout: categories.timeout.length,
    error: categories.error.length,
    noCoverage: categories.noCoverage.length,
    mutatorStats: getMutatorStats(mutants),
    fileStats: getFileStats(mutants),
    topSurvived: categories.survived
      .map(m => ({
        file: m.fileName,
        line: m.location?.start?.line || 0,
        mutator: m.mutatorName,
        original: m.originalCode || m.replacement,
        mutated: m.mutatedCode || m.replacement,
        description: m.description || 'N/A'
      }))
      .sort((a, b) => b.line - a.line)
      .slice(0, 10),
    rating: mutationScore >= 80 ? 'Excellent' :
            mutationScore >= 60 ? 'Good' :
            mutationScore >= 40 ? 'Fair' : 'Poor'
  };
  
  if (baseline) {
    summary.baseline = {
      score: baseline.mutationScore,
      delta: mutationScore - baseline.mutationScore,
      improvement: mutationScore > baseline.mutationScore,
      killed: {
        previous: baseline.killed,
        current: categories.killed.length,
        delta: categories.killed.length - baseline.killed
      },
      survived: {
        previous: baseline.survived,
        current: categories.survived.length,
        delta: categories.survived.length - baseline.survived
      }
    };
  }
  
  return summary;
};

const generateMarkdownReport = (summary) => {
  let md = `# Mutation Testing Report\n\n`;
  md += `**Generated:** ${new Date(summary.timestamp).toLocaleString()}\n\n`;
  
  md += `## Overall Score\n\n`;
  md += `**${summary.mutationScore.toFixed(2)}%** - ${summary.rating}\n\n`;
  
  if (summary.baseline) {
    const deltaIcon = summary.baseline.delta > 0 ? '📈' : summary.baseline.delta < 0 ? '📉' : '➡️';
    md += `**Change from baseline:** ${deltaIcon} ${summary.baseline.delta > 0 ? '+' : ''}${summary.baseline.delta.toFixed(2)}%\n\n`;
  }
  
  md += `## Metrics Summary\n\n`;
  md += `| Metric | Count | Percentage |\n`;
  md += `|--------|-------|------------|\n`;
  md += `| ✅ Killed | ${summary.killed} | ${((summary.killed/summary.totalMutants)*100).toFixed(1)}% |\n`;
  md += `| ❌ Survived | ${summary.survived} | ${((summary.survived/summary.totalMutants)*100).toFixed(1)}% |\n`;
  md += `| ⏱️ Timeout | ${summary.timeout} | ${((summary.timeout/summary.totalMutants)*100).toFixed(1)}% |\n`;
  md += `| 💥 Error | ${summary.error} | ${((summary.error/summary.totalMutants)*100).toFixed(1)}% |\n`;
  md += `| 📊 Total | ${summary.totalMutants} | 100% |\n\n`;
  
  md += `## Top Survived Mutants\n\n`;
  if (summary.topSurvived.length > 0) {
    summary.topSurvived.forEach((m, i) => {
      md += `### ${i + 1}. ${m.file}:${m.line}\n`;
      md += `- **Mutator:** ${m.mutator}\n`;
      md += `- **Original:** \`${m.original}\`\n`;
      md += `- **Mutated:** \`${m.mutated}\`\n\n`;
    });
  } else {
    md += `_All mutants were killed!_ ✅\n\n`;
  }
  
  md += `## Mutation Operators Performance\n\n`;
  md += `| Operator | Total | Killed | Survived | Score |\n`;
  md += `|----------|-------|--------|----------|-------|\n`;
  Object.entries(summary.mutatorStats).forEach(([name, stats]) => {
    md += `| ${name} | ${stats.total} | ${stats.killed} | ${stats.survived} | ${stats.score.toFixed(1)}% |\n`;
  });
  
  return md;
};

// Hauptlogik
async function main() {
  try {
    console.log(chalk.gray(`Reading input from: ${inputPath}`));
    
    if (!fs.existsSync(inputPath)) {
      console.error(chalk.red(`❌ Input file not found: ${inputPath}`));
      process.exit(1);
    }
    
    const rawReport = await fs.readJSON(inputPath);
    
    let baseline = null;
    if (baselinePath && fs.existsSync(baselinePath)) {
      console.log(chalk.gray(`Loading baseline from: ${baselinePath}`));
      baseline = await fs.readJSON(baselinePath);
    }
    
    console.log(chalk.gray('Generating summary...'));
    const summary = generateSummary(rawReport, baseline);
    
    await fs.ensureDir(outputDir);
    
    // JSON Summary
    const summaryPath = path.join(outputDir, 'summary.json');
    await fs.writeJSON(summaryPath, summary, { spaces: 2 });
    console.log(chalk.green(`✅ Summary saved to: ${summaryPath}`));
    
    // Markdown Report
    const markdown = generateMarkdownReport(summary);
    const mdPath = path.join(outputDir, 'report.md');
    await fs.writeFile(mdPath, markdown);
    console.log(chalk.green(`✅ Markdown report saved to: ${mdPath}`));
    
    // Console Output
    console.log('\n' + chalk.bold('Mutation Test Results:'));
    console.log(chalk.cyan(`Score: ${summary.mutationScore.toFixed(2)}% (${summary.rating})`));
    console.log(`Killed: ${chalk.green(summary.killed)} | Survived: ${chalk.red(summary.survived)} | Timeout: ${chalk.yellow(summary.timeout)}`);
    
    if (summary.baseline) {
      const deltaColor = summary.baseline.delta > 0 ? chalk.green : summary.baseline.delta < 0 ? chalk.red : chalk.gray;
      console.log(deltaColor(`\nChange from baseline: ${summary.baseline.delta > 0 ? '+' : ''}${summary.baseline.delta.toFixed(2)}%`));
    }
    
    console.log('\n' + chalk.bold.green('✅ Report generation complete!'));
    
    // Exit code based on threshold
    if (summary.mutationScore < 60) {
      console.log(chalk.red('\n⚠️  Mutation score below threshold (60%)'));
      process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error generating report:'), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
