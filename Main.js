const SUPPORTED_ENTITY_TYPES = [
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

const REFERENCE_ENTITY_TYPES = [
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
  'timelines',
  'tags'
];

const SYNC_STATE_KEY = 'KANKA_SYNC_STATE';
const SUMMARY_PLACEHOLDER = '[[KANKA_SYNC_SUMMARY]]';
const MIN_REMAINING_SECONDS = 60;

function syncAllEntitiesToOneDocument() {
  runFullSync();
}

function continueSyncAllEntities() {
  runFullSync();
}

function runFullSync() {
  checkRequiredConfig();

  const docId = getMasterDocumentId();
  if (!docId) {
    Logger.log('[ERRORE] Documento principale non configurato.');
    return;
  }

  const doc = DocumentApp.openById(docId);
  const body = doc.getBody();

  let state = loadSyncState(docId);
  if (!state.docInitialized) {
    initializeSyncDocument(body);
    state.docInitialized = true;
    saveSyncState(state);
  }

  preloadReferenceCaches();

  const completed = processEntityTypes(doc, state);
  saveSyncState(state);

  if (completed) {
    finalizeSync(doc, state);
    clearSyncState();
    cleanupContinuationTriggers();
    Logger.log(`[OK] Documento aggiornato: https://docs.google.com/document/d/${docId}/edit`);
    return;
  }

  scheduleContinuation();
}

function processEntityTypes(doc, state) {
  const body = doc.getBody();

  while (state.typeIndex < SUPPORTED_ENTITY_TYPES.length) {
    if (shouldYield()) {
      return false;
    }

    const currentType = SUPPORTED_ENTITY_TYPES[state.typeIndex];
    const entities = fetchAllEntities(currentType);
    rememberEntityNames(currentType, entities);

    if (!(currentType in state.counts)) {
      state.counts[currentType] = entities.length;
      saveSyncState(state);
    }

    if (!state.typeHeaderInserted) {
      appendTypeHeading(body, currentType);
      state.typeHeaderInserted = true;
      saveSyncState(state);
    }

    for (let index = state.entityIndex; index < entities.length; index++) {
      renderEntityByType(currentType, entities[index], doc);
      state.entityIndex = index + 1;

      if (shouldYield()) {
        return false;
      }
    }

    body.appendParagraph('');
    state.typeIndex += 1;
    state.entityIndex = 0;
    state.typeHeaderInserted = false;
    saveSyncState(state);
  }

  return true;
}

function appendTypeHeading(body, type) {
  body.appendParagraph(capitalize(type))
      .setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('');
}

function preloadReferenceCaches() {
  preloadEntityMaps(REFERENCE_ENTITY_TYPES);
}

function shouldYield() {
  try {
    return Utilities.getRemainingExecutionTime() < MIN_REMAINING_SECONDS;
  } catch (error) {
    Logger.log(`[WARN] Impossibile verificare il tempo rimanente: ${error}`);
    return false;
  }
}

function scheduleContinuation() {
  Logger.log('[INFO] Tempo quasi esaurito. Pianifico una nuova esecuzione per completare la sincronizzazione.');
  cleanupContinuationTriggers();
  ScriptApp.newTrigger('continueSyncAllEntities')
    .timeBased()
    .after(1 * 60 * 1000)
    .create();
}

function cleanupContinuationTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction && trigger.getHandlerFunction() === 'continueSyncAllEntities') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function loadSyncState(docId) {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty(SYNC_STATE_KEY);

  if (!raw) {
    return createInitialState(docId);
  }

  try {
    const state = JSON.parse(raw);
    if (state.docId !== docId) {
      return createInitialState(docId);
    }
    state.counts = state.counts || {};
    return state;
  } catch (error) {
    Logger.log(`[WARN] Stato di sincronizzazione non valido. Riparto da zero: ${error}`);
    return createInitialState(docId);
  }
}

function saveSyncState(state) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(SYNC_STATE_KEY, JSON.stringify(state));
}

function clearSyncState() {
  PropertiesService.getScriptProperties().deleteProperty(SYNC_STATE_KEY);
}

function createInitialState(docId) {
  return {
    docId,
    docInitialized: false,
    typeIndex: 0,
    entityIndex: 0,
    typeHeaderInserted: false,
    counts: {}
  };
}

function initializeSyncDocument(body) {
  body.clear();
  const firstChild = body.getChild(0);
  if (firstChild && firstChild.getType() === DocumentApp.ElementType.PARAGRAPH) {
    firstChild.asParagraph().clear();
  }

  body.appendParagraph('Enciclopedia Kanka')
      .setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(`Aggiornato il: ${new Date().toLocaleString()}`);
  body.appendParagraph('');
  body.appendParagraph(SUMMARY_PLACEHOLDER);
  body.appendParagraph('');
}

function finalizeSync(doc, state) {
  injectSummary(doc, state.counts || {});
}

function injectSummary(doc, counts) {
  const body = doc.getBody();
  const summaryRows = SUPPORTED_ENTITY_TYPES.map(type => [
    capitalize(type),
    String(counts[type] || 0)
  ]);

  let placeholderRange = body.findText(SUMMARY_PLACEHOLDER);
  if (!placeholderRange) {
    placeholderRange = body.appendParagraph(SUMMARY_PLACEHOLDER).editAsText();
  }

  const placeholderElement = placeholderRange.getElement().asParagraph();
  const insertionIndex = body.getChildIndex(placeholderElement);
  placeholderElement.removeFromParent();

  const heading = body.insertParagraph(insertionIndex, 'Sommario');
  heading.setHeading(DocumentApp.ParagraphHeading.HEADING2);

  const table = body.insertTable(insertionIndex + 1, [['Tipo', 'Quantita']]);
  summaryRows.forEach(row => {
    const tableRow = table.appendTableRow();
    row.forEach(value => tableRow.appendTableCell(value));
  });

  body.insertParagraph(insertionIndex + 2, '');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
