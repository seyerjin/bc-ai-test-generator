import * as vscode from 'vscode';

/**
 * ConfigService - Zentrale Konfigurationsverwaltung
 * Implementiert FA3 - Konfigurierbare Testparameter
 */
export class ConfigService {
    private static readonly CONFIG_SECTION = 'alTestGenerator';
    private static config: vscode.WorkspaceConfiguration;

    /**
     * Initialize Configuration Service
     */
    public static initialize(): void {
        ConfigService.config = vscode.workspace.getConfiguration(ConfigService.CONFIG_SECTION);
        
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration(ConfigService.CONFIG_SECTION)) {
                ConfigService.config = vscode.workspace.getConfiguration(ConfigService.CONFIG_SECTION);
            }
        });
    }

    /**
     * Get Claude AI Model
     * @returns Model identifier (default: claude-sonnet-4-5-20250929)
     */
    public static getModel(): string {
        return ConfigService.config.get<string>('model', 'claude-sonnet-4-5-20250929');
    }

    /**
     * Get Maximum Tokens for API Request
     * @returns Max tokens (default: 4096)
     */
    public static getMaxTokens(): number {
        return ConfigService.config.get<number>('maxTokens', 4096);
    }

    /**
     * Get API Timeout in Seconds
     * @returns Timeout in seconds (default: 60, max: 60)
     */
    public static getTimeout(): number {
        const timeout = ConfigService.config.get<number>('timeout', 60);
        // N-FA1 - Enforce maximum timeout of 60 seconds
        return Math.min(timeout, 60);
    }

    /**
     * Get Output Folder for Generated Tests
     * @returns Relative path (default: 'Test')
     */
    public static getOutputFolder(): string {
        return ConfigService.config.get<string>('outputFolder', 'Test');
    }

    /**
     * Get Test ID Start Range
     * @returns Start ID for test codeunits (default: 50000)
     */
    public static getTestIdStartRange(): number {
        return ConfigService.config.get<number>('testIdStartRange', 50000);
    }

    /**
     * Check if Mock Generation is Enabled
     * @returns true if mocks should be generated
     */
    public static shouldGenerateMocks(): boolean {
        return ConfigService.config.get<boolean>('generateMocks', true);
    }

    /**
     * Check if Negative Tests Should be Included
     * @returns true if negative tests (asserterror) should be generated
     */
    public static shouldIncludeNegativeTests(): boolean {
        return ConfigService.config.get<boolean>('includeNegativeTests', true);
    }

    /**
     * Get Test Isolation Setting
     * @returns TestIsolation value ('Codeunit' or 'Disabled')
     */
    public static getTestIsolation(): 'Codeunit' | 'Disabled' {
        const isolation = ConfigService.config.get<string>('testIsolation', 'Codeunit');
        return isolation === 'Disabled' ? 'Disabled' : 'Codeunit';
    }

    /**
     * Check if Caching is Enabled
     * @returns true if caching should be used
     */
    public static isCacheEnabled(): boolean {
        return ConfigService.config.get<boolean>('enableCache', true);
    }

    /**
     * Get All Configuration as Object
     * @returns Configuration object for logging/debugging
     */
    public static getAllConfig(): Record<string, any> {
        return {
            model: ConfigService.getModel(),
            maxTokens: ConfigService.getMaxTokens(),
            timeout: ConfigService.getTimeout(),
            outputFolder: ConfigService.getOutputFolder(),
            testIdStartRange: ConfigService.getTestIdStartRange(),
            generateMocks: ConfigService.shouldGenerateMocks(),
            includeNegativeTests: ConfigService.shouldIncludeNegativeTests(),
            testIsolation: ConfigService.getTestIsolation(),
            cacheEnabled: ConfigService.isCacheEnabled()
        };
    }

    /**
     * Update Configuration Value
     * @param key - Configuration key
     * @param value - New value
     * @param target - ConfigurationTarget (Global/Workspace)
     */
    public static async updateConfig(
        key: string,
        value: any,
        target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace
    ): Promise<void> {
        await ConfigService.config.update(key, value, target);
    }

    /**
     * Reset Configuration to Defaults
     */
    public static async resetToDefaults(): Promise<void> {
        const keys = [
            'model',
            'maxTokens',
            'timeout',
            'outputFolder',
            'testIdStartRange',
            'generateMocks',
            'includeNegativeTests',
            'testIsolation',
            'enableCache'
        ];

        for (const key of keys) {
            await ConfigService.config.update(key, undefined, vscode.ConfigurationTarget.Workspace);
        }
    }
}
