export interface PromptContext {
    sourceCode: string;
    context: string;
    generateMocks: boolean;
    includeNegativeTests: boolean;
}

const EXTENSION_GUIDANCE = `
## EXTENSION OBJECT TESTING
The source code is an extension object. Follow these guidelines:
1. Test extension procedures/triggers added to the base object
2. Test field additions (for TableExtensions)
3. Test modifications to base object behavior
4. Test integration with base object
5. Use base object records in test scenarios

### Example for TableExtension:
\`\`\`al
[Test]
procedure TestTableExtension_NewField_ValueStored()
var
    Customer: Record Customer;
    ExpectedValue: Text;
begin
    // [SCENARIO] New field from extension stores value correctly
    // [GIVEN] A customer record
    Initialize();
    Customer.Init();
    Customer."No." := 'C' + LibraryRandom.RandText(10);
    ExpectedValue := 'Extension Value';
    // [WHEN] Setting extended field value
    Customer."Custom Field" := ExpectedValue;
    Customer.Insert(true);
    // [THEN] Value is stored correctly
    Customer.Get(Customer."No.");
    LibraryAssert.AreEqual(ExpectedValue, Customer."Custom Field", FieldValueStoredErr);
end;
\`\`\`
`;

export function buildUserPrompt(ctx: PromptContext): string {
    const isExtension = /^(tableextension|pageextension|reportextension|enumextension)\s+\d+/mi.test(ctx.sourceCode);

    const coveragePoints = [
        '1. **Happy Path**: Normal execution with valid data',
        '2. **Validation**: Field validations and constraints',
        ...(ctx.includeNegativeTests
            ? [
                '3. **Error Cases**: Invalid data, missing data, boundary conditions',
                '4. **Edge Cases**: Empty values, maximum values, special characters',
              ]
            : []),
        '5. **Business Logic**: Calculations, triggers, state changes',
        '6. **Data Integrity**: Record creation, modification, deletion',
    ].join('\n');

    const mockSection = ctx.generateMocks
        ? `\`\`\`al
local procedure CreateTestRecord(var Rec: Record SomeTable)
begin
    Rec.Init();
    Rec."No." := LibraryRandom.RandText(10);
    Rec.Insert(true);
end;
\`\`\``
        : '// Mock generation disabled – insert records directly in each test';

    return `## Task
Generate a comprehensive AL test codeunit for the source code below.
${isExtension ? EXTENSION_GUIDANCE : ''}

## Source Code to Test
\`\`\`al
${ctx.sourceCode}
\`\`\`

## Context
${ctx.context}

## Test Coverage Requirements
${coveragePoints}

## Mock Data Generation
${mockSection}

## Output Format
Return ONLY the raw AL codeunit code. No markdown, no explanation.
Start directly with: codeunit [ID] "[Name] Test"`;
}
