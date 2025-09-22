# 📘 Kanka Character Updater

Un'applicazione Google Apps Script che sincronizza automaticamente le entità della tua campagna Kanka in un documento Google Docs.

## 🎯 Funzionalità

- Sincronizzazione automatica di tutte le entità della campagna in un unico documento
- Supporto per vari tipi di entità:
  - Personaggi
  - Luoghi
  - Famiglie
  - Organizzazioni
  - Razze
  - Creature
  - Oggetti
  - Eventi
  - Diari
  - Missioni
  - Abilità
  - Calendari
  - Timeline

## ⚙️ Configurazione

Per utilizzare l'applicazione, è necessario configurare le seguenti variabili d'ambiente in Google Apps Script:

1. `KANKA_API_TOKEN`: Il tuo token API di Kanka
2. `CAMPAIGN_ID`: L'ID della tua campagna Kanka
3. `GOOGLE_DOC_ID`: L'ID del documento Google Docs dove verranno sincronizzate le entità
4. `KANKA_IMAGE_THUMB_SIZE` *(opzionale)*: dimensione preferita per le miniature (es. `800x800`). Se non impostato o non valido verrà usato il valore predefinito `800x800`.

## 🚀 Utilizzo

1. Apri lo script in Google Apps Script
2. Configura le variabili d'ambiente necessarie
3. Esegui la funzione `syncAllEntitiesToOneDocument()`
4. (Opzionale) Per popolare le immagini, avvia la funzione `syncEntityImages()` dopo che il documento è stato aggiornato

Il documento verrà aggiornato automaticamente con tutte le entità della tua campagna, organizzate per tipo. I segnaposto delle immagini (`{{IMAGE:tipo:id}}`) verranno sostituiti dalle immagini reali solo quando esegui la funzione dedicata.

## 📝 Formattazione

Il documento generato include:
- Un'intestazione con la data di aggiornamento
- Sezioni separate per ogni tipo di entità
- Formattazione speciale per i calendari, inclusi:
  - Mesi dell'anno
  - Giorni della settimana
  - Stagioni
  - Lune
  - Eventi ricorrenti

## 🔄 Sincronizzazione

La sincronizzazione:
- Mantiene un cache delle entità per ottimizzare le prestazioni
- Risolve automaticamente i riferimenti tra entità
- Formatta il testo rimuovendo i tag HTML
- Organizza le informazioni in modo chiaro e leggibile

## ⚠️ Note

- Assicurati di avere i permessi necessari sia su Kanka che sul documento Google
- Il token API di Kanka deve avere i permessi di lettura per le entità della campagna
- Il documento Google deve essere accessibile in scrittura dallo script

## 🤖 Deploy automatico con GitHub Actions

Il repository include un workflow (`.github/workflows/deploy.yml`) che spinge automaticamente il codice su Google Apps Script quando effettui un push sul branch `External-script` o avvii manualmente il workflow da GitHub.

1. Crea due secret nel repository:
   - `CLASP_CREDENTIALS`: copia il contenuto del file `~/.clasprc.json` generato da `clasp login --creds`.
   - `SCRIPT_ID`: l'ID dello script Apps Script di destinazione.
2. (Opzionale) Non committare il file `.clasp.json`: il workflow lo genera in automatico se hai impostato il secret `SCRIPT_ID`.
3. Esegui `clasp push -f` in locale almeno una volta per verificare che la configurazione funzioni.
4. Effettua push su `External-script` oppure avvia manualmente il workflow da **Actions → Deploy to Google Apps Script**.

Durante l'esecuzione, il workflow si occupa di:

- Installare Node.js 20 e l'ultima versione di `@google/clasp`.
- Autenticarsi usando i secret che hai configurato.
- Caricare il progetto su Apps Script, creando opzionalmente una versione e una pubblicazione.
