/**
 * AL Code Parser - Analysiert AL-Code-Struktur
 * Implementiert FA1 - Automatisierte AL-Codeanalyse
 */

export interface ALObject {
    type: 'table' | 'page' | 'codeunit' | 'report' | 'query' | 'xmlport' | 'enum' | 
          'tableextension' | 'pageextension' | 'reportextension' | 'enumextension';
    id: number;
    name: string;
    procedures: ALProcedure[];
    triggers: ALTrigger[];
    variables: ALVariable[];
    fields?: ALField[];
    dependencies: string[];
    extendsObject?: string; // Für Extensions: welches Object erweitert wird
}

export interface ALProcedure {
    name: string;
    parameters: ALParameter[];
    returnType?: string;
    isLocal: boolean;
    attributes: string[];
}

export interface ALParameter {
    name: string;
    type: string;
    isVar: boolean;
}

export interface ALTrigger {
    name: string;
}

export interface ALVariable {
    name: string;
    type: string;
}

export interface ALField {
    name: string;
    type: string;
    id?: number;
}

export class AlParser {
    private static readonly OBJECT_PATTERN = /(table|page|codeunit|report|query|xmlport|enum|tableextension|pageextension|reportextension|enumextension)\s+(\d+)\s+"?([^"\n{]+)"?/gi;
    private static readonly EXTENDS_PATTERN = /extends\s+"?([^"\n{]+)"?/gi;
    private static readonly PROCEDURE_PATTERN = /(local\s+|internal\s+|protected\s+)?(procedure)\s+(\w+)\s*\((.*?)\)(?:\s*:\s*(\w+))?/gi;
    private static readonly TRIGGER_PATTERN = /trigger\s+(On\w+)\s*\(/gi;
    private static readonly FIELD_PATTERN = /field\s*\(\s*(\d+)\s*;\s*"?([^";]+)"?\s*;\s*(\w+)/gi;
    private static readonly VAR_PATTERN = /(\w+)\s*:\s*(Record|Codeunit|Page|Report|Query|Integer|Text|Boolean|Decimal|Date|Time|DateTime|Duration|Option)\s*[";]/gi;

    /**
     * Parse AL Code and Extract Structure
     * @param alCode - AL source code
     * @returns Parsed AL Object or null
     */
    public parse(alCode: string): ALObject | null {
        const objectMatch = AlParser.OBJECT_PATTERN.exec(alCode);
        if (!objectMatch) {
            return null;
        }

        AlParser.OBJECT_PATTERN.lastIndex = 0;

        const result: ALObject = {
            type: objectMatch[1].toLowerCase() as ALObject['type'],
            id: parseInt(objectMatch[2]),
            name: objectMatch[3].trim(),
            procedures: this.extractProcedures(alCode),
            triggers: this.extractTriggers(alCode),
            variables: this.extractVariables(alCode),
            dependencies: this.extractDependencies(alCode)
        };

        // Für Extensions: Extrahiere "extends" Information
        const isExtension = ['tableextension', 'pageextension', 'reportextension', 'enumextension'].includes(result.type);
        if (isExtension) {
            const extendsMatch = AlParser.EXTENDS_PATTERN.exec(alCode);
            if (extendsMatch) {
                result.extendsObject = extendsMatch[1].trim();
            }
            AlParser.EXTENDS_PATTERN.lastIndex = 0;
        }

        if (result.type === 'table' || result.type === 'tableextension') {
            result.fields = this.extractFields(alCode);
        }

        return result;
    }

    private extractProcedures(code: string): ALProcedure[] {
        const procedures: ALProcedure[] = [];
        let match;

        while ((match = AlParser.PROCEDURE_PATTERN.exec(code)) !== null) {
            procedures.push({
                name: match[3],
                parameters: this.parseParameters(match[4]),
                returnType: match[5],
                isLocal: !!match[1]?.includes('local'),
                attributes: this.extractAttributesAbove(code, match.index)
            });
        }

        AlParser.PROCEDURE_PATTERN.lastIndex = 0;
        return procedures;
    }

    private parseParameters(paramStr: string): ALParameter[] {
        if (!paramStr || paramStr.trim() === '') {
            return [];
        }

        const params: ALParameter[] = [];
        const parts = paramStr.split(';').map(p => p.trim()).filter(p => p);

        for (const part of parts) {
            const isVar = part.toLowerCase().startsWith('var ');
            const cleanPart = isVar ? part.substring(4).trim() : part;
            
            const colonIndex = cleanPart.indexOf(':');
            if (colonIndex > 0) {
                const name = cleanPart.substring(0, colonIndex).trim();
                const type = cleanPart.substring(colonIndex + 1).trim();
                params.push({ name, type, isVar });
            }
        }

        return params;
    }

    private extractTriggers(code: string): ALTrigger[] {
        const triggers: ALTrigger[] = [];
        let match;

        while ((match = AlParser.TRIGGER_PATTERN.exec(code)) !== null) {
            triggers.push({ name: match[1] });
        }

        AlParser.TRIGGER_PATTERN.lastIndex = 0;
        return triggers;
    }

    private extractFields(code: string): ALField[] {
        const fields: ALField[] = [];
        let match;

        while ((match = AlParser.FIELD_PATTERN.exec(code)) !== null) {
            fields.push({
                id: parseInt(match[1]),
                name: match[2].trim(),
                type: match[3]
            });
        }

        AlParser.FIELD_PATTERN.lastIndex = 0;
        return fields;
    }

    private extractVariables(code: string): ALVariable[] {
        const variables: ALVariable[] = [];
        let match;

        while ((match = AlParser.VAR_PATTERN.exec(code)) !== null) {
            variables.push({
                name: match[1],
                type: match[2]
            });
        }

        AlParser.VAR_PATTERN.lastIndex = 0;
        return variables;
    }

    private extractDependencies(code: string): string[] {
        const deps: Set<string> = new Set();
        
        // Record variables → Table dependencies
        const recordPattern = /(\w+)\s*:\s*Record\s+"?([^";]+)"?/gi;
        let match;
        while ((match = recordPattern.exec(code)) !== null) {
            deps.add(`Table: ${match[2]}`);
        }

        // Codeunit calls
        const codeunitPattern = /Codeunit\.Run\s*\(\s*Codeunit::"?([^")]+)"?/gi;
        while ((match = codeunitPattern.exec(code)) !== null) {
            deps.add(`Codeunit: ${match[1]}`);
        }

        // Page.Run calls
        const pagePattern = /Page\.Run\s*\(\s*Page::"?([^")]+)"?/gi;
        while ((match = pagePattern.exec(code)) !== null) {
            deps.add(`Page: ${match[1]}`);
        }

        return Array.from(deps);
    }

    private extractAttributesAbove(code: string, index: number): string[] {
        const attributes: string[] = [];
        const linesAbove = code.substring(Math.max(0, index - 500), index).split('\n');
        
        for (let i = linesAbove.length - 1; i >= 0; i--) {
            const line = linesAbove[i].trim();
            
            if (line.startsWith('[') && line.endsWith(']')) {
                attributes.unshift(line);
            } else if (line && !line.startsWith('//')) {
                break;
            }
        }
        
        return attributes;
    }

    /**
     * Convert AL Object to JSON
     */
    public toJSON(alObject: ALObject): string {
        return JSON.stringify(alObject, null, 2);
    }

    /**
     * Get Human-Readable Summary
     */
    public getSummary(alObject: ALObject): string {
        return `${alObject.type} ${alObject.id} "${alObject.name}"
- Procedures: ${alObject.procedures.length}
- Triggers: ${alObject.triggers.length}
- Variables: ${alObject.variables.length}
- Dependencies: ${alObject.dependencies.length}
${alObject.fields ? `- Fields: ${alObject.fields.length}` : ''}`;
    }
}
