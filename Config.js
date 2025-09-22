const MASTER_DOCUMENT_KEY = 'GOOGLE_DOC_ID';
const DEFAULT_IMAGE_DISPLAY_WIDTH_INCHES = 3;
const POINTS_PER_INCH = 72;
const IMAGE_THUMB_SIZE_KEY = 'KANKA_IMAGE_THUMB_SIZE';
const DEFAULT_IMAGE_THUMB_SIZE = '800x800';

function getApiToken() {
  return PropertiesService.getScriptProperties().getProperty('KANKA_API_TOKEN');
}

function getCampaignId() {
  return PropertiesService.getScriptProperties().getProperty('CAMPAIGN_ID');
}

function getMasterDocumentId() {
  return PropertiesService.getScriptProperties().getProperty(MASTER_DOCUMENT_KEY);
}

function getPreferredImageThumbSize() {
  const configured = PropertiesService.getScriptProperties().getProperty(IMAGE_THUMB_SIZE_KEY);
  if (!configured) {
    return DEFAULT_IMAGE_THUMB_SIZE;
  }

  const normalized = configured.trim();
  const sizePattern = /^\d+x\d+$/;
  if (!sizePattern.test(normalized)) {
    Logger.log(`⚠️ Valore non valido per ${IMAGE_THUMB_SIZE_KEY}: "${configured}". Uso il default ${DEFAULT_IMAGE_THUMB_SIZE}.`);
    return DEFAULT_IMAGE_THUMB_SIZE;
  }

  return normalized;
}

function checkRequiredConfig() {
  const token = getApiToken();
  const campaignId = getCampaignId();
  const docId = getMasterDocumentId(); // <-- usa questa ora

  const missing = [];

  if (!token) missing.push('KANKA_API_TOKEN');
  if (!campaignId) missing.push('CAMPAIGN_ID');
  if (!docId) missing.push('GOOGLE_DOC_ID');

  Logger.log('Configurazione:');
  Logger.log(' - Token API: %s', token ? 'OK' : 'MANCANTE');
  Logger.log(' - ID Campagna: %s', campaignId ? 'OK' : 'MANCANTE');
  Logger.log(' - ID Google Doc: %s', docId ? 'OK' : 'MANCANTE');

  if (missing.length > 0) {
    throw new Error('Variabili mancanti: ' + missing.join(', '));
  }
}

function getDocumentIdForType(type) {
  const key = ENTITY_DOCUMENT_KEYS[type];
  if (!key) {
    Logger.log(`❌ Tipo non supportato per document ID: ${type}`);
    return null;
  }
  return PropertiesService.getScriptProperties().getProperty(key);
}
