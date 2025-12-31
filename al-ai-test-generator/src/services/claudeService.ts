import Anthropic from '@anthropic-ai/sdk';
import * as vscode from 'vscode';
import { AuthService } from './authService';
import { ConfigService } from './configService';

/**
 * ClaudeService - Anthropic Claude API Integration
 * Implementiert FA3 - Claude API Integration mit Error Handling und Rate Limiting
 * Implementiert N-FA1 - Performance mit Timeout und Retry-Mechanismen
 */
export class ClaudeService {
    private client: Anthropic | null = null;
    private readonly maxRetries = 5;
    private readonly baseDelay = 1000; // 1 second
    private readonly outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    /**
     * Initialize Claude Client with API Key
     * @throws Error if API Key is not configured
     */
    private async initialize(): Promise<void> {
        const apiKey = await AuthService.instance.getApiKey();
        
        if (!apiKey) {
            throw new Error('API-Key nicht konfiguriert. Bitte mit "AL: Set Anthropic API Key" eingeben.');
        }

        this.client = new Anthropic({
            apiKey: apiKey
        });

        this.outputChannel.appendLine('Claude API Client initialisiert');
    }

    /**
     * Generate Test Code using Claude AI
     * Implements Exponential Backoff for Rate Limiting (N-FA1)
     * 
     * @param sourceCode - AL source code to generate tests for
     * @param context - Additional context (object type, name, etc.)
     * @param token - Cancellation token
     * @returns Generated AL test code
     */
    public async generateTestCode(
        sourceCode: string,
        context: string,
        token: vscode.CancellationToken
    ): Promise<string> {
        if (!this.client) {
            await this.initialize();
        }

        if (!this.client) {
            throw new Error('Claude Client konnte nicht initialisiert werden');
        }

        return await this.executeWithRetry(async () => {
            // N-FA1 - Timeout Configuration (max 60 seconds)
            const timeout = ConfigService.getTimeout() * 1000;
            const controller = new AbortController();
            
            token.onCancellationRequested(() => {
                this.outputChannel.appendLine('API-Anfrage abgebrochen durch Benutzer');
                controller.abort();
            });

            const timeoutId = setTimeout(() => {
                this.outputChannel.appendLine(`Timeout nach ${timeout/1000} Sekunden`);
                controller.abort();
            }, timeout);

            try {
                const prompt = this.buildPrompt(sourceCode, context);
                
                this.outputChannel.appendLine(`\nSende Anfrage an Claude AI (${ConfigService.getModel()})...`);
                this.outputChannel.appendLine(`Max Tokens: ${ConfigService.getMaxTokens()}`);
                
                const response = await this.client!.messages.create({
                    model: ConfigService.getModel(),
                    max_tokens: ConfigService.getMaxTokens(),
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                });

                this.outputChannel.appendLine('Response erhalten');
                this.outputChannel.appendLine(`Stop Reason: ${response.stop_reason}`);
                this.outputChannel.appendLine(`Usage: ${JSON.stringify(response.usage)}`);

                // Extract text from response
                const textContent = response.content.find(c => c.type === 'text');
                if (!textContent || textContent.type !== 'text') {
                    throw new Error('Keine Text-Response von Claude erhalten');
                }

                return this.extractCodeFromResponse(textContent.text);

            } finally {
                clearTimeout(timeoutId);
            }
        });
    }

    /**
     * Execute Function with Exponential Backoff Retry
     * Handles Rate Limiting (429) and Server Errors (5xx)
     */
    private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
        let attempt = 0;
        let lastError: Error | null = null;

        while (attempt < this.maxRetries) {
            try {
                return await fn();
            } catch (error: any) {
                lastError = error;
                
                // Check if error is retryable
                const isRetryable = this.isRetryableError(error);
                
                if (!isRetryable || attempt >= this.maxRetries - 1) {
                    throw error;
                }

                // Calculate delay with exponential backoff
                const retryAfter = error.headers?.['retry-after'];
                const delay = retryAfter 
                    ? parseInt(retryAfter) * 1000
                    : Math.min(
                        this.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
                        60000 // Max 60 seconds
                    );

                this.outputChannel.appendLine(
                    `Fehler: ${error.message}. Retry in ${delay/1000}s (Versuch ${attempt + 1}/${this.maxRetries})`
                );

                await this.sleep(delay);
                attempt++;
            }
        }

        throw lastError || new Error('Max Retries überschritten');
    }

    /**
     * Check if Error is Retryable
     */
    private isRetryableError(error: any): boolean {
        // Rate Limiting
        if (error.status === 429) {
            return true;
        }

        // Server Errors (5xx)
        if (error.status >= 500 && error.status < 600) {
            return true;
        }

        // Network Errors
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            return true;
        }

        return false;
    }

    /**
     * Build Prompt for Claude AI
     * Context-aware prompt generation with AL-specific requirements
     */
    private buildPrompt(sourceCode: string, context: string): string {
        const testIsolation = ConfigService.getTestIsolation();
        const generateMocks = ConfigService.shouldGenerateMocks();
        const includeNegativeTests = ConfigService.shouldIncludeNegativeTests();

        return `You are an expert in Microsoft Dynamics 365 Business Central AL development and testing.

## Task
Generate a comprehensive test codeunit for the following AL code following Microsoft's official test standards:
https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-test-codeunits-and-test-methods

## Source Code to Test:
\`\`\`al
${sourceCode}
\`\`\`

## Context:
${context}

## CRITICAL REQUIREMENTS (Microsoft Standards):

### 1. Test Codeunit Structure
\`\`\`al
codeunit [ID] "[Name] Test"
{
    Subtype = Test;
    TestPermissions = Disabled;
    TestIsolation = ${testIsolation};

    var
        LibraryAssert: Codeunit "Library - Assert";
        LibraryRandom: Codeunit "Library - Random";
        IsInitialized: Boolean;
\`\`\`

### 2. MULTILINGUAL LABELS (MANDATORY)
**All error messages and labels MUST use TextConst with DEU (German) and ENU (English) translations:**

\`\`\`al
var
    CustomerCreatedMsg: Label 'Customer %1 was created successfully.', Comment = 'DEU="Debitor %1 wurde erfolgreich angelegt.",ENU="Customer %1 was created successfully."';
    InvalidEmailErr: Label 'The email address is not valid.', Comment = 'DEU="Die E-Mail-Adresse ist nicht gültig.",ENU="The email address is not valid."';
    RecordNotFoundErr: Label 'Record not found.', Comment = 'DEU="Datensatz nicht gefunden.",ENU="Record not found."';
    ValueMismatchErr: Label 'Expected value %1 but got %2.', Comment = 'DEU="Erwarteter Wert %1, erhalten %2.",ENU="Expected value %1 but got %2."';
\`\`\`

**Label Naming Convention:**
- Info messages: \`[Description]Msg\`
- Error messages: \`[Description]Err\`
- Questions: \`[Description]Qst\`
- Confirmations: \`[Description]Cnf\`

**TextConst Format:**
\`\`\`al
Label 'English text', Comment = 'DEU="Deutscher Text",ENU="English text"';
\`\`\`

**Usage in Tests:**
\`\`\`al
LibraryAssert.AreEqual(Expected, Actual, ValueMismatchErr);
LibraryAssert.IsTrue(Condition, InvalidEmailErr);
\`\`\`

### 3. OnRun Trigger (Optional Setup)
\`\`\`al
trigger OnRun()
begin
    // Shared initialization for all tests
    IsInitialized := true;
end;
\`\`\`

### 4. Test Methods Format
**MANDATORY:** Each test method MUST follow this exact structure:

\`\`\`al
[Test]
procedure Test[Feature]_[Scenario]_[ExpectedResult]()
var
    // Local variables
begin
    // [SCENARIO] Brief description of what this test does
    
    // [GIVEN] Setup and preconditions
    Initialize();
    // Setup test data
    
    // [WHEN] Execute the action being tested
    // Call the method/trigger
    
    // [THEN] Verify results with TextConst labels
    LibraryAssert.AreEqual(Expected, Actual, ValueMismatchErr);
end;
\`\`\`

### 5. Library Assert Usage (MANDATORY)
**ONLY use Library - Assert codeunit with TextConst labels:**

\`\`\`al
// Equality checks
LibraryAssert.AreEqual(Expected, Actual, ValueMismatchErr);
LibraryAssert.AreNotEqual(NotExpected, Actual, ValueShouldDifferErr);

// Boolean checks
LibraryAssert.IsTrue(Condition, ConditionFailedErr);
LibraryAssert.IsFalse(Condition, ConditionShouldBeFalseErr);

// Error handling
asserterror SomeMethod();
LibraryAssert.ExpectedError(ExpectedErrorTxt);

// Table checks
LibraryAssert.RecordIsEmpty(RecordVariable);
LibraryAssert.RecordIsNotEmpty(RecordVariable);
\`\`\`

### 6. Complete Example with TextConst Labels

\`\`\`al
codeunit 50100 "Customer Validation Test"
{
    Subtype = Test;
    TestPermissions = Disabled;
    TestIsolation = Subscriber;

    var
        LibraryAssert: Codeunit "Library - Assert";
        LibraryRandom: Codeunit "Library - Random";
        Customer: Record Customer;
        IsInitialized: Boolean;
        // Labels with DEU and ENU
        EmailAcceptedMsg: Label 'Email was accepted', Comment = 'DEU="E-Mail wurde akzeptiert",ENU="Email was accepted"';
        EmailRejectedErr: Label 'Email format is invalid', Comment = 'DEU="E-Mail-Format ist ungültig",ENU="Email format is invalid"';
        CustomerDeletedMsg: Label 'Customer was deleted', Comment = 'DEU="Debitor wurde gelöscht",ENU="Customer was deleted"';
        CustomerNotFoundErr: Label 'Customer not found', Comment = 'DEU="Debitor nicht gefunden",ENU="Customer not found"';
        NameMismatchErr: Label 'Customer name does not match', Comment = 'DEU="Debitorenname stimmt nicht überein",ENU="Customer name does not match"';

    [Test]
    procedure TestValidateEmail_ValidFormat_EmailAccepted()
    var
        ValidEmail: Text[80];
    begin
        // [SCENARIO] Valid email format should be accepted
        
        // [GIVEN] A customer with a valid email address
        Initialize();
        Customer.Init();
        Customer."No." := 'C' + LibraryRandom.RandText(10);
        ValidEmail := LibraryRandom.RandText(5) + '@test.com';
        
        // [WHEN] The email is validated
        Customer.Validate("E-Mail", ValidEmail);
        
        // [THEN] The email is accepted without errors
        LibraryAssert.AreEqual(ValidEmail, Customer."E-Mail", EmailAcceptedMsg);
    end;

    [Test]
    procedure TestValidateEmail_InvalidFormat_Error()
    begin
        // [SCENARIO] Invalid email format should raise an error
        
        // [GIVEN] A customer with an invalid email
        Initialize();
        Customer.Init();
        Customer."No." := 'C' + LibraryRandom.RandText(10);
        
        // [WHEN] [THEN] Setting invalid email should raise an error
        asserterror Customer.Validate("E-Mail", 'not-an-email');
        LibraryAssert.ExpectedError(EmailRejectedErr);
    end;

    [Test]
    [HandlerFunctions('ConfirmHandler')]
    procedure TestDeleteCustomer_WithConfirm_CustomerDeleted()
    var
        CustomerNo: Code[20];
    begin
        // [SCENARIO] Delete customer with confirmation
        
        // [GIVEN] An existing customer
        Initialize();
        CreateTestCustomer(Customer);
        CustomerNo := Customer."No.";
        
        // [WHEN] The customer is deleted with confirmation
        Customer.Delete(true);
        
        // [THEN] The customer no longer exists
        LibraryAssert.IsFalse(Customer.Get(CustomerNo), CustomerDeletedMsg);
    end;

    local procedure Initialize()
    begin
        if IsInitialized then
            exit;
        
        IsInitialized := true;
        Commit();
    end;

    local procedure CreateTestCustomer(var Cust: Record Customer)
    begin
        Cust.Init();
        Cust."No." := 'C' + LibraryRandom.RandText(10);
        Cust.Name := 'Test Customer ' + LibraryRandom.RandText(5);
        Cust.Insert(true);
    end;

    [ConfirmHandler]
    procedure ConfirmHandler(Question: Text[1024]; var Reply: Boolean)
    begin
        Reply := true;
    end;
}
\`\`\`

### 7. TestPage Usage (for Page Objects)
\`\`\`al
var
    CustomerCard: TestPage "Customer Card";
    PageOpenedMsg: Label 'Customer card opened', Comment = 'DEU="Debitorenkarte geöffnet",ENU="Customer card opened"';
begin
    // Open page
    CustomerCard.OpenEdit();
    CustomerCard.GotoRecord(Customer);
    
    // Set fields
    CustomerCard."No.".SetValue('C001');
    CustomerCard.Name.SetValue('Test Customer');
    
    // Validate with TextConst label
    LibraryAssert.AreEqual('C001', CustomerCard."No.".Value, PageOpenedMsg);
    
    // Actions
    CustomerCard.OK().Invoke();
end;
\`\`\`

### 8. Handler Functions (when needed)
\`\`\`al
[Test]
[HandlerFunctions('MessageHandler')]
procedure TestWithMessage()
begin
    // Test that triggers Message()
end;

[MessageHandler]
procedure MessageHandler(Message: Text[1024])
var
    ExpectedMsg: Label 'Success', Comment = 'DEU="Erfolgreich",ENU="Success"';
begin
    // Verify message content
    LibraryAssert.IsTrue(StrPos(Message, ExpectedMsg) > 0, ExpectedMsg);
end;

[ConfirmHandler]
procedure ConfirmHandler(Question: Text[1024]; var Reply: Boolean)
begin
    Reply := true;
end;
\`\`\`

### 9. Test Coverage Requirements
Generate tests for:
1. **Happy Path**: Normal execution with valid data
2. **Validation**: Field validations and constraints${includeNegativeTests ? '\n3. **Error Cases**: Invalid data, missing data, boundary conditions\n4. **Edge Cases**: Empty values, maximum values, special characters' : ''}
5. **Business Logic**: Calculations, triggers, state changes
6. **Data Integrity**: Record creation, modification, deletion

### 10. Initialize Pattern
\`\`\`al
local procedure Initialize()
begin
    if IsInitialized then
        exit;
    
    // One-time setup
    IsInitialized := true;
    Commit();
end;
\`\`\`

### 11. Mock Data Generation${generateMocks ? ' (ENABLED)' : ' (DISABLED)'}
${generateMocks ? `\`\`\`al
local procedure CreateTestCustomer(var Customer: Record Customer)
begin
    Customer.Init();
    Customer."No." := LibraryRandom.RandText(10);
    Customer.Name := 'Test Customer ' + LibraryRandom.RandText(5);
    Customer."E-Mail" := LibraryRandom.RandText(5) + '@test.com';
    Customer.Insert(true);
end;
\`\`\`` : '// Mock generation disabled'}

### 12. Transaction Model (for Integration Tests)
\`\`\`al
[Test]
[TransactionModel(TransactionModel::AutoRollback)]
procedure TestWithAutoRollback()
\`\`\`

## CRITICAL OUTPUT REQUIREMENTS:
1. **Complete, compilable AL code** - No placeholders, no TODOs
2. **Follow EXACT naming conventions** - Test[Feature]_[Scenario]_[ExpectedResult]
3. **Include [SCENARIO], [GIVEN], [WHEN], [THEN] comments** in EVERY test
4. **Use ONLY Library - Assert** - No custom assertion methods
5. **MANDATORY: All labels as TextConst with DEU and ENU** - Every error message, every assertion message
6. **Proper handler functions** - Include [HandlerFunctions] attribute
7. **Initialize pattern** - Use shared initialization method
8. **Clear error messages** - Use TextConst labels in all assertions

## MULTILINGUAL LABEL CHECKLIST:
- [ ] All assertion error messages use TextConst
- [ ] All labels have DEU (German) translation
- [ ] All labels have ENU (English) translation
- [ ] Label naming follows convention (Msg/Err/Qst/Cnf)
- [ ] Comment format: Comment = 'DEU="...",ENU="..."'

Generate the complete test codeunit now with multilingual TextConst labels:`;
    }

    /**
     * Extract AL Code from Claude Response
     * Removes markdown code blocks and extracts pure AL code
     */
    private extractCodeFromResponse(response: string): string {
        // Remove markdown code blocks
        let code = response.trim();
        
        // Remove ```al and ``` markers
        code = code.replace(/^```al\s*/gm, '');
        code = code.replace(/^```\s*/gm, '');
        
        // Find codeunit declaration
        const codeunitMatch = code.match(/codeunit\s+\d+\s+".+?"/);
        if (!codeunitMatch) {
            throw new Error('Keine gültige Codeunit-Deklaration in Response gefunden');
        }

        // Extract from codeunit start to end
        const startIndex = code.indexOf(codeunitMatch[0]);
        code = code.substring(startIndex);
        
        return code.trim();
    }

    /**
     * Sleep Utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Validate API Key (makes test request)
     * @returns true if API Key is valid
     */
    public async validateApiKey(): Promise<boolean> {
        try {
            await this.initialize();
            
            // Make simple test request
            const response = await this.client!.messages.create({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 10,
                messages: [{
                    role: 'user',
                    content: 'Hello'
                }]
            });

            return response.stop_reason === 'end_turn' || response.stop_reason === 'max_tokens';
        } catch (error) {
            this.outputChannel.appendLine(`API Key Validierung fehlgeschlagen: ${error}`);
            return false;
        }
    }
}
