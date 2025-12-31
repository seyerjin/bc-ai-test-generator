# AL AI Test Generator with Mutation Testing

🚀 **AI-powered test generation for Microsoft Dynamics 365 Business Central AL code**

Generate comprehensive, high-quality test codeunits with Claude AI, following official Microsoft test standards. Includes mutation testing framework for test quality assessment.

[![VS Code Marketplace](https://img.shields.io/vscode-marketplace/v/seyerjin.al-ai-test-generator.svg)](https://marketplace.visualstudio.com/items?itemName=seyerjin.al-ai-test-generator)
[![Downloads](https://img.shields.io/vscode-marketplace/d/seyerjin.al-ai-test-generator.svg)](https://marketplace.visualstudio.com/items?itemName=seyerjin.al-ai-test-generator)
[![Rating](https://img.shields.io/vscode-marketplace/r/seyerjin.al-ai-test-generator.svg)](https://marketplace.visualstudio.com/items?itemName=seyerjin.al-ai-test-generator)

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

---

## 📦 Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "AL AI Test Generator"
4. Click "Install"

### Manual Installation
```bash
code --install-extension al-ai-test-generator-2.0.0.vsix
```

---

## 🚀 Quick Start

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

---

## 📚 Documentation

- [Integration Guide](INTEGRATION_GUIDE.md) - Seamless integration into existing projects
- [Microsoft BC Test Standards](MICROSOFT_BC_TEST_STANDARDS.md) - Complete reference
- [Mutation Testing Guide](MUTATION_TESTING_GUIDE.md) - Detailed mutation testing documentation
- [Publishing Guide](PUBLISHING_GUIDE.md) - How to publish to marketplace

---

## 🎯 Key Benefits

### For Developers
- ⚡ **Save Time**: Generate tests in seconds, not hours
- 🎓 **Learn Best Practices**: AI follows Microsoft standards
- 🌍 **Multilingual Ready**: Automatic DEU/ENU labels
- 🔍 **Quality Assurance**: Mutation testing validates test effectiveness

### For Teams
- 📈 **Consistent Quality**: All tests follow same standards
- 🤝 **Easy Onboarding**: New developers learn from generated tests
- 🔄 **CI/CD Integration**: AL-Go compatible workflows
- 📊 **Metrics**: Mutation scores track test quality

---

## 🔧 Requirements

- Visual Studio Code 1.80.0 or higher
- AL Language Extension
- Anthropic API Key (get free credits at https://console.anthropic.com)
- Business Central AL Project

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

---

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/al-ai-test-generator/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/yourusername/al-ai-test-generator/discussions)
- 📧 **Email**: your.email@example.com

---

**Made with ❤️ for the Business Central Community**
