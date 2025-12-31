# VS Code Marketplace Checklist

## ✅ Was wurde implementiert

### 1. Multilingual Labels (DEU/ENU)
- [x] Claude Prompt erweitert für TextConst Labels
- [x] Alle generierten Tests verwenden TextConst
- [x] DEU (German) + ENU (English) Übersetzungen
- [x] Naming Conventions (Msg, Err, Qst, Cnf)
- [x] Beispiele in Dokumentation

### 2. VS Code Marketplace Vorbereitung
- [x] package.json für Marketplace konfiguriert
- [x] Publisher, Description, Keywords hinzugefügt
- [x] Categories definiert
- [x] Repository URLs konfiguriert
- [x] Gallery Banner konfiguriert
- [x] LICENSE erstellt (MIT)

### 3. Dokumentation
- [x] Publishing Guide erstellt
- [x] Integration Guide erstellt
- [x] Microsoft BC Test Standards dokumentiert
- [x] README.md für Marketplace optimiert
- [x] CHANGELOG.md vorhanden

### 4. Nahtlose Integration
- [x] Keine Projekt-spezifischen Dependencies
- [x] Automatische Test-Ordner-Erstellung
- [x] Funktioniert mit jeder AL-Projekt-Struktur
- [x] API-Key sicher in VS Code Secret Storage
- [x] Konfigurierbar über VS Code Settings

---

## ⚠️ TODO vor Publishing

### 1. Icon erstellen
- [ ] 128x128 PNG Icon erstellen
- [ ] Icon speichern als: `resources/icon.png`
- [ ] Vorschlag: AL Logo + KI Symbol

**Tools:**
- Figma: https://figma.com
- Canva: https://canva.com
- Adobe Illustrator

### 2. package.json anpassen
- [ ] `publisher` Name setzen (Zeile 6)
- [ ] `author.name` und `author.email` setzen (Zeilen 7-10)
- [ ] `repository.url` anpassen (Zeile 18)
- [ ] `bugs.url` anpassen (Zeile 21)
- [ ] `homepage` anpassen (Zeile 23)

**Beispiel:**
```json
{
  "publisher": "ihr-publisher-name",
  "author": {
    "name": "Ihr Name",
    "email": "ihre.email@example.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/IhrUsername/al-ai-test-generator"
  }
}
```

### 3. README.md URLs aktualisieren
- [ ] GitHub Repository URL (Zeile 7-9)
- [ ] Support URLs (unten im README)

### 4. Azure DevOps / Marketplace Setup
- [ ] Azure DevOps Account erstellen
- [ ] Personal Access Token (PAT) erstellen
  - Scope: **Marketplace - Manage**
- [ ] Publisher Account erstellen
- [ ] vsce CLI installieren: `npm install -g @vscode/vsce`

### 5. Screenshots erstellen (Optional aber empfohlen)
- [ ] Screenshot 1: Test Generation in Action
- [ ] Screenshot 2: Generated Test mit TextConst Labels
- [ ] Screenshot 3: Mutation Testing Results
- [ ] Screenshot 4: HTML Report
- [ ] Screenshots zu `resources/` hinzufügen
- [ ] In README.md referenzieren

---

## 🚀 Publishing Schritte

### Schritt 1: Icon & Metadata
```bash
# 1. Icon erstellen und speichern
cp your-icon.png resources/icon.png

# 2. package.json anpassen
# - publisher
# - author
# - repository URLs
```

### Schritt 2: Package erstellen
```bash
cd al-ai-test-generator-v2
npm install
npm run compile
vsce package
```

Dies erstellt: `al-ai-test-generator-2.0.0.vsix`

### Schritt 3: Lokal testen
```bash
code --install-extension al-ai-test-generator-2.0.0.vsix
```

**Test-Szenarien:**
- [ ] API-Key setzen funktioniert
- [ ] Test-Generierung funktioniert
- [ ] TextConst Labels werden generiert (DEU + ENU)
- [ ] Mutation Testing funktioniert
- [ ] Commands im Kontextmenü sichtbar

### Schritt 4: Marketplace Publishing
```bash
# Option A: CLI (empfohlen)
vsce login <publisher-name>
vsce publish

# Option B: Web Interface
# https://marketplace.visualstudio.com/manage
# → Upload .vsix Datei
```

### Schritt 5: Nach Publishing
- [ ] Extension im Marketplace prüfen
- [ ] Installation testen
- [ ] Reviews monitoring aktivieren
- [ ] GitHub Repository veröffentlichen

---

## 📦 Dateien im Package

### Included:
- [x] src/ (TypeScript Source)
- [x] out/ (Compiled JavaScript)
- [x] resources/ (Icon, Screenshots)
- [x] .vscode/ (Launch, Tasks)
- [x] .github/workflows/ (CI/CD)
- [x] .AL-Go/ (AL-Go Settings)
- [x] package.json
- [x] README.md
- [x] LICENSE
- [x] CHANGELOG.md
- [x] PUBLISHING_GUIDE.md
- [x] INTEGRATION_GUIDE.md
- [x] MICROSOFT_BC_TEST_STANDARDS.md
- [x] MUTATION_TESTING_GUIDE.md

### Excluded (.vscodeignore):
- [x] node_modules/
- [x] .git/
- [x] test/
- [x] *.ts (außer in src/)
- [x] tsconfig.json
- [x] .gitignore

---

## 🎯 Qualitätssicherung

### Funktionale Tests
- [ ] API-Key Management
- [ ] Test-Generierung für Table
- [ ] Test-Generierung für Page
- [ ] Test-Generierung für Codeunit
- [ ] TextConst Labels in generierten Tests
- [ ] Mutation Testing Execution
- [ ] HTML Report Generation

### Integration Tests
- [ ] Neues AL-Projekt
- [ ] Bestehendes AL-Projekt
- [ ] Verschiedene Projekt-Strukturen
- [ ] CI/CD Pipeline (optional)

### Dokumentations-Tests
- [ ] README.md vollständig
- [ ] Integration Guide verständlich
- [ ] Publishing Guide vollständig
- [ ] Alle Links funktionieren

---

## 📊 Erwartete Metriken

### Nach 1 Woche:
- Downloads: 50-100
- Rating: 4.5+
- Reviews: 3-5

### Nach 1 Monat:
- Downloads: 500-1000
- Rating: 4.5+
- Issues: <5 open

### Nach 3 Monaten:
- Downloads: 2000+
- Community Beiträge
- Feature Requests
- Erfolgsgeschichten

---

## 🎉 Ready to Publish?

### Final Checklist:
- [ ] Icon erstellt und getestet
- [ ] package.json vollständig
- [ ] README.md finalisiert
- [ ] LICENSE vorhanden
- [ ] Alle Dokumentationen vollständig
- [ ] npm install erfolgreich
- [ ] npm run compile erfolgreich
- [ ] vsce package erfolgreich
- [ ] Lokal getestet
- [ ] PAT erstellt
- [ ] Publisher Account erstellt

**Wenn alle Checkboxen ✅ sind → Publish!**

```bash
vsce publish
```

---

## 📞 Support nach Publishing

### Monitoring:
- GitHub Issues täglich prüfen
- Marketplace Reviews wöchentlich checken
- Download-Statistiken verfolgen
- User Feedback sammeln

### Wartung:
- Bugfixes zeitnah bereitstellen
- Feature Requests evaluieren
- Dokumentation aktuell halten
- Community einbinden

---

**Viel Erfolg beim Publishing! 🚀**
