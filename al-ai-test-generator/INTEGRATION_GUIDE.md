# Integration Guide: Nahtlose Integration in bestehende Projekte

Diese Anleitung zeigt, wie Sie die Extension in Ihr bestehendes Business Central Projekt integrieren.

## Installation

### Option 1: Aus VS Code Marketplace (Nach Publishing)
```bash
1. VS Code öffnen
2. Extensions (Ctrl+Shift+X)
3. Suchen: "AL AI Test Generator"
4. "Install" klicken
```

### Option 2: Aus VSIX-Datei (Vor Publishing)
```bash
code --install-extension al-ai-test-generator-2.0.0.vsix
```

---

## Ersteinrichtung

### Schritt 1: API-Key setzen

**Wichtig:** Die Extension benötigt einen Anthropic API-Key.

1. **API-Key erstellen:**
   - Gehen Sie zu: https://console.anthropic.com
   - Erstellen Sie einen Account (falls noch nicht vorhanden)
   - Navigieren Sie zu "API Keys"
   - Klicken Sie auf "Create Key"
   - **Speichern Sie den Key** (z.B. `sk-ant-api03-...`)

2. **In VS Code konfigurieren:**
   ```
   Ctrl+Shift+P → "AL: Set Anthropic API Key"
   ```
   Geben Sie Ihren API-Key ein.

**Der API-Key wird sicher in VS Code's Secret Storage gespeichert** (nicht im Projekt, nicht im Git).

---

## Integration in bestehendes Projekt

### Projekt-Struktur

Die Extension funktioniert mit **jeder** AL-Projekt-Struktur:

```
IhrProjekt/
├── .vscode/
├── .alpackages/
├── app.json
├── src/                          ← Ihr Code
│   ├── Tables/
│   │   └── Customer.Table.al
│   ├── Pages/
│   │   └── CustomerCard.Page.al
│   └── Codeunits/
│       └── CustomerMgmt.Codeunit.al
└── Test/                         ← Wird automatisch erstellt
    ├── Tables/
    │   └── Customer.Test.al
    ├── Pages/
    │   └── CustomerCard.Test.al
    └── Codeunits/
        └── CustomerMgmt.Test.al
```

**Die Extension:**
- ✅ Erkennt automatisch AL-Dateien
- ✅ Erstellt Test-Ordner automatisch
- ✅ Passt sich Ihrer Struktur an
- ✅ Keine zusätzliche Konfiguration nötig

---

## Verwendung

### 1. Test für einzelne Datei generieren

**Variante A: Rechtsklick**
1. Öffnen Sie eine AL-Datei (z.B. `Customer.Table.al`)
2. Rechtsklick im Editor
3. **"AL: Generate Tests with AI"**
4. Warten (10-30 Sekunden)
5. ✅ Test-Datei wird in `Test/` erstellt

**Variante B: Command Palette**
1. AL-Datei öffnen
2. `Ctrl+Shift+P`
3. Tippen: **"AL: Generate"**
4. Enter

**Variante C: Keyboard Shortcut (Optional)**
```json
// In keybindings.json hinzufügen:
{
  "key": "ctrl+shift+t",
  "command": "alTestGenerator.generateTests",
  "when": "editorLangId == al"
}
```

### 2. Mutation Testing ausführen

**Nach Test-Generierung:**
1. Rechtsklick auf Test-Datei
2. **"AL: Run Mutation Tests"**
3. Warten (kann mehrere Minuten dauern)
4. ✅ HTML-Report wird erstellt

**Oder via Command Palette:**
```
Ctrl+Shift+P → "AL: Run Mutation Tests"
```

---

## Konfiguration (Optional)

### Settings in VS Code anpassen:

```json
// settings.json
{
  "alTestGenerator.model": "claude-sonnet-4-5-20250929",
  "alTestGenerator.maxTokens": 8000,
  "alTestGenerator.timeout": 60,
  "alTestGenerator.testIsolation": "Subscriber",
  "alTestGenerator.generateMocks": true,
  "alTestGenerator.includeNegativeTests": true,
  
  // Mutation Testing
  "alTestGenerator.mutation.enabledOperators": [
    "AOR", "ROR", "LCR", "SDL", "RVR", "BVR"
  ],
  "alTestGenerator.mutation.timeout": 30000,
  "alTestGenerator.mutation.parallelExecution": true,
  "alTestGenerator.mutation.maxParallelMutants": 5
}
```

**Zugriff:**
```
Ctrl+, → Extensions → AL AI Test Generator
```

---

## Best Practices für Integration

### 1. Schrittweise Integration

**Phase 1: Einzelne Datei**
- Beginnen Sie mit einer einfachen Datei
- Generieren Sie Tests
- Prüfen Sie Qualität
- Passen Sie an

**Phase 2: Modul**
- Testen Sie ein komplettes Modul
- Sammeln Sie Erfahrung
- Dokumentieren Sie Patterns

**Phase 3: Projekt-weit**
- Integrieren Sie in CI/CD
- Automatisieren Sie Tests
- Setzen Sie Quality Gates

### 2. Git-Integration

**.gitignore erweitern:**
```gitignore
# AL AI Test Generator
mutation-report/
*.mutation.log
```

**Git Workflow:**
```bash
# Feature Branch erstellen
git checkout -b feature/add-customer-tests

# Tests generieren
# (Rechtsklick → Generate Tests)

# Tests reviewen und anpassen
git add src/Test/
git commit -m "Add AI-generated tests for Customer module"

# Pull Request erstellen
git push origin feature/add-customer-tests
```

### 3. Code Review

**Reviewen Sie generierte Tests:**
- ✅ Prüfen Sie Test-Logik
- ✅ Validieren Sie Assertions
- ✅ Ergänzen Sie Edge Cases
- ✅ Passen Sie an Ihr Projekt an

**Die KI ist ein Helfer, kein Ersatz für Ihr Know-how!**

### 4. CI/CD Integration

**GitHub Actions Beispiel:**
```yaml
name: AL Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run AL Tests
        run: |
          # Ihre BC Test-Pipeline
          
      - name: Run Mutation Tests
        run: |
          # Optional: Mutation Testing
          code --install-extension al-ai-test-generator.vsix
          # Mutation Tests ausführen
```

---

## Team-Setup

### Für Teams mit mehreren Entwicklern:

### 1. Shared Configuration

**In Repository committen:**
```json
// .vscode/settings.json
{
  "alTestGenerator.testIsolation": "Subscriber",
  "alTestGenerator.generateMocks": true
}
```

### 2. API-Key Management

**Option A: Jeder Entwickler eigener Key**
```
Jeder Entwickler setzt seinen eigenen API-Key:
Ctrl+Shift+P → "AL: Set Anthropic API Key"
```

**Option B: Team-Key (nicht empfohlen für Produktion)**
```bash
# Für Test/Dev-Umgebungen
# API-Key in Team-Vault speichern
# Jeder Entwickler lokal konfigurieren
```

### 3. Test-Guidelines

**Dokumentieren Sie für Ihr Team:**
```markdown
# Test-Guidelines

## Wann Tests generieren?
- Neue Features: Immer
- Bugfixes: Bei Business Logic
- Refactoring: Optional

## Test-Review-Prozess
1. Tests generieren
2. Selbst reviewen
3. Edge Cases ergänzen
4. Pull Request erstellen
5. Team Review

## Mutation Testing
- Nur für kritische Module
- Vor Major Releases
- Bei Quality Gates
```

---

## Migration bestehender Tests

### Tests neben AI-Tests nutzen:

```
IhrProjekt/
├── Test/
│   ├── Manual/              ← Ihre bestehenden Tests
│   │   └── Customer.Test.al
│   └── Generated/           ← AI-generierte Tests
│       └── Customer.AI.Test.al
```

**Beide Test-Typen können koexistieren!**

---

## Troubleshooting

### Extension wird nicht geladen

**Problem:** Commands nicht verfügbar
**Lösung:**
```
1. Prüfen: AL-Extension installiert?
2. AL-Projekt geöffnet?
3. VS Code neu laden: Ctrl+Shift+P → "Reload Window"
```

### API-Key Fehler

**Problem:** "No API key found"
**Lösung:**
```
Ctrl+Shift+P → "AL: Set Anthropic API Key"
```

### Test-Generierung schlägt fehl

**Problem:** "Could not parse AL code"
**Lösung:**
```
1. Prüfen Sie AL-Syntax
2. Datei muss valide sein (kompilierbar)
3. Unterstützte Objekte: table, page, codeunit, report
```

### Mutation Tests zu langsam

**Problem:** Mutation Testing dauert sehr lange
**Lösung:**
```json
// settings.json
{
  "alTestGenerator.mutation.parallelExecution": true,
  "alTestGenerator.mutation.maxParallelMutants": 10,
  "alTestGenerator.mutation.enabledOperators": ["AOR", "ROR"]  // Nur wichtige
}
```

---

## Performance-Tipps

### 1. Selective Testing
- Generieren Sie Tests nur für kritischen Code
- Nicht jede Helper-Funktion braucht Tests

### 2. Parallel Execution
- Aktivieren Sie Parallel Execution
- Nutzen Sie moderne Hardware

### 3. Operator Selection
- Nicht alle Mutation Operators sind immer nötig
- AOR + ROR decken 70% der Fehler ab

### 4. Caching
- Tests werden nicht neu generiert, wenn bereits vorhanden
- Löschen Sie Test-Dateien, um neu zu generieren

---

## Weitere Ressourcen

### Dokumentation
- [Microsoft BC Test Standards](MICROSOFT_BC_TEST_STANDARDS.md)
- [Mutation Testing Guide](MUTATION_TESTING_GUIDE.md)
- [README](README.md)

### Community
- GitHub Issues
- Business Central Community Forum
- Stack Overflow Tag: `business-central`

### Training
- Microsoft Learn: BC Testing
- AL Development Dokumentation
- Unit Testing Best Practices

---

## Checkliste: Erfolgreiche Integration

- [ ] Extension installiert
- [ ] API-Key konfiguriert
- [ ] Erste Tests generiert
- [ ] Tests geprüft und angepasst
- [ ] Team-Guidelines definiert
- [ ] Git-Workflow eingerichtet
- [ ] CI/CD konfiguriert (optional)
- [ ] Mutation Testing getestet
- [ ] Performance optimiert
- [ ] Team geschult

---

## Support

Bei Fragen oder Problemen:
- GitHub Issues: https://github.com/yourusername/al-ai-test-generator/issues
- Dokumentation: Siehe README.md
- Community: Business Central Forum
