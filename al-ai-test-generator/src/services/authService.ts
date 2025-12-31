import * as vscode from 'vscode';

/**
 * AuthService - Sichere Verwaltung von API-Keys
 * Implementiert FA8 - Sicherheit und Datenschutz mit VS Code Secret Storage API
 * 
 * Die Secret Storage API verschlüsselt Secrets plattformübergreifend:
 * - Windows: Windows Credential Manager
 * - macOS: Keychain
 * - Linux: Secret Service API (libsecret)
 */
export class AuthService {
    private static _instance: AuthService;
    private secretStorage: vscode.SecretStorage;
    private readonly API_KEY_SECRET = 'anthropic_api_key';

    private constructor(context: vscode.ExtensionContext) {
        this.secretStorage = context.secrets;
    }

    /**
     * Initialize AuthService with Extension Context
     * Must be called in activate() function
     */
    public static initialize(context: vscode.ExtensionContext): void {
        if (AuthService._instance) {
            throw new Error('AuthService bereits initialisiert');
        }
        AuthService._instance = new AuthService(context);
    }

    /**
     * Get Singleton Instance
     */
    public static get instance(): AuthService {
        if (!AuthService._instance) {
            throw new Error('AuthService nicht initialisiert. Rufe initialize() in activate() auf.');
        }
        return AuthService._instance;
    }

    /**
     * Store API Key Securely
     * Validates format before storing
     * 
     * @param apiKey - Anthropic API Key (must start with 'sk-ant-')
     * @throws Error if API Key format is invalid
     */
    public async storeApiKey(apiKey: string): Promise<void> {
        // Validation
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('API-Key darf nicht leer sein');
        }

        if (!apiKey.startsWith('sk-ant-')) {
            throw new Error('Ungültiges API-Key Format. Anthropic Keys beginnen mit "sk-ant-"');
        }

        if (apiKey.length < 30) {
            throw new Error('API-Key zu kurz. Bitte vollständigen Key eingeben');
        }

        // Store encrypted
        await this.secretStorage.store(this.API_KEY_SECRET, apiKey);
    }

    /**
     * Retrieve API Key from Secure Storage
     * 
     * @returns API Key or undefined if not set
     */
    public async getApiKey(): Promise<string | undefined> {
        return await this.secretStorage.get(this.API_KEY_SECRET);
    }

    /**
     * Check if API Key is Configured
     * 
     * @returns true if API Key exists
     */
    public async hasApiKey(): Promise<boolean> {
        const key = await this.getApiKey();
        return key !== undefined && key.length > 0;
    }

    /**
     * Delete API Key from Secure Storage
     */
    public async deleteApiKey(): Promise<void> {
        await this.secretStorage.delete(this.API_KEY_SECRET);
    }

    /**
     * Validate API Key Format (without API call)
     * 
     * @param apiKey - Key to validate
     * @returns true if format is valid
     */
    public static validateKeyFormat(apiKey: string): boolean {
        if (!apiKey || typeof apiKey !== 'string') {
            return false;
        }

        // Anthropic API Keys format: sk-ant-api03-...
        const keyPattern = /^sk-ant-[a-zA-Z0-9-_]{30,}$/;
        return keyPattern.test(apiKey);
    }

    /**
     * Get Masked API Key for Display (shows only first/last chars)
     * 
     * @returns Masked key like "sk-ant-***-xyz" or "Not configured"
     */
    public async getMaskedApiKey(): Promise<string> {
        const key = await this.getApiKey();
        
        if (!key) {
            return 'Not configured';
        }

        if (key.length < 10) {
            return '***';
        }

        const start = key.substring(0, 7);  // "sk-ant-"
        const end = key.substring(key.length - 3);
        return `${start}***${end}`;
    }
}
