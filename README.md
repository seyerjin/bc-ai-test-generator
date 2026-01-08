# AL AI Test Generator with Mutation Testing

🚀 **AI-powered test generation for Microsoft Dynamics 365 Business Central AL code**

Generate comprehensive, high-quality test codeunits with Claude AI, following official Microsoft test standards. Includes mutation testing framework for test quality assessment and complete CI/CD pipeline templates for AL projects.

> **Academic Project:** This extension was developed as part of a Master's thesis in Cloud Computing at Hochschule Burgenland, exploring AI-assisted test case generation for Business Central.

[![GitHub Release](https://img.shields.io/github/v/release/seyerjin/bc-ai-test-generator)](https://github.com/seyerjin/bc-ai-test-generator/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

---

## ✨ Features

### 🤖 AI-Powered Test Generation
- **Intelligent Test Creation**: Claude AI analyzes your AL code and generates comprehensive test codeunits
- **Microsoft Standards**: Follows [official BC test standards](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-test-codeunits-and-test-methods)
- **Multilingual Labels**: Automatically generates TextConst with DEU (German) and ENU (English) translations
- **Complete Coverage**: Tests for happy path, validations, error cases, and business logic

### 🧬 Mutation Testing Framework
- **6 Mutation Operators**: AOR, ROR, LCR, SDL, RVR, BVR
- **Mutation Score Calculation**: Assess test effectiveness
- **HTML Reports**: Visual mutation testing results
- **Parallel Execution**: Fast mutation testing with configurable parallelization
- **AL-Go Compatible**: Integrates with Microsoft AL-Go CI/CD pipelines

### 🌍 Multilingual Support
- **Automatic TextConst Generation**: All labels with DEU and ENU translations
- **Best Practices**: Follows AL naming conventions (Msg, Err, Qst, Cnf)
- **No Manual Translation Needed**: AI generates both languages simultaneously

### 🔄 CI/CD Pipeline Templates
- **Complete GitHub Actions workflows** for AL projects
- **Automated testing** in BC containers
- **Code coverage analysis** with PR comments
- **Mutation testing** for test quality gates
- **Automated deployment** to BC environments

---

## 📦 Installation

### From GitHub Releases (Recommended)

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

### Build from Source

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

## 🚀 Quick Start

### Extension Setup

#### 1. Set API Key
```
Ctrl+Shift+P → "AL: Set Anthropic API Key"
```
Get your API key from: https://console.anthropic.com

#### 2. Generate Tests
- **Right-click** on any AL file → **"AL: Generate Tests with AI"**
- Or: `Ctrl+Shift+P` → "AL: Generate Tests"

#### 3. Review Generated Tests
Tests are created in `Test/` folder with:
- ✅ Library - Assert usage
- ✅ Given-When-Then structure
- ✅ TestPage for UI testing
- ✅ Handler functions
- ✅ Multilingual TextConst labels (DEU/ENU)

### CI/CD Pipeline Setup

Want to automate testing in your AL project?

**→ [Complete CI/CD Setup Guide](templates/README.md)** (20 pages)

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

## 🎯 Key Benefits

### For Developers
- ⚡ **Save Time**: Generate tests in seconds, not hours
- 🎓 **Learn Best Practices**: AI follows Microsoft standards
- 🌍 **Multilingual Ready**: Automatic DEU/ENU labels
- 🔍 **Quality Assurance**: Mutation testing validates test effectiveness
- 🔄 **CI/CD Ready**: Production-ready pipeline templates included

### For Teams
- 📈 **Consistent Quality**: All tests follow same standards
- 🤝 **Easy Onboarding**: New developers learn from generated tests
- 🔄 **CI/CD Integration**: Complete GitHub Actions workflows
- 📊 **Metrics**: Mutation scores and coverage track test quality
- 🚀 **Automated Deployment**: Push to main, deploy automatically

### For Researchers
- 📊 **Data Collection**: Automated metrics for empirical studies
- 🔬 **Reproducibility**: Complete CI/CD ensures consistent results
- 📈 **Trend Analysis**: Historical data for quality evolution
- 🎓 **Academic Use**: Designed for software testing research

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

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [README.md](README.md) | This file - Overview and quick start |
| [templates/README.md](templates/README.md) | **20-page CI/CD setup guide** |
| [templates/example-al-project/](templates/example-al-project/) | Complete working example |
| [CHANGELOG.md](CHANGELOG.md) | Version history and changes |

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
