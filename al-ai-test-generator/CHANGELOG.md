# Changelog

## [2.0.0] - 2025-12-30

### Added - MUTATION TESTING FRAMEWORK
- 🧬 **6 Mutation Operators**:
  - AOR: Arithmetic Operator Replacement (+ → -, * → /, etc.)
  - ROR: Relational Operator Replacement (> → >=, < → <=, etc.)
  - LCR: Logical Connector Replacement (AND → OR, NOT removal)
  - SDL: Statement Deletion
  - RVR: Return Value Replacement (true → false, 0 → 1)
  - BVR: Boundary Value Replacement (n → n+1, n-1, 0)

- 📊 **Mutation Score Calculation**
  - Killed/Survived/Timeout/Error mutants tracking
  - Mutation Score Indicator (MSI)
  - Quality rating (Excellent/Good/Fair/Poor)

- 🚀 **Parallel Execution**
  - Configurable parallel mutant testing
  - Batch processing
  - Progress indicators

- 📈 **HTML Report Generation**
  - Beautiful HTML reports with statistics
  - Mutant-by-mutant details
  - Color-coded status indicators

- 🔧 **AL-Go Compatible CI/CD**
  - Microsoft AL-Go best practices
  - Mutation testing in PR pipeline
  - Automated quality gates

### Enhanced
- Updated CI/CD pipeline with mutation testing stage
- New VS Code commands for mutation testing
- Configuration options for mutation operators

## [1.0.0] - Initial Release
- KI-gestützte Testgenerierung
- Claude AI Integration
- AL Code Parser
- Batch-Verarbeitung
