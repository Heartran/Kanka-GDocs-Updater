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
  body.clear(); // pulizia completa

  // Google Docs lascia sempre almeno un paragrafo vuoto dopo clear()
  // quindi NON proviamo a rimuoverlo, lo svuotiamo semplicemente
  const first = body.getChild(0);
  if (
    first &&
    first.getType() === DocumentApp.ElementType.PARAGRAPH
  ) {
    first.asParagraph().clear();
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
  renderEntityByType(type, entity, doc);
});

  });

  Logger.log(`✅ Documento aggiornato: https://docs.google.com/document/d/${docId}/edit`);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}