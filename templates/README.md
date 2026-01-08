# CI/CD Pipeline Setup Guide for AL Projects
## BC AI Test Generator Template

This guide explains how to integrate the CI/CD pipeline template into your Business Central AL project to enable automated testing, code coverage analysis, and mutation testing.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (5 minutes)](#quick-start)
3. [Detailed Setup Instructions](#detailed-setup-instructions)
4. [Configuration](#configuration)
5. [GitHub Secrets Setup](#github-secrets-setup)
6. [Testing the Pipeline](#testing-the-pipeline)
7. [Understanding the Pipeline](#understanding-the-pipeline)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Configuration](#advanced-configuration)

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Business Central AL Project** with tests
- ✅ **GitHub Repository** for your AL project
- ✅ **BC AI Test Generator Extension** installed in VS Code
- ✅ **GitHub Actions** enabled in your repository
- ✅ **Node.js 20+** installed (for local mutation testing)

---

## Quick Start

**For the impatient: Get up and running in 5 minutes!**

```bash
# 1. Navigate to your AL project root
cd your-al-project

# 2. Create .github directory structure
mkdir -p .github/workflows .github/mutation-testing

# 3. Copy pipeline template
cp /path/to/bc-ai-test-generator/templates/workflows/al-pipeline.yml \
   .github/workflows/ci-cd.yml

# 4. Copy mutation testing files
cp /path/to/bc-ai-test-generator/templates/mutation-testing/* \
   .github/mutation-testing/

# 5. Install mutation testing dependencies
cd .github/mutation-testing
npm install

# 6. Configure GitHub Secrets (see section below)

# 7. Commit and push
cd ../..
git add .github/
git commit -m "ci: Add CI/CD pipeline with mutation testing"
git push

# 8. Create a test Pull Request to see it in action!
```

**That's it!** 🎉 The pipeline will now run automatically on Pull Requests.

---

## Detailed Setup Instructions

### Step 1: Copy Pipeline Files

#### 1.1 Create Directory Structure

```bash
cd your-al-project
mkdir -p .github/workflows
mkdir -p .github/mutation-testing
```

#### 1.2 Copy Pipeline Configuration

```bash
# Copy the main pipeline file
cp templates/workflows/al-pipeline.yml .github/workflows/ci-cd.yml
```

#### 1.3 Copy Mutation Testing Scripts

```bash
# Copy all mutation testing files
cp templates/mutation-testing/package.json .github/mutation-testing/
cp templates/mutation-testing/run-mutation-tests.js .github/mutation-testing/
cp templates/mutation-testing/generate-report.js .github/mutation-testing/
```

### Step 2: Install Dependencies

```bash
cd .github/mutation-testing
npm install
cd ../..
```

This installs the required Node.js packages for mutation testing.

### Step 3: Customize Pipeline (Optional)

Edit `.github/workflows/ci-cd.yml` and customize:

```yaml
# Line ~180: Project name
$project = "YourProjectName"  # Change this to your project name
$buildMode = "Default"        # Or: Clean, Translated

# Line ~350: Minimum coverage threshold
$minCoverage = 70  # Adjust as needed (50-90%)

# Line ~670: Deployment environment
environmentName: 'Sandbox'  # Or: Staging, Test, etc.
```

### Step 4: Configure AL-Go Settings

Create or update `.AL-Go/settings.json` in your project root:

```json
{
  "type": "PTE",
  "country": "de",
  "artifact": "bcinsider",
  "enableCodeCov": true,
  "doNotPublishApps": false,
  "doNotRunTests": false
}
```

---

## Configuration

### Project Configuration

#### app.json

Ensure your `app.json` is properly configured:

```json
{
  "id": "12345678-1234-1234-1234-123456789012",
  "name": "Your Extension Name",
  "publisher": "Your Company",
  "version": "1.0.0.0",
  "target": "OnPrem",
  "dependencies": [],
  "test": {
    "codeunits": [
      50100,
      50101
    ]
  }
}
```

#### Test Codeunits

Place your test codeunits in a `Test/` folder:

```
your-al-project/
├── src/           # Source code
├── Test/          # Test codeunits
│   ├── CustomerTest.al
│   └── ItemTest.al
├── .github/
│   ├── workflows/
│   │   └── ci-cd.yml
│   └── mutation-testing/
└── app.json
```

## Testing the Pipeline

### Local Testing (Before Push)

Test mutation testing locally:

```bash
cd .github/mutation-testing
npm run mutation-test -- --dry-run
```

This generates mutants without executing tests (fast preview).

### Testing in GitHub Actions

1. **Create a Test Branch:**

```bash
git checkout -b test/pipeline-setup
```

2. **Make a Small Change:**

```bash
echo "# Pipeline Test" >> README.md
git add README.md
git commit -m "test: Validate pipeline setup"
```

3. **Push and Create Pull Request:**

```bash
git push -u origin test/pipeline-setup
```

Then create a Pull Request on GitHub.

4. **Check Pipeline Execution:**

Go to: **Actions** tab in your repository

You should see:
- ✅ Build job running
- ✅ Test job running
- ✅ Code Coverage job running
- ✅ Mutation Test job running (on PR only)

5. **Review PR Comments:**

The pipeline will automatically comment on your PR with:
- 📊 Code Coverage Report
- 🧬 Mutation Test Results

---

## Understanding the Pipeline

### Pipeline Jobs

The pipeline consists of 6 jobs:

```
Initialization → Build → Test → [CodeCoverage ∥ MutationTest] → Deploy → PostProcess
```

#### 1. **Initialization**
- Sets up AL-Go framework
- Initializes telemetry
- **Duration:** ~30 seconds

#### 2. **Build**
- Compiles AL code
- Creates `.app` artifacts
- **Duration:** 2-5 minutes

#### 3. **Test**
- Runs AL tests in BC container
- Generates test results (XML)
- **Duration:** 3-10 minutes

#### 4. **Code Coverage**
- Analyzes test coverage
- Generates coverage report
- Comments on PR
- **Duration:** 1-2 minutes

#### 5. **Mutation Testing**
- Creates code mutations
- Runs tests against mutations
- Calculates mutation score
- **Duration:** 10-60 minutes
- **Only runs on:** Pull Requests

#### 6. **Deploy**
- Deploys to target environment
- **Only runs on:** Push to main branch

#### 7. **Post-Process**
- Cleanup and finalization
- **Always runs:** Even if other jobs fail

### Artifacts

The pipeline produces these downloadable artifacts:

| Artifact | Contents | Retention |
|----------|----------|-----------|
| `main-Apps-Default` | Compiled `.app` files | 30 days |
| `main-TestApps-Default` | Test `.app` files | 30 days |
| `TestResults` | Test execution results (XML) | 30 days |
| `CoverageReport` | Coverage analysis (JSON) | 90 days |
| `MutationTestReport` | Mutation testing results | 90 days |

### Viewing Artifacts

1. Go to **Actions** tab
2. Click on a workflow run
3. Scroll to "Artifacts" section
4. Download artifacts

---

## Advanced Configuration

### Custom Mutation Operators

Edit `.github/mutation-testing/run-mutation-tests.js`:

```javascript
const MUTATION_OPERATORS = {
  AOR: { enabled: true },   // Arithmetic operators
  ROR: { enabled: true },   // Relational operators
  LCR: { enabled: false },  // Logical connectors (disable if too slow)
  SDL: { enabled: true },   // Statement deletion
  RVR: { enabled: true },   // Return values
  BVR: { enabled: false }   // Boundary values (disable if too slow)
};
```

### Conditional Deployment

Deploy to different environments based on branch:

```yaml
Deploy:
  if: |
    (github.ref == 'refs/heads/main' && github.event_name == 'push') ||
    (github.ref == 'refs/heads/develop' && github.event_name == 'push')
  steps:
    - name: Deploy
      with:
        environmentName: ${{ github.ref == 'refs/heads/main' && 'Production' || 'Staging' }}
```

### Matrix Testing

Test on multiple BC versions:

```yaml
Test:
  strategy:
    matrix:
      bc-version: ['21.0', '22.0', '23.0']
  steps:
    - name: Run Tests
      with:
        bcVersion: ${{ matrix.bc-version }}
```

### Custom Coverage Thresholds per Branch

```yaml
- name: Validate Coverage
  run: |
    $threshold = if ($env:GITHUB_REF -eq 'refs/heads/main') { 80 } else { 70 }
    if ($coverage -lt $threshold) {
      throw "Coverage below threshold"
    }
```

---

## Performance Optimization

### Speed Up Build Time

1. **Use Caching:**

```yaml
- name: Cache AL Packages
  uses: actions/cache@v3
  with:
    path: .alpackages
    key: ${{ runner.os }}-alpackages-${{ hashFiles('app.json') }}
```

2. **Parallel Jobs:**

```yaml
Test:
  strategy:
    matrix:
      shard: [1, 2, 3, 4]
  steps:
    - name: Run Tests (Shard ${{ matrix.shard }}/4)
```

3. **Skip Unnecessary Jobs:**

```yaml
on:
  push:
    paths-ignore:
      - 'docs/**'
      - '**.md'
```

---

## Data Analysis

### Exporting Metrics for Research

All pipeline metrics are stored as JSON artifacts.

**Coverage Data:**
```bash
# Download coverage data
gh run download <run-id> --name CoverageReport

# Analyze with jq
cat coverage/summary.json | jq '.lineCoverage'
```

**Mutation Data:**
```bash
# Download mutation data
gh run download <run-id> --name MutationTestReport

# Analyze with jq
cat mutation-report/summary.json | jq '.mutationScore'
```

### R Analysis Example

```r
library(jsonlite)
library(ggplot2)

# Load data
coverage <- fromJSON("coverage/summary.json")
mutation <- fromJSON("mutation-report/summary.json")

# Create dataframe
metrics <- data.frame(
  coverage = coverage$lineCoverage,
  mutation_score = mutation$mutationScore
)

# Plot
ggplot(metrics, aes(x = coverage, y = mutation_score)) +
  geom_point() +
  labs(title = "Coverage vs Mutation Score",
       x = "Line Coverage (%)",
       y = "Mutation Score (%)")
```

---

## Support

### Getting Help

- **Template Issues:** https://github.com/seyerjin/bc-ai-test-generator/issues
- **AL-Go Documentation:** https://github.com/microsoft/AL-Go
- **BC Testing Guide:** https://learn.microsoft.com/dynamics365/business-central/dev-itpro/developer/devenv-testing-application

### Community

- **BC Community:** https://community.dynamics.com/business
- **AL Language:** https://github.com/microsoft/AL

---

## Checklist

Use this checklist to verify your setup:

- [ ] Copied `al-pipeline.yml` to `.github/workflows/ci-cd.yml`
- [ ] Copied mutation testing files to `.github/mutation-testing/`
- [ ] Ran `npm install` in `.github/mutation-testing/`
- [ ] Configured `LICENSEFILE_URL` secret
- [ ] Configured other required secrets
- [ ] Customized project name in pipeline
- [ ] Created `.AL-Go/settings.json`
- [ ] Committed all files to repository
- [ ] Pushed to GitHub
- [ ] Created test Pull Request
- [ ] Verified pipeline runs successfully
- [ ] Reviewed PR comments (coverage, mutation score)
- [ ] Downloaded and inspected artifacts

---

**Setup Complete!** 🎉

Your AL project now has a fully automated CI/CD pipeline with:
- ✅ Automated builds
- ✅ Test execution
- ✅ Code coverage analysis
- ✅ Mutation testing
- ✅ Automated deployment
- ✅ PR quality gates

**Happy Testing!** 🚀
