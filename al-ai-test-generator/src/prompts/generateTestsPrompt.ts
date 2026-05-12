export interface PromptContext {
    sourceCode: string;
    context: string;
    generateMocks: boolean;
    includeNegativeTests: boolean; // kept for API compat but negative tests are always generated
}

const EXTENSION_GUIDANCE = `
## EXTENSION OBJECT TESTING
The source code is an extension object. Apply these rules on top of the standard rules:
1. Test procedures and triggers added by the extension (not the base object's existing logic)
2. For TableExtensions: test new fields (storage, validation, FlowField calculation)
3. For PageExtensions: test new actions (invoke them via TestPage) and new field visibility
4. For EventSubscribers: trigger the base event and verify the subscriber ran correctly
5. Always use the base object's record type in test data setup

### TableExtension example:
\`\`\`al
[Test]
[TransactionModel(TransactionModel::AutoRollback)]
procedure TestTableExt_CustomField_ValueStoredCorrectly()
var
    Customer: Record Customer;
    ExpectedValue: Text[50];
begin
    // [SCENARIO] Custom field added by extension persists its value
    Initialize();
    // [GIVEN] A new customer record
    Customer.Init();
    Customer."No." := LibraryRandom.RandText(10);
    ExpectedValue := LibraryRandom.RandText(20);
    // [WHEN] The custom field is set and the record is inserted
    Customer."My Custom Field" := ExpectedValue;
    Customer.Insert(true);
    // [THEN] The value is retrievable from the database
    Customer.Get(Customer."No.");
    LibraryAssert.AreEqual(ExpectedValue, Customer."My Custom Field", FieldValueStoredErr);
end;
\`\`\`

### PageExtension / action example:
\`\`\`al
[Test]
[HandlerFunctions('SomeMessageHandler')]
procedure TestPageExt_CustomAction_ExecutesAndShowsMessage()
var
    CustomerCard: TestPage "Customer Card";
begin
    // [SCENARIO] Custom action on extended Customer Card executes successfully
    Initialize();
    // [GIVEN] Customer Card is open on an existing record
    CustomerCard.OpenEdit();
    // [WHEN] The custom action is invoked
    CustomerCard."My Custom Action".Invoke();
    // [THEN] SomeMessageHandler verifies the expected message was shown
    // (handler must be triggered – it is listed in HandlerFunctions above)
end;
\`\`\`
`;

export function buildUserPrompt(ctx: PromptContext): string {
    const isExtension = /^(tableextension|pageextension|reportextension|enumextension)\s+\d+/mi.test(ctx.sourceCode);

    // Per Microsoft best practices, both positive and negative tests are always required.
    // The includeNegativeTests flag is preserved for backwards compatibility but no longer
    // suppresses negative test generation.
    const coverageRequirements = `
Generate BOTH positive and negative tests (Microsoft requirement):

Positive tests – validate that code works correctly under normal conditions:
  - Happy path with valid, typical data
  - Field validations that succeed
  - Business logic that produces correct results
  - Record creation, modification, deletion

Negative tests – validate that code fails correctly under invalid conditions:
  - Invalid input data (wrong format, out-of-range values, empty required fields)
  - Missing mandatory data
  - Boundary conditions (zero, negative numbers, max field length + 1)
  - Business rule violations that must raise errors
  - Use asserterror + LibraryAssert.ExpectedError() or GetLastErrorText()
`;

    const mockSection = ctx.generateMocks
        ? `Create dedicated helper procedures for test data:
\`\`\`al
local procedure CreateTestCustomer(var Customer: Record Customer)
begin
    Customer.Init();
    Customer."No." := LibraryRandom.RandText(10);
    Customer.Name   := 'Test ' + LibraryRandom.RandText(10);
    Customer.Insert(true);
end;
\`\`\`
Use these helpers in every test that needs that record type.`
        : `Insert test records inline within each test method.
Use LibraryRandom for all values that do not need to be specific.`;

    return `## Task
Generate a complete, compilable AL test codeunit for the source code below.
${isExtension ? EXTENSION_GUIDANCE : ''}

## Source Code to Test
\`\`\`al
${ctx.sourceCode}
\`\`\`

## Context
${ctx.context}

## Test Coverage Requirements
${coverageRequirements}

## Test Data
${mockSection}

## Size Limit
Keep the generated codeunit under 100 [Test] procedures.
If more tests are needed, add a comment at the bottom listing further test ideas.

## State Restoration
Every test must leave the database in the same state as before it ran.
Use [TransactionModel(TransactionModel::AutoRollback)] on all tests that write to the database,
unless a Commit() is explicitly required by the business logic being tested.

## Output Format
Return ONLY the raw AL codeunit code. No markdown fences, no explanation text.
Start directly with the keyword: codeunit`;
}
