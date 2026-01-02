# Changelog

## [2.3.0] - 2025-12-31

### Added - TEST APP STRUCTURE (BC Best Practice)
- 📁 **Automatische Test App Struktur**:
  - Erstellt `test/` Ordner automatisch
  - Erstellt `test/app.json` mit Dependencies
  - Erstellt `test/launch.json` für Test Runner
  - Erstellt `test/source/` für Test-Codeunits
  - Folgt Microsoft BC Best Practice
  - Referenziert Main App automatisch
  - Inkludiert Test Libraries (Test Runner, Library Assert, Any)

- 🔍 **Intelligente App-Erkennung**:
  - Findet Main App automatisch (app/, src/, oder root)
  - Liest Publisher, Name, Version aus
  - Generiert korrektes Test App app.json

- ⚙️ **Launch Configuration**:
  - SaaS (Sandbox) Configuration
  - On-Premise Configuration
  - TestSuite Runner Setup

### Structure
```
MyExtension/
├── app/
│   ├── app.json           ← Main App
│   └── source/
│       └── Customer.al
└── test/                   ← Automatisch erstellt!
    ├── app.json            ← Test App
    ├── launch.json         ← Test Runner Config
    └── source/
        └── Customer.Test.al
```

### Technical
- TestAppSetupService erstellt
- FileHandler verwendet Test App Struktur
- Workspace State für persistente Settings

## [2.2.0] - 2025-12-31

### Fixed - CRITICAL BUG FIXES
- 🐛 **Trailing Text Entfernt**:
  - AI-generierter Text nach Codeunit wird jetzt automatisch entfernt
  - Verhindert Kompilierfehler durch Text außerhalb der Codeunit
  - Intelligentes Brace-Counting für korrektes Codeunit-Ende

- ✅ **Subtype Korrigiert**:
  - `Subtype = Test` (korrekt) statt `Subtype = test` (falsch)
  - Kompiliert jetzt ohne Fehler in Business Central

- ❌ **TestIsolation Entfernt**:
  - `TestIsolation` Property wird nicht mehr generiert
  - Verhindert Kompilierfehler und folgt BC Best Practices

### Added - ID MANAGEMENT
- 🆔 **Automatische ID-Verwaltung**:
  - User wird vor erster Test-Generierung nach Start-ID gefragt
  - Extension vergibt automatisch fortlaufende IDs
  - Neuer Command: "AL: Reset Test ID Counter"
  - IDs werden persistent im Workspace gespeichert

### Technical
- IdService für zentrale ID-Verwaltung
- Workspace State für ID-Persistierung
- Verbesserte Code-Extraktion mit Brace-Counting

## [2.1.0] - 2025-12-31

### Added - EXTENSION SUPPORT & BUNDLING
- 🔌 **Extension Object Support**:
  - TableExtension testing
  - PageExtension testing
  - ReportExtension testing
  - EnumExtension testing
  - Automatic detection of "extends" clause
  - Extension-specific test patterns

- 📦 **esbuild Bundling**:
  - Production-ready VSIX packaging
  - All dependencies bundled into single file
  - 70% smaller VSIX size (62 KB vs 1.1 MB)
  - 10-100x faster than webpack
  - Tree-shaking and minification

- 🎯 **Improved Test Generation**:
  - Extension-aware prompts
  - Base object integration testing
  - Extended field testing
  - Extended action testing

### Changed
- Parser now detects extension types
- Context includes "extends" information
- VSIX build process uses esbuild
- package.json main points to dist/extension.js

### Technical
- esbuild.js script for bundling
- .vscodeignore updated for dist/
- activationEvents: onStartupFinished
- Production-ready deployment

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
