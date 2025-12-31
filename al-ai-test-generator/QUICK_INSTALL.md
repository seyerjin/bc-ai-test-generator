# Quick Install Guide - Lokale Installation

## Option 1: VSIX Package (Empfohlen)

### Schritt 1: Package erstellen
```bash
cd al-ai-test-generator-v2

# vsce installieren (einmalig)
npm install -g @vscode/vsce

# Package erstellen
vsce package
```

**Output:** `al-ai-test-generator-2.0.0.vsix` (ca. 500 KB)

### Schritt 2: In VS Code installieren
```bash
code --install-extension al-ai-test-generator-2.0.0.vsix
```

**Oder manuell:**
1. VS Code öffnen
2. Extensions (Ctrl+Shift+X)
3. "..." (Mehr Aktionen)
4. "Install from VSIX..."
5. Datei auswählen: `al-ai-test-generator-2.0.0.vsix`

### Schritt 3: VS Code neu laden
```
Ctrl+Shift+P → "Developer: Reload Window"
```

### Schritt 4: Testen
1. AL-Projekt öffnen
2. `Ctrl+Shift+P` → "AL: Set Anthropic API Key"
3. API-Key eingeben
4. AL-Datei öffnen
5. Rechtsklick → "AL: Generate Tests with AI"

✅ **Fertig!**

---

## Option 2: Development Mode (Ohne Package)

### Für Entwicklung/Testing:

```bash
cd al-ai-test-generator-v2
npm install
npm run compile
code .
```

**In VS Code:**
- F5 drücken
- Neue VS Code Instanz öffnet sich
- Extension ist dort geladen

---

## Was ist neu?

✅ **Progress schließt automatisch** - Kein manuelles Schließen mehr nötig
✅ **Non-blocking Toast** - Nachricht blockiert nicht die Arbeit
✅ **Multilingual Labels** - Automatisch DEU + ENU TextConst
✅ **Marketplace-ready** - Kann jederzeit published werden

---

## Troubleshooting

### "vsce: command not found"
```bash
npm install -g @vscode/vsce
```

### "Extension not found after install"
```
Ctrl+Shift+P → "Developer: Reload Window"
```

### "Commands not available"
1. Prüfen: AL-Extension installiert?
2. AL-Projekt geöffnet?
3. VS Code neu laden

### Package erstellen schlägt fehl
```bash
# Icon fehlt? Erstellen Sie einen Placeholder:
mkdir -p resources
echo "PNG" > resources/icon.png

# Oder: Icon in package.json auskommentieren
```

---

## Updates installieren

Nach Änderungen am Code:

```bash
# Neu kompilieren
npm run compile

# Neues Package erstellen
vsce package

# Alte Version deinstallieren
code --uninstall-extension seyerjin.al-ai-test-generator

# Neue Version installieren
code --install-extension al-ai-test-generator-2.0.0.vsix

# VS Code neu laden
```

---

## Für andere weitergeben

Einfach die `.vsix` Datei teilen:

```bash
# Per Email, Cloud, USB-Stick, etc.
al-ai-test-generator-2.0.0.vsix

# Installation beim Empfänger:
code --install-extension al-ai-test-generator-2.0.0.vsix
```

---

## Publishing im Marketplace (später)

Wenn Sie bereit sind zu publishen:

```bash
# Publisher Account erstellen auf:
# https://marketplace.visualstudio.com/manage

# Dann:
vsce login <publisher-name>
vsce publish
```

Siehe: [PUBLISHING_GUIDE.md](PUBLISHING_GUIDE.md)
