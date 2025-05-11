function syncAllEntitiesToOneDocument() {
  checkRequiredConfig();
  preloadEntityMaps();

  const supportedTypes = [
    'characters',
    'locations',
    'families',
    'organisations',
    'races',
    'creatures',
    'items',
    'events',
    'journals',
    'quests',
    'abilities',
    'calendars',
    'timelines'
  ];

  const docId = getMasterDocumentId();
  if (!docId) {
    Logger.log('❌ Documento principale non configurato.');
    return;
  }

const doc = DocumentApp.openById(docId);
const body = doc.getBody();
body.clear();

// Rimuove eventuale paragrafo vuoto residuo
const first = body.getChild(0);
if (first && first.getType() === DocumentApp.ElementType.PARAGRAPH && first.asParagraph().getText().trim() === '') {
  body.removeChild(first);
}

  body.appendParagraph('📘 Enciclopedia Kanka')
      .setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(`Aggiornato il: ${new Date().toLocaleString()}`);
  body.appendParagraph('');

  supportedTypes.forEach(type => {
    const entities = fetchAllEntities(type);
    Logger.log(`🗂 ${type}: trovati ${entities.length} elementi`);

    body.appendParagraph('📁 ' + capitalize(type))
        .setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph('');

    entities.forEach(entity => {
      const name = entity.name || '(senza nome)';
      const raw = entity.entry || '';
      const parsed = resolveReferences(raw);
      const clean = stripHtml(parsed);

      body.appendParagraph(name).setHeading(DocumentApp.ParagraphHeading.HEADING2);
      body.appendParagraph(clean);
      body.appendParagraph('');
    });
  });

  Logger.log(`✅ Documento aggiornato: https://docs.google.com/document/d/${docId}/edit`);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function onOpen() {
  DocumentApp.getUi()
    .createMenu('🔄 Kanka Sync')
    .addItem('Avvia sincronizzazione', 'syncAllEntitiesToOneDocument')
    .addToUi();
    .addItem('Visualizza log', 'appendLogsToDocument')
}
