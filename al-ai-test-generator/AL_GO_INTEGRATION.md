# AL-Go Integration Guide

Diese Extension ist vollständig mit Microsoft AL-Go kompatibel.

## 🎯 Was ist AL-Go?

[AL-Go](https://github.com/microsoft/AL-Go) ist Microsofts offizielles DevOps-Framework für Business Central AL Projekte. Es bietet:

- 🔄 CI/CD Workflows
- 📦 Automatisches App Packaging
- 🧪 Test Automation
- 🚀 Deployment Pipelines
- 📊 Code Quality Checks

## 🏗️ Pipeline-Architektur

Unsere CI/CD Pipeline kombiniert AL-Go mit Extension Testing:

```
┌─────────────────────────────────────────────────────┐
│                  Initialize AL-Go                   │
│            (Read Settings & Secrets)                │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
       ┌───────▼────────┐    ┌───────▼────────────┐
       │  Build AL      │    │  Build Extension   │
       │  Projects      │    │  (TypeScript)      │
       │  (Windows)     │    │  (Ubuntu)          │
       └───────┬────────┘    └───────┬────────────┘
               │                      │
               │             ┌────────▼────────────┐
               │             │  Test Extension     │
               │             │  (Unit Tests)       │
               │             └────────┬────────────┘
               │                      │
               │             ┌────────▼────────────┐
               │             │  Mutation Testing   │
               │             │  (PR only)          │
               │             └────────┬────────────┘
               │                      │
               │             ┌────────▼────────────┐
               │             │  Security Audit     │
               │             │  (npm audit)        │
               │             └────────┬────────────┘
               │                      │
               └──────────┬───────────┘
                          │
                  ┌───────▼────────┐
                  │  Package VSIX  │
                  └───────┬────────┘
                          │
                  ┌───────▼───────────┐
                  │  Integration Test │
                  │  (AL + Extension) │
                  └───────┬───────────┘
                          │
                  ┌───────▼────────┐
                  │     Deploy     │
                  │  (main only)   │
                  └────────────────┘
```

## 📋 Pipeline Jobs

### 1. Initialize
- Liest AL-Go Settings
- Initialisiert Telemetrie
- Bereitet Secrets vor

### 2. Build AL Projects
**Runs wenn:** `.AL-Go/settings.json` existiert
**Plattform:** Windows (PowerShell)
**Actions:**
- Liest AL-Go Konfiguration
- Baut AL Apps
- Erstellt Artifacts
- Lädt AL Build Output hoch

### 3. Build Extension
**Plattform:** Ubuntu
**Actions:**
- Installiert Dependencies
- Lint Check
- TypeScript Kompilierung
- Lädt Build Output hoch

### 4. Test Extension
**Abhängig von:** Build Extension
**Actions:**
- Unit Tests
- Coverage Report
- Test Results Upload

### 5. Mutation Testing
**Runs wenn:** Pull Request
**Actions:**
- Führt Mutation Tests aus
- Erstellt HTML Report
- Kommentiert PR mit Score
- Lädt Report hoch (30 Tage)

### 6. Security Audit
**Actions:**
- npm audit (moderate level)
- JSON Report
- Upload für Analyse

### 7. Package VSIX
**Actions:**
- Erstellt VSIX Package
- Versioniert automatisch
- 90 Tage Retention

### 8. Integration Test
**Runs wenn:** AL Build + VSIX beide erfolgreich
**Plattform:** Windows
**Actions:**
- Installiert Extension
- Testet mit echtem BC Projekt
- Validiert Test-Generierung

### 9. Deploy
**Runs wenn:** Push auf `main` Branch
**Environment:** Production
**Actions:**
- Publiziert zu VS Marketplace
- Benötigt `VSCE_PAT` Secret

### 10. Update AL-Go
**Trigger:** Manual (workflow_dispatch)
**Actions:**
- Prüft AL-Go Updates
- Aktualisiert System Files
- Committed Changes

## 🔧 Konfiguration

### AL-Go Settings (`.AL-Go/settings.json`)

```json
{
  "type": "PTE",
  "country": "w1",
  "versioningStrategy": 2,
  "enableCodeCop": true,
  "enableUICop": true,
  "installTestFramework": true,
  "githubRunner": "windows-latest"
}
```

**Wichtige Settings:**
- `type`: "PTE" (Per-Tenant Extension)
- `versioningStrategy`: 2 (GitVersion)
- `enableCodeCop`: true (Code Analysis)
- `enableUICop`: true (UI Validation)
- `installTestFramework`: true (Test Automation)

### GitHub Secrets

Für vollständige Funktionalität benötigt:

**Optional (für Deployment):**
- `VSCE_PAT`: VS Code Marketplace Token

**Optional (für AL-Go):**
- `AdminCenterApiCredentials`: BC Admin Center API
- `LicenseFileUrl`: BC License File
- `InsiderSasToken`: BC Insider Builds

## 📊 Workflow Triggers

### Automatisch:
- ✅ **Push** zu `main` oder `dev`
- ✅ **Pull Request** zu `main` oder `dev`

### Manuell:
- ⚙️ **workflow_dispatch**: AL-Go Update

## 🧪 Mutation Testing Integration

Mutation Testing läuft automatisch bei Pull Requests:

```yaml
- Analysiert Test-Qualität
- Erstellt HTML Report
- Kommentiert PR mit Score
- Gibt Empfehlungen
```

**Mutation Score Grading:**
- 90-100%: 🌟 Excellent
- 80-89%: ✅ Good
- 70-79%: 👍 Acceptable
- <70%: ⚠️ Needs Improvement

## 🚀 Usage

### Lokale Entwicklung

```bash
# AL Code ändern
git checkout -b feature/new-al-code
# Code schreiben...
git commit -m "Add new AL code"
git push

# Pipeline läuft automatisch
```

### Pull Request Workflow

```bash
# PR erstellen
gh pr create --base main --head feature/new-al-code

# Pipeline Steps:
✓ Build AL Projects (falls vorhanden)
✓ Build Extension
✓ Test Extension
✓ Mutation Testing → PR Comment mit Score
✓ Security Audit
✓ Package VSIX
✓ Integration Test
```

### Deployment

```bash
# Nach Merge zu main
git checkout main
git pull

# Pipeline deployed automatisch zu Marketplace
# (wenn VSCE_PAT konfiguriert)
```

### AL-Go Update

```bash
# Im Repository auf GitHub
Actions → CI/CD with AL-Go → Run workflow
```

## 📦 Artifacts

Die Pipeline erstellt folgende Artifacts:

| Artifact | Retention | Inhalt |
|----------|-----------|--------|
| `al-build-output` | 1 Tag | Kompilierte AL Apps |
| `extension-build` | 1 Tag | TypeScript Compiled |
| `test-results` | 30 Tage | Test Coverage |
| `mutation-report` | 30 Tage | Mutation Testing HTML |
| `security-audit` | 30 Tage | npm audit JSON |
| `vsix-package-X.X.X` | 90 Tage | Installierbare Extension |

## 🔍 Monitoring

### Pipeline Status

```bash
# Alle Workflows anzeigen
gh workflow list

# Letzten Run anzeigen
gh run list --workflow="CI/CD with AL-Go"

# Details eines Runs
gh run view <run-id>
```

### Logs

```bash
# Logs eines Jobs anzeigen
gh run view <run-id> --log

# Logs downloaden
gh run download <run-id>
```

## 🛠️ Troubleshooting

### AL Build schlägt fehl

**Problem:** AL-Go Actions können nicht ausgeführt werden
**Lösung:**
1. Prüfen Sie `.AL-Go/settings.json`
2. Stellen Sie sicher, dass AL Code vorhanden ist
3. Validieren Sie AL Syntax

### Extension Tests schlagen fehl

**Problem:** Unit Tests failed
**Lösung:**
1. Lokal testen: `npm test`
2. Dependencies aktualisieren: `npm ci`
3. Tests überarbeiten

### Deployment schlägt fehl

**Problem:** VSCE_PAT fehlt oder ungültig
**Lösung:**
1. PAT erstellen: https://marketplace.visualstudio.com/manage
2. Secret hinzufügen: Repository Settings → Secrets
3. Scope: `Marketplace - Manage`

### Mutation Testing zu langsam

**Problem:** Timeout nach 30 Minuten
**Lösung:**
```json
// In mutation.config.json
{
  "parallelExecution": true,
  "maxParallelMutants": 10,
  "enabledOperators": ["AOR", "ROR"]
}
```

## 📚 Weitere Ressourcen

- [AL-Go Documentation](https://github.com/microsoft/AL-Go/wiki)
- [AL-Go Actions](https://github.com/microsoft/AL-Go-Actions)
- [Business Central DevOps](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-dev-overview)
- [Mutation Testing Guide](MUTATION_TESTING_GUIDE.md)
- [Integration Guide](INTEGRATION_GUIDE.md)

## ✅ Best Practices

### 1. Branch Strategy
```
main (protected)
  ├─ dev (development)
  │   ├─ feature/xyz
  │   └─ bugfix/abc
```

### 2. Commit Messages
```bash
# Gut
git commit -m "feat: Add customer validation tests"
git commit -m "fix: Correct email validation logic"

# Schlecht
git commit -m "update"
git commit -m "wip"
```

### 3. Pull Requests
- ✅ Klein und fokussiert
- ✅ Tests enthalten
- ✅ Mutation Score >80%
- ✅ Security Audit clean

### 4. AL-Go Updates
- 🔄 Monatlich prüfen
- 🔄 Nach Major AL-Go Releases
- 🔄 Bei Problemen

## 🎯 Quality Gates

Vor Merge müssen folgen Gates passieren:

- ✅ Build erfolgreich (AL + Extension)
- ✅ Tests grün
- ✅ Mutation Score >70%
- ✅ Keine Critical Security Issues
- ✅ VSIX Package erstellt
- ✅ Code Review approved

---

## 🤝 Contributing

Bei Verbesserungsvorschlägen für die Pipeline:

1. Issue erstellen
2. Branch erstellen
3. Pipeline testen
4. PR mit Beschreibung

---

**Die Pipeline ist production-ready und folgt Microsoft AL-Go Best Practices!** 🚀
