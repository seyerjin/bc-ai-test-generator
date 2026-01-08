# Example AL Project with CI/CD Pipeline

This is a complete example showing how a Business Central AL project should be structured when using the BC AI Test Generator CI/CD pipeline template.

## 📁 Project Structure

```
example-al-project/
├── .github/
│   ├── workflows/
│   │   └── ci-cd.yml              # CI/CD Pipeline (copied from template)
│   └── mutation-testing/
│       ├── package.json
│       ├── run-mutation-tests.js
│       └── generate-report.js
├── .AL-Go/
│   └── settings.json               # AL-Go configuration
├── Test/
│   └── CustomerValidationTest.al   # Example test codeunit
├── app.json                        # AL project manifest
└── README.md                       # This file
```

## 🚀 Quick Start

### 1. Use This as Template

You can use this structure for your own AL project:

```bash
# Copy the entire structure
cp -r example-al-project/ my-al-project/

# Or copy individual files
cp example-al-project/.github/workflows/ci-cd.yml your-project/.github/workflows/
cp -r example-al-project/.github/mutation-testing/ your-project/.github/
cp example-al-project/.AL-Go/settings.json your-project/.AL-Go/
```

### 2. Customize for Your Project

#### Update app.json

```json
{
  "id": "your-guid-here",
  "name": "Your Extension Name",
  "publisher": "Your Company",
  "version": "1.0.0.0",
  "idRanges": [
    {
      "from": 50100,  # Your ID range
      "to": 50149
    }
  ]
}
```

#### Update .AL-Go/settings.json

```json
{
  "country": "de",           # Your country code
  "type": "PTE",             # Or AppSource
  "artifact": "bcinsider",   # Or specific BC version
  "enableCodeCov": true
}
```

#### Update Pipeline Configuration

Edit `.github/workflows/ci-cd.yml`:

```yaml
# Line ~180: Change project name
$project = "YourProjectName"

# Line ~350: Set coverage threshold
$minCoverage = 70

# Line ~670: Set deployment environment
environmentName: 'Production'
```

### 3. Configure GitHub Secrets

Add these secrets to your GitHub repository:

| Secret | Required | Description |
|--------|----------|-------------|
| `LICENSEFILE_URL` | Yes | URL to your BC license file |
| `INSIDER_SAS_TOKEN` | Optional | For BC insider builds |
| `VSCE_PAT` | Optional | For extension publishing |

See: [Setup Guide](../README.md#github-secrets-setup) for details

### 4. Install Dependencies

```bash
cd .github/mutation-testing
npm install
```

### 5. Test Locally

```bash
# Dry-run mutation testing
cd .github/mutation-testing
npm run mutation-test -- --dry-run
```

### 6. Commit and Push

```bash
git add .
git commit -m "ci: Add CI/CD pipeline"
git push
```

### 7. Create Pull Request

The pipeline will automatically:
- ✅ Build your AL project
- ✅ Run all tests
- ✅ Calculate code coverage
- ✅ Perform mutation testing
- ✅ Comment on PR with results

## 📊 Example Test

The included `CustomerValidationTest.al` demonstrates:

- ✅ **Given-When-Then** structure
- ✅ **Library - Assert** usage
- ✅ **Multilingual labels** (DEU/ENU)
- ✅ **Multiple test scenarios**
- ✅ **Error handling tests**

```al
[Test]
procedure TestValidateEmail_ValidFormat_EmailAccepted()
begin
    // [GIVEN] A customer with valid email
    Initialize();
    CreateTestCustomer(Customer);
    ValidEmail := CreateValidEmailAddress();
    
    // [WHEN] Email is validated
    Customer.Validate("E-Mail", ValidEmail);
    
    // [THEN] Email is accepted
    LibraryAssert.AreEqual(ValidEmail, Customer."E-Mail", EmailValidMsg);
end;
```

## 🧬 Mutation Testing Example

After setting up, mutation testing will automatically:

1. **Generate mutations** of your code
2. **Run tests** against each mutation
3. **Calculate score** (% of mutations detected)
4. **Report results** in PR comments

Example output:

```
🧬 Mutation Test Results

Mutation Score: 82.5% 🟢 Excellent

| Metric       | Count | Percentage |
|--------------|-------|------------|
| ✅ Killed    | 99    | 82.5%      |
| ❌ Survived  | 18    | 15.0%      |
| ⏱️ Timeout   | 3     | 2.5%       |
```

## 📈 Coverage Example

Code coverage is automatically calculated and reported:

```
📊 Code Coverage Report

| Metric           | Coverage | Lines/Branches | Status |
|------------------|----------|----------------|--------|
| Line Coverage    | 75.0%    | 150 / 200      | ⚠️     |
| Branch Coverage  | 75.0%    | 45 / 60        | ⚠️     |

Quality Gates:
- ⚠️ Line Coverage: Good (≥70% but <80%)
- ⚠️ Branch Coverage: Good (≥70%)
```

## 🔧 Customization

### Adjust Coverage Threshold

Edit `.github/workflows/ci-cd.yml`:

```yaml
# Line ~350
$minCoverage = 80  # Increase to 80%
```

### Disable Specific Mutation Operators

Edit `.github/mutation-testing/run-mutation-tests.js`:

```javascript
const MUTATION_OPERATORS = {
  AOR: { enabled: true },
  ROR: { enabled: true },
  LCR: { enabled: false },  // Disable logical connector mutations
  SDL: { enabled: true },
  RVR: { enabled: true },
  BVR: { enabled: false }   // Disable boundary value mutations
};
```

### Change Deployment Target

Edit `.github/workflows/ci-cd.yml`:

```yaml
Deploy:
  steps:
    - name: Deploy
      with:
        environmentName: 'Staging'  # Deploy to Staging instead
```

## 📚 Additional Resources

- [Full Setup Guide](../README.md) - Complete documentation
- [AL-Go Documentation](https://github.com/microsoft/AL-Go) - AL-Go framework
- [BC Testing Guide](https://learn.microsoft.com/dynamics365/business-central/dev-itpro/developer/devenv-testing-application) - Official BC testing docs
- [Template Repository](https://github.com/seyerjin/bc-ai-test-generator) - Latest template version

## 💡 Tips

1. **Start Small:** Begin with a few tests and gradually increase coverage
2. **Use AI Generation:** Leverage BC AI Test Generator extension to create tests
3. **Monitor Trends:** Track coverage and mutation scores over time
4. **Set Realistic Goals:** Start with 60% coverage, aim for 80%
5. **Review Survived Mutants:** They indicate gaps in your test suite

## ✅ Verification Checklist

- [ ] All files copied to your project
- [ ] `app.json` customized with your details
- [ ] `.AL-Go/settings.json` configured
- [ ] `npm install` completed successfully
- [ ] GitHub Secrets configured
- [ ] Pipeline file customized (project name, thresholds)
- [ ] Test PR created
- [ ] Pipeline runs successfully
- [ ] Coverage and mutation reports appear in PR

## 🆘 Troubleshooting

### Pipeline doesn't run

**Check:**
1. File is at `.github/workflows/ci-cd.yml` (not `workflow/`)
2. YAML syntax is valid
3. GitHub Actions are enabled in repository settings

### Tests fail

**Check:**
1. `app.json` has `test.codeunits` array
2. Test codeunits have `Subtype = Test`
3. License file is valid and accessible

### Mutation testing times out

**Solution:**
Increase timeout in `.github/workflows/ci-cd.yml`:

```yaml
MutationTest:
  timeout-minutes: 120  # Increase to 2 hours
```

## 🎉 Success!

Once everything is set up, you'll have:

- ✅ Automated builds on every push
- ✅ Automated testing on every PR
- ✅ Code coverage analysis
- ✅ Mutation testing for test quality
- ✅ Automated deployment to BC
- ✅ Quality gates preventing low-quality merges

**Happy Testing!** 🚀
