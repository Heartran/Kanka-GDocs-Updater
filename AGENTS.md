# Guida per Sviluppatori Kanka Character Updater

## 📁 Struttura del Progetto

Il progetto è organizzato nei seguenti file principali:

- `Main.js`: Punto di ingresso principale con la logica di sincronizzazione
- `KankaAPI.js`: Gestisce le chiamate all'API di Kanka
- `EntityCache.js`: Gestisce la cache delle entità per ottimizzare le prestazioni
- `EntityRenderer.js`: Si occupa del rendering delle entità nel documento
- `Formatter.js`: Contiene le funzioni di formattazione del testo
- `ImageSync.js`: Gestisce la sincronizzazione delle immagini
- `CharactersParser.js`: Gestisce il parsing specifico dei personaggi
- `Config.js`: Configurazione e utility varie

## 🛠 Ambiente di Sviluppo

### Prerequisiti

1. Node.js (versione 16 o superiore)
2. Un account Google con accesso a Google Apps Script
3. Un account Kanka con API token
4. Clasp (Google Apps Script CLI)

### Configurazione Iniziale

1. Clona il repository
2. Installa le dipendenze:
   ```bash
   npm install -g @google/clasp
   ```
3. Esegui il login con clasp:
   ```bash
   clasp login
   ```
4. Crea un nuovo progetto Google Apps Script e collegalo al repository:
   ```bash
   clasp create --title "Kanka Character Updater Local" --type sheets
   ```
5. Configura le variabili d'ambiente nel file `.env`:
   ```
   KANKA_API_TOKEN=il_tuo_token_api
   CAMPAIGN_ID=il_tuo_campaign_id
   GOOGLE_DOC_ID=il_tuo_document_id
   ```

## 🧪 Testare le Modifiche

### Test Locali

1. **Test di Unità**:
   - Crea file di test nella cartella `tests/`
   - Usa `jest` per eseguire i test
   - Esempio: `npm test`

2. **Test di Integrazione**:
   - Crea un documento Google di test
   - Aggiorna le credenziali nel file `.clasp.json`
   - Esegui lo script localmente:
     ```bash
     clasp push
     clasp run syncAllEntitiesToOneDocument
     ```

### Test in Produzione

1. **Deploy su Google Apps Script**:
   ```bash
   clasp push
   clasp deploy
   ```

2. **Verifica nel Pannello di Controllo**:
   - Vai su [Google Apps Script](https://script.google.com)
   - Apri il progetto
   - Vai su "Eseguzioni" per monitorare i log

## 🔄 Workflow di Sviluppo

1. Crea un nuovo branch per la tua funzionalità:
   ```bash
   git checkout -b feature/nuova-funzionalità
   ```

2. Fai commit delle tue modifiche:
   ```bash
   git add .
   git commit -m "Aggiunta nuova funzionalità"
   ```

3. Pusha le modifiche e crea una Pull Request

4. Dopo l'approvazione, unisci le modifiche al branch principale

## 🐛 Debug

### Logging

- Usa `Logger.log()` per il logging standard
- I log sono disponibili in:
  - Google Apps Script → Esecuzioni
  - O nel terminale se esegui localmente con `clasp logs`

### Errori Comuni

1. **Permessi mancanti**:
   - Assicurati che il token API abbia i permessi necessari
   - Verifica che lo script abbia accesso al documento

2. **Rate limiting**:
   - L'API Kanka ha dei limiti di richieste
   - Gestisci gli errori 429 con un backoff esponenziale

## 📚 Documentazione Aggiuntiva

- [Documentazione API Kanka](https://kanka.io/it-IT/1.0)
- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [CLASP Documentation](https://github.com/google/clasp)

## 🤝 Contributi

1. Apri una issue per discutere le modifiche
2. Crea un nuovo branch per la tua funzionalità
3. Inserisci test per il tuo codice
4. Assicurati che tutti i test passino
5. Crea una Pull Request

## 📝 Note per i Mantainer

- Mantieni aggiornate le dipendenze
- Documenta eventuali cambiamenti importanti
- Esegui test completi prima di ogni release
- Aggiorna la versione nel file `appsscript.json`
