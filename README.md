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

## 🚀 Utilizzo

1. Apri lo script in Google Apps Script
2. Configura le variabili d'ambiente necessarie
3. Esegui la funzione `syncAllEntitiesToOneDocument()`

Il documento verrà aggiornato automaticamente con tutte le entità della tua campagna, organizzate per tipo.

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