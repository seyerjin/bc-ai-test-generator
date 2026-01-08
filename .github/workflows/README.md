# GitHub Actions Workflows

Diese Workflows implementieren eine vollständige CI/CD Pipeline mit AL-Go Integration.

## 📋 Workflows

### ci-cd.yml
**Hauptworkflow für CI/CD mit AL-Go und Mutation Testing**

**Trigger:**
- Push zu `main` oder `dev`
- Pull Requests
- Manuell (workflow_dispatch)

**Jobs:**
1. **initialize** - AL-Go Setup
2. **build-al-projects** - Baut AL Code (falls vorhanden)
3. **build-extension** - Baut VS Code Extension
4. **test-extension** - Unit Tests
5. **mutation-test** - Mutation Testing (PR only)
6. **security-audit** - npm audit
7. **package** - VSIX Package
8. **integration-test** - AL + Extension Test
9. **deploy** - Marketplace Deployment (main only)
10. **update-al-go** - AL-Go Updates (manual)

## 📊 Pipeline-Übersicht

```
Push/PR → Initialize → Build (AL + Extension) → Test → Mutation Test
                                                       ↓
                                                  Security Audit
                                                       ↓
                                                   Package VSIX
                                                       ↓
                                              Integration Test
                                                       ↓
                                              Deploy (main only)
```

## 🧪 Mutation Testing

Läuft automatisch bei Pull Requests:
- Erstellt HTML Report
- Kommentiert PR mit Score
- Artifact: 30 Tage Retention

## 📦 Artifacts

| Name | Retention | Wann |
|------|-----------|------|
| al-build-output | 1 Tag | AL Build |
| extension-build | 1 Tag | Jeder Build |
| test-results | 30 Tage | Jeder Test |
| mutation-report | 30 Tage | PR only |
| security-audit | 30 Tage | Jeder Build |
| vsix-package-X.X.X | 90 Tage | Jeder Build |

## 🚀 Usage

### Lokale Entwicklung
```bash
npm ci
npm run compile
npm test
npm run mutation-test
npx vsce package
```

### CI/CD
Workflows laufen automatisch bei Git Events.

### AL-Go Update
```
Actions → CI/CD with AL-Go → Run workflow
```

## 📚 Weitere Infos

Siehe [AL_GO_INTEGRATION.md](../../AL_GO_INTEGRATION.md) für Details.
