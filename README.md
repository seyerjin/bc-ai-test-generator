# AL AI Test Generator with Mutation Testing

## From GitHub Releases (Recommended)

1. **Download the latest release:**
   - Go to [Releases](https://github.com/seyerjin/bc-ai-test-generator/releases)
   - Download the `.vsix` file from the latest release

2. **Install in VS Code:**
   ```bash
   code --install-extension bc-ai-test-generator-X.X.X.vsix
   ```

   Or via VS Code UI:
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Click the "..." menu → "Install from VSIX..."
   - Select the downloaded `.vsix` file

## Build from Source

```bash
# Clone the repository
git clone https://github.com/seyerjin/bc-ai-test-generator.git
cd bc-ai-test-generator/al-ai-test-generator

# Install dependencies
npm install

# Build and package
npm run package

# Install the extension
code --install-extension bc-ai-test-generator-X.X.X.vsix
```

---


## Extension Setup

### 1. Set API Key
```
Ctrl+Shift+P → "AL: Set Anthropic API Key"
```
Get your API key from: https://console.anthropic.com

### 2. Generate Tests
- **Right-click** on any AL file → **"AL: Generate Tests with AI"**
- Or: `Ctrl+Shift+P` → "AL: Generate Tests"

### 3. Review Generated Tests
Tests are created in `Test/` folder with:
- ✅ Library - Assert usage
- ✅ Given-When-Then structure
- ✅ TestPage for UI testing
- ✅ Handler functions
- ✅ Multilingual TextConst labels (DEU/ENU)

## CI/CD Pipeline Setup

Want to automate testing in your AL project?

**→ [Complete CI/CD Setup Guide](templates/README.md)**

Quick integration:
```bash
# Copy templates to your AL project
cp templates/workflows/al-pipeline.yml .github/workflows/ci-cd.yml
cp -r templates/mutation-testing/ .github/

# Install dependencies
cd .github/mutation-testing && npm install

# Pipeline runs automatically on Pull Requests!
```

---

## 📖 Example Generated Test

```al
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
        // Multilingual Labels
        EmailAcceptedMsg: Label 'Email was accepted', 
            Comment = 'DEU="E-Mail wurde akzeptiert",ENU="Email was accepted"';
        EmailRejectedErr: Label 'Email format is invalid', 
            Comment = 'DEU="E-Mail-Format ist ungültig",ENU="Email format is invalid"';

    [Test]
    procedure TestValidateEmail_ValidFormat_EmailAccepted()
    var
        ValidEmail: Text[80];
    begin
        // [SCENARIO] Valid email format should be accepted
        
        // [GIVEN] A customer with a valid email address
        Initialize();
        CreateTestCustomer(Customer);
        ValidEmail := LibraryRandom.RandText(5) + '@test.com';
        
        // [WHEN] The email is validated
        Customer.Validate("E-Mail", ValidEmail);
        
        // [THEN] The email is accepted without errors
        LibraryAssert.AreEqual(ValidEmail, Customer."E-Mail", EmailAcceptedMsg);
    end;

    local procedure Initialize()
    begin
        if IsInitialized then
            exit;
        
        IsInitialized := true;
        Commit();
    end;
}
```

---

## 🧬 Mutation Testing

Assess your test quality with mutation testing:

```
Ctrl+Shift+P → "AL: Run Mutation Tests"
```

### Mutation Operators:
- **AOR**: Arithmetic Operator Replacement (`+` → `-`, `*` → `/`)
- **ROR**: Relational Operator Replacement (`>` → `>=`, `<` → `<=`)
- **LCR**: Logical Connector Replacement (`AND` → `OR`)
- **SDL**: Statement Deletion (removes statements)
- **RVR**: Return Value Replacement (`true` → `false`)
- **BVR**: Boundary Value Replacement (`n` → `n+1`, `n-1`)

---

## ⚙️ Configuration

### Extension Settings

```json
{
  "alTestGenerator.model": "claude-sonnet-4-5-20250929",
  "alTestGenerator.maxTokens": 8000,
  "alTestGenerator.testIsolation": "Subscriber",
  "alTestGenerator.generateMocks": true,
  "alTestGenerator.includeNegativeTests": true,
  
  "alTestGenerator.mutation.enabledOperators": [
    "AOR", "ROR", "LCR", "SDL", "RVR", "BVR"
  ],
  "alTestGenerator.mutation.parallelExecution": true
}
```

### CI/CD Pipeline Configuration

See [templates/README.md](templates/README.md) for complete setup guide including:
- Code coverage thresholds
- Mutation testing settings
- Deployment configuration

---

## 🔧 Requirements

### Extension Requirements
- Visual Studio Code 1.80.0 or higher
- AL Language Extension
- Anthropic API Key (https://console.anthropic.com)
- Business Central AL Project

### CI/CD Pipeline Requirements
- GitHub Repository with Actions enabled
- Business Central License file
- Node.js 18+ (for mutation testing)
- AL-Go framework (included in template)

---

## 🏗️ Repository Structure

```
bc-ai-test-generator/
├── .github/workflows/
│   └── build-extension.yml       # Extension build & release pipeline
├── al-ai-test-generator/         # VS Code extension source
│   ├── src/                      # TypeScript source code
│   ├── package.json
│   └── README.md
├── templates/                     # CI/CD templates for AL projects
│   ├── workflows/
│   │   └── al-pipeline.yml       # Complete CI/CD pipeline (800+ lines)
│   ├── mutation-testing/         # Mutation testing scripts
│   ├── example-al-project/       # Working example
│   └── README.md                 # Complete setup guide
├── README.md                      # This file
└── LICENSE
```
