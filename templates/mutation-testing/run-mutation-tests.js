#!/usr/bin/env node

/**
 * Mutation Test Runner for AL-Code
 * Führt Mutation Testing durch und generiert Berichte
 * 
 * @author Matthias Seyer
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue.bold('\n🧬 AL Mutation Test Runner v1.0.0\n'));

// CLI Flags
const isDryRun = process.argv.includes('--dry-run');
const isIncremental = process.argv.includes('--incremental');

// Pfade
const projectRoot = path.resolve(__dirname, '../..');
const buildArtifactsDir = path.join(projectRoot, '.buildartifacts');
const mutationReportDir = path.join(buildArtifactsDir, 'mutation-report');
const appsDir = path.join(projectRoot, '.artifacts/apps');
const testAppsDir = path.join(projectRoot, '.artifacts/testapps');

console.log(chalk.gray('Configuration:'));
console.log(chalk.gray(`  Project Root: ${projectRoot}`));
console.log(chalk.gray(`  Apps Dir: ${appsDir}`));
console.log(chalk.gray(`  Test Apps Dir: ${testAppsDir}`));
console.log(chalk.gray(`  Dry Run: ${isDryRun}`));
console.log(chalk.gray(`  Incremental: ${isIncremental}\n`));

// Mutation Operators für AL-Code
const MUTATION_OPERATORS = {
  AOR: { // Arithmetic Operator Replacement
    description: 'Replaces +, -, *, /, div, mod operators',
    mutations: [
      { from: '+', to: '-' },
      { from: '-', to: '+' },
      { from: '*', to: '/' },
      { from: '/', to: '*' },
      { from: 'div', to: 'mod' },
      { from: 'mod', to: 'div' }
    ]
  },
  ROR: { // Relational Operator Replacement
    description: 'Replaces <, >, <=, >=, =, <> operators',
    mutations: [
      { from: '>', to: '<=' },
      { from: '>=', to: '<' },
      { from: '<', to: '>=' },
      { from: '<=', to: '>' },
      { from: '=', to: '<>' },
      { from: '<>', to: '=' }
    ]
  },
  LCR: { // Logical Connector Replacement
    description: 'Replaces AND, OR, NOT operators',
    mutations: [
      { from: 'and', to: 'or' },
      { from: 'or', to: 'and' },
      { from: 'not', to: '' }
    ]
  },
  SDL: { // Statement Deletion
    description: 'Deletes statements to check if tests detect missing code',
    patterns: [
      /^\s*(if|while|repeat|for)\b/i,
      /^\s*(exit|break|continue)\b/i,
      /^\s*(\w+)\s*:=\s*/
    ]
  },
  RVR: { // Return Value Replacement
    description: 'Replaces boolean return values',
    mutations: [
      { from: 'true', to: 'false' },
      { from: 'false', to: 'true' }
    ]
  },
  BVR: { // Boundary Value Replacement
    description: 'Adjusts numeric literals by ±1',
    patterns: [
      /\b(\d+)\b/
    ]
  }
};

/**
 * Findet alle AL-Dateien im Projekt
 */
function findALFiles(dir) {
  const alFiles = [];
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Ignoriere Test- und Build-Verzeichnisse
        if (!['Test', 'test', '.buildartifacts', '.alpackages', 'node_modules'].includes(entry.name)) {
          traverse(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.al')) {
        // Ignoriere Test-Dateien
        if (!entry.name.includes('Test') && !entry.name.startsWith('Test')) {
          alFiles.push(fullPath);
        }
      }
    }
  }
  
  if (fs.existsSync(dir)) {
    traverse(dir);
  }
  
  return alFiles;
}

/**
 * Generiert Mutanten für eine AL-Datei
 */
function generateMutants(filePath, content, operator) {
  const mutants = [];
  const lines = content.split('\n');
  
  if (operator === 'AOR' || operator === 'ROR' || operator === 'LCR' || operator === 'RVR') {
    const opConfig = MUTATION_OPERATORS[operator];
    
    lines.forEach((line, lineIndex) => {
      opConfig.mutations.forEach(mutation => {
        if (line.includes(mutation.from)) {
          const mutatedLine = line.replace(new RegExp(`\\b${mutation.from}\\b`, 'gi'), mutation.to);
          const mutatedContent = [...lines];
          mutatedContent[lineIndex] = mutatedLine;
          
          mutants.push({
            id: `${operator}_${lineIndex}_${mutation.from}_${mutation.to}`,
            operator: operator,
            file: filePath,
            line: lineIndex + 1,
            original: line.trim(),
            mutated: mutatedLine.trim(),
            content: mutatedContent.join('\n'),
            status: 'Pending'
          });
        }
      });
    });
  }
  
  return mutants;
}

/**
 * Führt Tests gegen einen Mutanten aus
 */
async function runTestsAgainstMutant(mutant) {
  const tempFile = mutant.file + '.mutant';
  
  try {
    // Sichere Original
    await fs.copy(mutant.file, mutant.file + '.original');
    
    // Schreibe Mutanten
    await fs.writeFile(mutant.file, mutant.content);
    
    // Führe Tests aus (PowerShell Command für BC Tests)
    const testCommand = `powershell -Command "& { Import-Module BcContainerHelper; Invoke-BCTests -Verbose -ErrorAction Stop }"`;
    
    try {
      execSync(testCommand, {
        cwd: projectRoot,
        stdio: 'pipe',
        timeout: 60000 // 60 Sekunden Timeout
      });
      
      // Test passed mit Mutant -> SURVIVED
      mutant.status = 'Survived';
      
    } catch (error) {
      // Test failed mit Mutant -> KILLED
      mutant.status = 'Killed';
    }
    
  } catch (error) {
    mutant.status = 'Error';
    mutant.error = error.message;
  } finally {
    // Stelle Original wieder her
    if (await fs.pathExists(mutant.file + '.original')) {
      await fs.move(mutant.file + '.original', mutant.file, { overwrite: true });
    }
  }
  
  return mutant;
}

/**
 * Hauptfunktion
 */
async function main() {
  try {
    // Erstelle Output-Verzeichnisse
    await fs.ensureDir(mutationReportDir);
    
    // Finde AL-Dateien
    console.log(chalk.blue('📂 Finding AL files...'));
    const srcDir = path.join(projectRoot, 'src');
    const alFiles = findALFiles(srcDir);
    console.log(chalk.green(`✅ Found ${alFiles.length} AL files\n`));
    
    if (alFiles.length === 0) {
      console.log(chalk.yellow('⚠️  No AL files found. Exiting.'));
      process.exit(0);
    }
    
    // Generiere Mutanten
    console.log(chalk.blue('🧬 Generating mutants...'));
    const allMutants = [];
    
    for (const filePath of alFiles) {
      const content = await fs.readFile(filePath, 'utf-8');
      const relPath = path.relative(projectRoot, filePath);
      
      console.log(chalk.gray(`  Processing: ${relPath}`));
      
      // Generiere für jeden Operator
      Object.keys(MUTATION_OPERATORS).forEach(operator => {
        const mutants = generateMutants(filePath, content, operator);
        allMutants.push(...mutants);
      });
    }
    
    console.log(chalk.green(`✅ Generated ${allMutants.length} mutants\n`));
    
    if (isDryRun) {
      console.log(chalk.yellow('🔍 Dry run mode - not executing tests\n'));
      
      // Speichere Dry-Run Report
      const dryRunReport = {
        timestamp: new Date().toISOString(),
        totalMutants: allMutants.length,
        mutantsByOperator: Object.keys(MUTATION_OPERATORS).reduce((acc, op) => {
          acc[op] = allMutants.filter(m => m.operator === op).length;
          return acc;
        }, {}),
        mutants: allMutants
      };
      
      await fs.writeJSON(
        path.join(mutationReportDir, 'dry-run.json'),
        dryRunReport,
        { spaces: 2 }
      );
      
      console.log(chalk.green('✅ Dry run report saved\n'));
      return;
    }
    
    // Führe Mutation Tests aus
    console.log(chalk.blue('🧪 Running mutation tests...'));
    console.log(chalk.gray('This may take several minutes...\n'));
    
    const startTime = Date.now();
    let completed = 0;
    
    for (const mutant of allMutants) {
      await runTestsAgainstMutant(mutant);
      completed++;
      
      // Progress
      if (completed % 10 === 0 || completed === allMutants.length) {
        const progress = ((completed / allMutants.length) * 100).toFixed(1);
        console.log(chalk.gray(`  Progress: ${completed}/${allMutants.length} (${progress}%)`));
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Ergebnisse zusammenfassen
    const killed = allMutants.filter(m => m.status === 'Killed').length;
    const survived = allMutants.filter(m => m.status === 'Survived').length;
    const errors = allMutants.filter(m => m.status === 'Error').length;
    const mutationScore = ((killed / allMutants.length) * 100).toFixed(2);
    
    console.log('\n' + chalk.bold('Mutation Test Results:'));
    console.log(chalk.cyan(`  Mutation Score: ${mutationScore}%`));
    console.log(chalk.green(`  Killed: ${killed}`));
    console.log(chalk.red(`  Survived: ${survived}`));
    console.log(chalk.yellow(`  Errors: ${errors}`));
    console.log(chalk.gray(`  Duration: ${duration}s\n`));
    
    // Speichere Raw-Report
    const rawReport = {
      timestamp: new Date().toISOString(),
      duration: parseFloat(duration),
      files: alFiles.map(f => ({
        fileName: path.relative(projectRoot, f),
        mutants: allMutants.filter(m => m.file === f)
      }))
    };
    
    await fs.writeJSON(
      path.join(mutationReportDir, 'raw.json'),
      rawReport,
      { spaces: 2 }
    );
    
    // Generiere Summary
    const summary = {
      timestamp: new Date().toISOString(),
      mutationScore: parseFloat(mutationScore),
      totalMutants: allMutants.length,
      killed: killed,
      survived: survived,
      timeout: 0,
      error: errors
    };
    
    await fs.writeJSON(
      path.join(mutationReportDir, 'summary.json'),
      summary,
      { spaces: 2 }
    );
    
    console.log(chalk.green('✅ Reports saved to:'), mutationReportDir);
    console.log(chalk.gray('  - raw.json'));
    console.log(chalk.gray('  - summary.json\n'));
    
    // Exit code basierend auf Threshold
    if (parseFloat(mutationScore) < 60) {
      console.log(chalk.red('⚠️  Mutation score below threshold (60%)\n'));
      process.exit(1);
    }
    
    console.log(chalk.green.bold('✅ Mutation testing complete!\n'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error during mutation testing:'), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
