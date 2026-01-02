# 🚀 Development Mode - README

Diese Extension kann direkt aus diesem Ordner geladen werden - **keine VSIX Installation nötig!**

---

## ⚡ Quick Start (3 Schritte)

### 1. Dependencies installieren
```bash
npm install
```

### 2. Kompilieren
```bash
npm run compile
```

### 3. VS Code öffnen und F5 drücken
```bash
code .
```
**Im VS Code: F5 drücken**

**→ Extension Development Host öffnet sich**  
**→ Extension ist aktiv!** ✅

---

## 🎯 So funktioniert es

### F5 drücken:
1. VS Code startet neues Fenster
2. Lädt Extension aus diesem Ordner
3. Extension ist im neuen Fenster aktiv

### Im Extension Development Host (neues Fenster):
```
Ctrl+Shift+P → "AL: Set Anthropic API Key"
→ Funktioniert! ✅
```

---

## 📁 Wichtige Dateien

```
al-ai-test-generator-v2/
├── src/              ← TypeScript Source
├── out/              ← Kompilierte JS Dateien (npm run compile)
├── package.json      ← Extension Manifest
├── .vscode/
│   └── launch.json   ← F5 Konfiguration
└── node_modules/     ← Dependencies (npm install)
```

---

## 🔄 Nach Code-Änderungen

### Neu kompilieren:
```bash
npm run compile
```

### Extension neu laden:
```
Im Extension Development Host:
Ctrl+Shift+F5
```

---

## ✅ Verifizierung

### Output Channel prüfen:
```
View → Output → "AL AI Test Generator"
```

**Sollte zeigen:**
```
🚀 AL AI Test Generator v2.0
✅ Extension successfully activated!
✅ Commands registered
```

### Commands prüfen:
```
Ctrl+Shift+P → "AL:"
```

**Sollte zeigen:**
- AL: Generate Tests with AI
- AL: Set Anthropic API Key
- AL: Run Mutation Tests
- AL: Configure Mutation Testing

---

## 🐛 Troubleshooting

### Extension aktiviert sich nicht?

**Prüfen:**
1. `npm install` erfolgreich?
2. `npm run compile` ohne Fehler?
3. `out/extension.js` existiert?

**Lösung:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run compile
```

### Commands nicht gefunden?

**Output Channel prüfen:**
```
View → Output → "AL AI Test Generator"
```

**Sollte zeigen:** "Commands registered"

**Wenn nicht:**
- package.json prüfen
- extension.ts prüfen
- Neu kompilieren

---

## 💡 Vorteile Development Mode

✅ **Keine Installation** - Lädt direkt aus Ordner  
✅ **Live Debugging** - Breakpoints setzen  
✅ **Sofortige Änderungen** - Code ändern → Ctrl+Shift+F5  
✅ **Funktioniert immer** - Keine VSIX/Cache-Probleme  

---

## 📦 VSIX erstellen (optional)

Falls Sie doch VSIX erstellen wollen:

```bash
npm install -g @vscode/vsce
npx vsce package
```

**Erstellt:** `al-ai-test-generator-2.0.0.vsix`

**Installation:**
```bash
code --install-extension al-ai-test-generator-2.0.0.vsix
```

---

## 📚 Weitere Dokumentation

- [QUICK_START_DEVELOPMENT.md](../QUICK_START_DEVELOPMENT.md) - Einstieg
- [DEVELOPMENT_MODE_INSTALLATION.md](../DEVELOPMENT_MODE_INSTALLATION.md) - Details
- [README.md](README.md) - Extension Features

---

## 🚀 Los geht's!

```bash
npm install && npm run compile && code .
# F5 drücken im VS Code
# Extension läuft! 🎉
```
