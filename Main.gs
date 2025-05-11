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

  // Rimuove eventuale primo paragrafo vuoto
  const first = body.getChild(0);
  if (
    body.getNumChildren() > 1 &&
    first &&
    first.getType() === DocumentApp.ElementType.PARAGRAPH &&
    first.asParagraph().getText().trim() === ''
  ) {
    body.removeChild(first);
  }

  // Intestazione
  body.appendParagraph('📘 Enciclopedia Kanka').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(`Aggiornato il: ${new Date().toLocaleString()}`);
  body.appendParagraph('');

  supportedTypes.forEach(type => {
    const entities = fetchAllEntities(type); // funzione API che ritorna lista base
    Logger.log(`🗂 ${type}: trovati ${entities.length} elementi`);
logToSidebar(`🗂 ${type}: trovati ${entities.length} elementi`);

    body.appendParagraph('📁 ' + capitalize(type)).setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph('');

    entities.forEach(entity => {
      const entityData = fetchEntityData(entity.id); // dettagli estesi via API
      if (!entityData || !entityData.name) return;

      if (isCalendarEntity(entityData)) {
        Logger.log("📆 Calendario: " + entityData.name);
logToSidebar("📆 Calendario: " + entityData.name);
        formatCalendarData(doc, entityData);
      } else {
        Logger.log("📄 Entità: " + entityData.name);
logToSidebar("📄 Entità: " + entityData.name);
        formatGenericEntity(doc, entityData);
      }

      body.appendParagraph('');
    });
  });

  Logger.log(`✅ Documento aggiornato: https://docs.google.com/document/d/${docId}/edit`);
logToSidebar(`✅ Documento aggiornato: https://docs.google.com/document/d/${docId}/edit`);
}


function isCalendarEntity(entityData) {
  return Array.isArray(entityData.months) && Array.isArray(entityData.weekdays);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function onOpen() {
  DocumentApp.getUi()
    .createMenu('🔄 Kanka Sync')
    .addItem('Avvia sincronizzazione', 'syncAllEntitiesToOneDocument')
    .addToUi()
    .addItem('Visualizza log', 'appendLogsToDocument');
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Log sincronizzazione')
    .setWidth(300);
  DocumentApp.getUi().showSidebar(html);
}

function getLogBuffer() {
  const props = PropertiesService.getUserProperties();
  return props.getProperty('log_buffer') || '';
}

function clearLogBuffer() {
  PropertiesService.getUserProperties().deleteProperty('log_buffer');
}

function logToSidebar(msg) {
  const props = PropertiesService.getUserProperties();
  const existing = props.getProperty('log_buffer') || '';
  const timestamp = new Date().toLocaleTimeString();
  props.setProperty('log_buffer', existing + `\n[${timestamp}] ${msg}`);
}
