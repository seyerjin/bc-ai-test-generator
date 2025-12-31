# VS Code Marketplace Publishing Guide

Diese Anleitung erklärt, wie Sie die Extension im VS Code Marketplace veröffentlichen.

## Voraussetzungen

### 1. Azure DevOps Account
- Erstellen Sie einen kostenlosen Account: https://dev.azure.com
- Erstellen Sie eine Organisation

### 2. Personal Access Token (PAT)
1. Gehen Sie zu: https://dev.azure.com/[YOUR-ORG]/_usersSettings/tokens
2. Klicken Sie auf "New Token"
3. Name: "VS Code Extension Publishing"
4. Organization: All accessible organizations
5. Scopes: 
   - **Marketplace** → **Manage** (wichtig!)
6. Klicken Sie auf "Create"
7. **Speichern Sie den Token sofort** (wird nur einmal angezeigt!)

### 3. VS Code Extension Manager (vsce)
```bash
npm install -g @vscode/vsce
```

### 4. Publisher erstellen
```bash
vsce create-publisher <publisher-name>
# Oder auf: https://marketplace.visualstudio.com/manage
```

---

## Schritt 1: Vorbereitung

### A. Icon erstellen
Erstellen Sie ein 128x128 PNG Icon:
```bash
# Speichern als: resources/icon.png
```

Vorschlag für Icon-Design:
- AL Logo + KI Symbol (Gehirn/Chip)
- Farben: Business Central Blau (#0078D4)
- Tools: Figma, Canva, Adobe Illustrator

### B. package.json konfigurieren

**Bereits konfiguriert**, aber prüfen Sie:
```json
{
  "name": "al-ai-test-generator",
  "displayName": "AL AI Test Generator with Mutation Testing",
  "description": "...",
  "version": "2.0.0",
  "publisher": "IHR-PUBLISHER-NAME",  // ← ANPASSEN!
  "icon": "resources/icon.png",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOURUSERNAME/al-ai-test-generator"  // ← ANPASSEN!
  }
}
```

### C. README.md für Marketplace anpassen

Das README.md wird auf der Marketplace-Seite angezeigt:
- ✅ Bereits optimiert mit Features, Screenshots, Installation
- ⚠️ Fügen Sie Screenshots hinzu (empfohlen)

### D. CHANGELOG.md prüfen
- ✅ Bereits vorhanden
- Wird auf Marketplace-Seite angezeigt

### E. LICENSE erstellen
```bash
# Bereits erstellt als MIT License
```

---

## Schritt 2: Extension Package erstellen

### 1. Kompilieren
```bash
cd al-ai-test-generator-v2
npm install
npm run compile
```

### 2. Package erstellen
```bash
vsce package
```

Dies erstellt: `al-ai-test-generator-2.0.0.vsix`

**Testen Sie das Package lokal:**
```bash
code --install-extension al-ai-test-generator-2.0.0.vsix
```

---

## Schritt 3: Im Marketplace veröffentlichen

### Option A: Mit vsce CLI (Empfohlen)

1. **Publisher einloggen:**
```bash
vsce login <publisher-name>
# Geben Sie Ihren PAT ein
```

2. **Veröffentlichen:**
```bash
vsce publish
```

Das wars! Die Extension ist jetzt im Marketplace.

### Option B: Manuell über Web Interface

1. Gehen Sie zu: https://marketplace.visualstudio.com/manage
2. Klicken Sie auf "+ New extension" → "Visual Studio Code"
3. Laden Sie die .vsix Datei hoch
4. Füllen Sie die Metadaten aus
5. Klicken Sie auf "Upload"

---

## Schritt 4: Updates veröffentlichen

### Version erhöhen und veröffentlichen:

```bash
# Patch Version (2.0.0 → 2.0.1)
vsce publish patch

# Minor Version (2.0.0 → 2.1.0)
vsce publish minor

# Major Version (2.0.0 → 3.0.0)
vsce publish major

# Oder manuell Version setzen:
vsce publish 2.1.0
```

---

## Best Practices

### 1. Semantic Versioning
- **MAJOR** (x.0.0): Breaking Changes
- **MINOR** (0.x.0): Neue Features (rückwärtskompatibel)
- **PATCH** (0.0.x): Bugfixes

### 2. CHANGELOG.md pflegen
Dokumentieren Sie jede Version:
```markdown
## [2.1.0] - 2025-01-15
### Added
- Neue Feature X
- Support für Y

### Fixed
- Bug Z behoben
```

### 3. README.md aktuell halten
- Screenshots aktualisieren
- Neue Features dokumentieren
- Installation Guide aktuell halten

### 4. Issues und Feedback
- GitHub Issues aktivieren
- Auf Marketplace Reviews antworten
- Community-Feedback einarbeiten

---

## Marketplace-Optimierung

### 1. Keywords optimieren
In package.json:
```json
"keywords": [
  "AL",
  "Business Central",
  "Dynamics 365",
  "Testing",
  "AI",
  "Test Generation",
  "Mutation Testing"
]
```

### 2. Kategorie festlegen
```json
"categories": [
  "Testing",
  "Programming Languages",
  "Machine Learning"
]
```

### 3. Gallery Banner
```json
"galleryBanner": {
  "color": "#0078D4",
  "theme": "dark"
}
```

### 4. Screenshots hinzufügen
Im README.md:
```markdown
![Feature 1](resources/screenshot1.png)
![Feature 2](resources/screenshot2.png)
```

---

## Troubleshooting

### Fehler: "Missing publisher"
```bash
# In package.json setzen:
"publisher": "ihr-publisher-name"
```

### Fehler: "Missing icon"
```bash
# Icon erstellen und in package.json referenzieren:
"icon": "resources/icon.png"
```

### Fehler: "Invalid Personal Access Token"
```bash
# Neuen PAT erstellen mit "Marketplace - Manage" Scope
vsce login <publisher-name>
```

### Extension wird nicht gefunden
- Warten Sie 5-10 Minuten nach dem Publishing
- Cache leeren: Ctrl+Shift+P → "Developer: Reload Window"

---

## Checkliste vor dem Publishing

- [ ] Icon erstellt (128x128 PNG)
- [ ] package.json vollständig ausgefüllt
- [ ] publisher in package.json gesetzt
- [ ] Repository URL aktualisiert
- [ ] README.md mit Screenshots
- [ ] CHANGELOG.md aktuell
- [ ] LICENSE Datei vorhanden
- [ ] npm install erfolgreich
- [ ] npm run compile erfolgreich
- [ ] vsce package erfolgreich
- [ ] Lokal getestet (.vsix installiert)
- [ ] PAT erstellt mit Marketplace-Manage Scope
- [ ] Publisher Account erstellt

---

## Nach dem Publishing

### 1. Extension-Seite prüfen
https://marketplace.visualstudio.com/items?itemName=<publisher>.<extension-name>

### 2. Installation testen
```bash
code --install-extension <publisher>.al-ai-test-generator
```

### 3. Promotion
- GitHub Repository README aktualisieren
- Social Media ankündigen
- Business Central Community informieren
- Blog Post schreiben

### 4. Monitoring
- Download-Statistiken verfolgen
- Reviews lesen und beantworten
- Issues bearbeiten
- Updates planen

---

## Weitere Ressourcen

- [VS Code Publishing Extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce CLI Documentation](https://github.com/microsoft/vscode-vsce)
- [Extension Marketplace](https://marketplace.visualstudio.com/vscode)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

---

## Support

Bei Fragen oder Problemen:
- GitHub Issues: https://github.com/yourusername/al-ai-test-generator/issues
- VS Code Extension Authors: https://aka.ms/vscode-dev-community
