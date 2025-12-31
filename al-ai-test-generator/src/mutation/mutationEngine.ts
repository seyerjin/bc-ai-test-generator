/**
 * Mutation Testing Framework für AL-Code
 * Implementiert nach Best Practices für Mutation Testing
 * 
 * Mutation Operators:
 * - AOR (Arithmetic Operator Replacement)
 * - ROR (Relational Operator Replacement)
 * - LCR (Logical Connector Replacement)
 * - SDL (Statement Deletion)
 * - RVR (Return Value Replacement)
 * - BVR (Boundary Value Replacement)
 */

import * as vscode from 'vscode';

export interface MutationOperator {
    name: string;
    description: string;
    category: 'arithmetic' | 'relational' | 'logical' | 'statement' | 'value' | 'boundary';
    apply(code: string, location: CodeLocation): MutatedCode | null;
}

export interface CodeLocation {
    line: number;
    column: number;
    length: number;
}

export interface MutatedCode {
    code: string;
    mutation: MutationDescription;
    location: CodeLocation;
}

export interface MutationDescription {
    operator: string;
    original: string;
    mutated: string;
    line: number;
}

export interface MutationTestResult {
    mutantId: string;
    status: 'killed' | 'survived' | 'timeout' | 'error';
    killedBy?: string[];
    executionTime: number;
    errorMessage?: string;
}

export interface MutationScore {
    totalMutants: number;
    killedMutants: number;
    survivedMutants: number;
    timeoutMutants: number;
    errorMutants: number;
    score: number; // percentage
    mutationScoreIndicator: number; // (killed + timeout) / (total - error)
}

/**
 * Arithmetic Operator Replacement (AOR)
 */
export class ArithmeticOperatorMutation implements MutationOperator {
    name = 'AOR';
    description = 'Arithmetic Operator Replacement';
    category: 'arithmetic' = 'arithmetic';

    private readonly mutations: Map<string, string[]> = new Map([
        ['+', ['-', '*', '/']],
        ['-', ['+', '*', '/']],
        ['*', ['+', '-', '/']],
        ['/', ['+', '-', '*']],
        ['div', ['mod']],
        ['mod', ['div']]
    ]);

    apply(code: string, location: CodeLocation): MutatedCode | null {
        const lines = code.split('\n');
        const line = lines[location.line];
        
        for (const [original, replacements] of this.mutations) {
            const regex = new RegExp(`\\b${this.escapeRegex(original)}\\b`, 'g');
            const match = regex.exec(line);
            
            if (match && match.index >= location.column && match.index < location.column + location.length) {
                for (const replacement of replacements) {
                    const mutatedLine = line.replace(regex, replacement);
                    lines[location.line] = mutatedLine;
                    
                    return {
                        code: lines.join('\n'),
                        mutation: {
                            operator: this.name,
                            original,
                            mutated: replacement,
                            line: location.line
                        },
                        location
                    };
                }
            }
        }
        
        return null;
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

/**
 * Relational Operator Replacement (ROR)
 */
export class RelationalOperatorMutation implements MutationOperator {
    name = 'ROR';
    description = 'Relational Operator Replacement';
    category: 'relational' = 'relational';

    private readonly mutations: Map<string, string[]> = new Map([
        ['>', ['>=', '<', '<=', '=', '<>']],
        ['>=', ['>', '<', '<=', '=', '<>']],
        ['<', ['<=', '>', '>=', '=', '<>']],
        ['<=', ['<', '>', '>=', '=', '<>']],
        ['=', ['<>', '>', '<']],
        ['<>', ['=', '>', '<']]
    ]);

    apply(code: string, location: CodeLocation): MutatedCode | null {
        const lines = code.split('\n');
        const line = lines[location.line];
        
        for (const [original, replacements] of this.mutations) {
            const regex = new RegExp(this.escapeRegex(original), 'g');
            const match = regex.exec(line);
            
            if (match && match.index >= location.column && match.index < location.column + location.length) {
                for (const replacement of replacements) {
                    const mutatedLine = line.replace(regex, replacement);
                    lines[location.line] = mutatedLine;
                    
                    return {
                        code: lines.join('\n'),
                        mutation: {
                            operator: this.name,
                            original,
                            mutated: replacement,
                            line: location.line
                        },
                        location
                    };
                }
            }
        }
        
        return null;
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

/**
 * Logical Connector Replacement (LCR)
 */
export class LogicalOperatorMutation implements MutationOperator {
    name = 'LCR';
    description = 'Logical Connector Replacement';
    category: 'logical' = 'logical';

    private readonly mutations: Map<string, string[]> = new Map([
        ['and', ['or']],
        ['or', ['and']],
        ['not', ['']]  // Remove NOT
    ]);

    apply(code: string, location: CodeLocation): MutatedCode | null {
        const lines = code.split('\n');
        const line = lines[location.line];
        
        for (const [original, replacements] of this.mutations) {
            const regex = new RegExp(`\\b${original}\\b`, 'gi');
            const match = regex.exec(line);
            
            if (match && match.index >= location.column && match.index < location.column + location.length) {
                for (const replacement of replacements) {
                    const mutatedLine = line.replace(regex, replacement);
                    lines[location.line] = mutatedLine;
                    
                    return {
                        code: lines.join('\n'),
                        mutation: {
                            operator: this.name,
                            original,
                            mutated: replacement || '[removed]',
                            line: location.line
                        },
                        location
                    };
                }
            }
        }
        
        return null;
    }
}

/**
 * Statement Deletion (SDL)
 */
export class StatementDeletionMutation implements MutationOperator {
    name = 'SDL';
    description = 'Statement Deletion';
    category: 'statement' = 'statement';

    apply(code: string, location: CodeLocation): MutatedCode | null {
        const lines = code.split('\n');
        const line = lines[location.line].trim();
        
        // Don't delete declarations, begin/end, or empty lines
        if (line.startsWith('var ') || 
            line.startsWith('begin') || 
            line.startsWith('end') ||
            line.length === 0) {
            return null;
        }
        
        const original = lines[location.line];
        lines[location.line] = ''; // Delete the line
        
        return {
            code: lines.join('\n'),
            mutation: {
                operator: this.name,
                original: original.trim(),
                mutated: '[deleted]',
                line: location.line
            },
            location
        };
    }
}

/**
 * Return Value Replacement (RVR)
 */
export class ReturnValueMutation implements MutationOperator {
    name = 'RVR';
    description = 'Return Value Replacement';
    category: 'value' = 'value';

    private readonly mutations: Map<string, string[]> = new Map([
        ['true', ['false']],
        ['false', ['true']],
        ['0', ['1', '-1']],
        ['1', ['0', '-1']],
        ["''", ["'MUTATED'"]]
    ]);

    apply(code: string, location: CodeLocation): MutatedCode | null {
        const lines = code.split('\n');
        const line = lines[location.line];
        
        // Look for exit() statements
        const exitMatch = line.match(/exit\s*\(\s*([^)]+)\s*\)/i);
        if (exitMatch) {
            const returnValue = exitMatch[1].trim();
            
            for (const [original, replacements] of this.mutations) {
                if (returnValue === original) {
                    for (const replacement of replacements) {
                        const mutatedLine = line.replace(exitMatch[0], `exit(${replacement})`);
                        lines[location.line] = mutatedLine;
                        
                        return {
                            code: lines.join('\n'),
                            mutation: {
                                operator: this.name,
                                original: `exit(${original})`,
                                mutated: `exit(${replacement})`,
                                line: location.line
                            },
                            location
                        };
                    }
                }
            }
        }
        
        return null;
    }
}

/**
 * Boundary Value Replacement (BVR)
 */
export class BoundaryValueMutation implements MutationOperator {
    name = 'BVR';
    description = 'Boundary Value Replacement';
    category: 'boundary' = 'boundary';

    apply(code: string, location: CodeLocation): MutatedCode | null {
        const lines = code.split('\n');
        const line = lines[location.line];
        
        // Find numeric literals
        const numberMatch = line.match(/\b(\d+)\b/);
        if (numberMatch) {
            const original = numberMatch[1];
            const value = parseInt(original);
            
            // Create boundary mutations: n → n+1, n → n-1, n → 0
            const mutations = [
                (value + 1).toString(),
                (value - 1).toString(),
                value !== 0 ? '0' : '1'
            ];
            
            for (const replacement of mutations) {
                const mutatedLine = line.replace(new RegExp(`\\b${original}\\b`), replacement);
                lines[location.line] = mutatedLine;
                
                return {
                    code: lines.join('\n'),
                    mutation: {
                        operator: this.name,
                        original,
                        mutated: replacement,
                        line: location.line
                    },
                    location
                };
            }
        }
        
        return null;
    }
}

/**
 * Mutation Testing Engine
 */
export class MutationEngine {
    private operators: MutationOperator[];
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
        this.operators = [
            new ArithmeticOperatorMutation(),
            new RelationalOperatorMutation(),
            new LogicalOperatorMutation(),
            new StatementDeletionMutation(),
            new ReturnValueMutation(),
            new BoundaryValueMutation()
        ];
    }

    /**
     * Generate all possible mutants for given code
     */
    generateMutants(code: string): MutatedCode[] {
        const mutants: MutatedCode[] = [];
        const lines = code.split('\n');
        
        this.outputChannel.appendLine('\n=== Generating Mutants ===');
        
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];
            
            // Skip comments and empty lines
            if (line.trim().startsWith('//') || line.trim().length === 0) {
                continue;
            }
            
            const location: CodeLocation = {
                line: lineNum,
                column: 0,
                length: line.length
            };
            
            for (const operator of this.operators) {
                const mutant = operator.apply(code, location);
                if (mutant) {
                    mutants.push(mutant);
                    this.outputChannel.appendLine(
                        `Mutant #${mutants.length}: ${operator.name} at line ${lineNum + 1}: ${mutant.mutation.original} → ${mutant.mutation.mutated}`
                    );
                }
            }
        }
        
        this.outputChannel.appendLine(`\nTotal mutants generated: ${mutants.length}`);
        return mutants;
    }

    /**
     * Calculate mutation score from test results
     */
    calculateMutationScore(results: MutationTestResult[]): MutationScore {
        const totalMutants = results.length;
        const killedMutants = results.filter(r => r.status === 'killed').length;
        const survivedMutants = results.filter(r => r.status === 'survived').length;
        const timeoutMutants = results.filter(r => r.status === 'timeout').length;
        const errorMutants = results.filter(r => r.status === 'error').length;
        
        const validMutants = totalMutants - errorMutants;
        const mutationScoreIndicator = validMutants > 0 
            ? ((killedMutants + timeoutMutants) / validMutants) * 100 
            : 0;
        
        const score = totalMutants > 0 
            ? (killedMutants / totalMutants) * 100 
            : 0;
        
        return {
            totalMutants,
            killedMutants,
            survivedMutants,
            timeoutMutants,
            errorMutants,
            score: Math.round(score * 100) / 100,
            mutationScoreIndicator: Math.round(mutationScoreIndicator * 100) / 100
        };
    }

    /**
     * Get all available operators
     */
    getOperators(): MutationOperator[] {
        return this.operators;
    }

    /**
     * Enable/disable specific operators
     */
    setActiveOperators(operatorNames: string[]): void {
        // Filter to only enabled operators
        const enabledOperators: MutationOperator[] = [];
        
        for (const name of operatorNames) {
            const operator = this.operators.find(op => op.name === name);
            if (operator) {
                enabledOperators.push(operator);
            }
        }
        
        if (enabledOperators.length > 0) {
            this.operators = enabledOperators;
            this.outputChannel.appendLine(`Active operators: ${enabledOperators.map(op => op.name).join(', ')}`);
        }
    }
}
