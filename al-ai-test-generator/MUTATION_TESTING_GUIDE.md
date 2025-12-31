# Mutation Testing Guide

## Was ist Mutation Testing?

Mutation Testing ist eine Technik zur Bewertung der **Qualität von Tests**, nicht des Codes. Es funktioniert wie folgt:

1. **Mutanten erstellen**: Künstlich Fehler in Code einbauen
2. **Tests ausführen**: Schauen ob Tests die Fehler erkennen
3. **Score berechnen**: Prozentsatz erkannter Mutanten

**Ziel**: Mutation Score > 80%

## Mutation Operators

### 1. AOR - Arithmetic Operator Replacement
```al
// Original
Amount := Price + Tax;

// Mutant
Amount := Price - Tax;  // ← Changed + to -
```

### 2. ROR - Relational Operator Replacement
```al
// Original
if Quantity > 0 then

// Mutant
if Quantity >= 0 then  // ← Changed > to >=
```

### 3. LCR - Logical Connector Replacement
```al
// Original
if (Active and Approved) then

// Mutant
if (Active or Approved) then  // ← Changed AND to OR
```

### 4. SDL - Statement Deletion
```al
// Original
Validate("Customer No.");
Insert(true);

// Mutant
// Validate("Customer No.");  ← Deleted
Insert(true);
```

### 5. RVR - Return Value Replacement
```al
// Original
exit(true);

// Mutant
exit(false);  // ← Changed true to false
```

### 6. BVR - Boundary Value Replacement
```al
// Original
if Quantity > 10 then

// Mutant
if Quantity > 11 then  // ← Changed 10 to 11
```

## Usage

### Run Mutation Tests

```bash
# Via Command Palette
Ctrl+Shift+P → "Run Mutation Tests"

# Or right-click on AL file
Right-click → "Run Mutation Tests"
```

### Configure

```json
{
  "alTestGenerator.mutation.enabledOperators": [
    "AOR",  // Arithmetic
    "ROR",  // Relational
    "LCR",  // Logical
    "SDL",  // Statement Deletion
    "RVR",  // Return Value
    "BVR"   // Boundary
  ],
  "alTestGenerator.mutation.timeout": 30000,
  "alTestGenerator.mutation.parallelExecution": true
}
```

### Interpret Results

| Status | Meaning | Good/Bad |
|--------|---------|----------|
| **Killed** ✅ | Test detected the mutant | ✅ GOOD |
| **Survived** ❌ | Test did NOT detect mutant | ❌ BAD |
| **Timeout** ⏱️ | Test took too long | ⚠️ Neutral |
| **Error** ⚠️ | Mutant caused compilation error | ⚠️ Neutral |

### Quality Thresholds

| Mutation Score | Quality | Action |
|----------------|---------|--------|
| 80-100% | 🌟 Excellent | Great! Maintain |
| 60-79% | 👍 Good | Good work |
| 40-59% | 👌 Fair | Improve coverage |
| 20-39% | ⚠️ Poor | Add more tests |
| 0-19% | ❌ Very Poor | Insufficient testing |

## Best Practices

### 1. Start Small
Begin with one module, not entire codebase

### 2. Fix Survivors
Each survived mutant = missing test case

### 3. Use Selectively
Mutation testing is slow - use on critical code

### 4. CI/CD Integration
Run mutation tests on PR, not every commit

### 5. Set Thresholds
Fail build if mutation score < 80%

## Example Workflow

1. **Write Code**
   ```al
   procedure CalculateDiscount(Amount: Decimal): Decimal
   begin
       if Amount > 1000 then
           exit(Amount * 0.1);
       exit(0);
   end;
   ```

2. **Generate Tests** (with AI)
   ```al
   [Test]
   procedure TestDiscount_HighAmount_Returns10Percent()
   begin
       // Given
       Amount := 1500;
       
       // When
       Result := CalculateDiscount(Amount);
       
       // Then
       Assert.AreEqual(150, Result, 'Wrong discount');
   end;
   ```

3. **Run Mutation Tests**
   - Creates mutants (>, >=, <, 0.1 → 0.2, etc.)
   - Runs tests against each mutant
   - Reports which mutants survived

4. **Fix Survivors**
   If mutant `Amount > 1000` → `Amount >= 1000` survived, add test:
   ```al
   [Test]
   procedure TestDiscount_ExactlyThreshold_NoDiscount()
   begin
       Result := CalculateDiscount(1000);
       Assert.AreEqual(0, Result, 'Should not get discount at threshold');
   end;
   ```

## CI/CD Integration

The pipeline automatically runs mutation tests on PRs:

```yaml
mutation-testing:
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  steps:
    - run: npm run mutation-test
    - uses: actions/upload-artifact@v4
      with:
        name: mutation-report
```

## Troubleshooting

**Q: Mutation testing takes too long**
A: Enable parallel execution, increase timeout, or reduce operators

**Q: Too many survivors**
A: Add more test cases for edge cases

**Q: Error mutants**
A: Normal - some mutations cause compilation errors

**Q: How to improve score?**
A: Add tests for boundary values, error conditions, edge cases
