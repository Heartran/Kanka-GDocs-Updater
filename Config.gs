const MASTER_DOCUMENT_KEY = 'GOOGLE_DOC_ID';

function getApiToken() {
  return PropertiesService.getScriptProperties().getProperty('KANKA_API_TOKEN');
}

// Recupera il valore della proprietà dallo script
function getCampaignId() {
  return PropertiesService.getScriptProperties().getProperty('CAMPAIGN_ID');
}

function getKankaApiToken() {
  return PropertiesService.getScriptProperties().getProperty('KANKA_API_TOKEN');
}

function getMasterDocumentId() {
  return PropertiesService.getScriptProperties().getProperty('GOOGLE_DOC_ID');
}

// Controlla che tutte le proprietà siano settate, altrimenti lancia errore
function checkRequiredConfig() {
  const missing = [];

  if (!getKankaApiToken()) missing.push('KANKA_API_TOKEN');
  if (!getCampaignId()) missing.push('CAMPAIGN_ID');
  if (!getMasterDocumentId()) missing.push('GOOGLE_DOC_ID');

  if (missing.length > 0) {
    throw new Error('❌ Variabili mancanti: ' + missing.join(', '));
  }
}


function getDocumentIdForType(type) {
  const key = ENTITY_DOCUMENT_KEYS[type];
  if (!key) {
    Logger.log(`❌ Tipo non supportato per document ID: ${type}`);
logToSidebar(`❌ Tipo non supportato per document ID: ${type}`);
    return null;
  }
  return PropertiesService.getScriptProperties().getProperty(key);
}
