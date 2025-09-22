const MASTER_DOCUMENT_KEY = 'GOOGLE_DOC_ID';
const DEFAULT_IMAGE_DISPLAY_WIDTH_INCHES = 3;
const POINTS_PER_INCH = 72;
const TINYPNG_API_KEY_KEY = 'TINYPNG_API_KEY';
const TINYPNG_MAX_DIMENSION_KEY = 'TINYPNG_MAX_DIMENSION';
const DEFAULT_TINYPNG_MAX_DIMENSION = 1024;
const MAX_TINYPNG_DIMENSION = 4096;

function getApiToken() {
  return PropertiesService.getScriptProperties().getProperty('KANKA_API_TOKEN');
}

function getCampaignId() {
  return PropertiesService.getScriptProperties().getProperty('CAMPAIGN_ID');
}

function getMasterDocumentId() {
  return PropertiesService.getScriptProperties().getProperty(MASTER_DOCUMENT_KEY);
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

function getTinyPngApiKey() {
  const key = PropertiesService.getScriptProperties().getProperty(TINYPNG_API_KEY_KEY);
  if (!key) {
    return null;
  }
  const normalized = key.trim();
  return normalized ? normalized : null;
}

function getTinyPngMaxDimension() {
  const configured = PropertiesService.getScriptProperties().getProperty(TINYPNG_MAX_DIMENSION_KEY);
  if (!configured) {
    return DEFAULT_TINYPNG_MAX_DIMENSION;
  }

  const parsed = parseInt(configured, 10);
  if (isNaN(parsed) || parsed <= 0) {
    Logger.log(`⚠️ Valore non valido per ${TINYPNG_MAX_DIMENSION_KEY}: "${configured}". Uso il default ${DEFAULT_TINYPNG_MAX_DIMENSION}.`);
    return DEFAULT_TINYPNG_MAX_DIMENSION;
  }

  if (parsed > MAX_TINYPNG_DIMENSION) {
    Logger.log(`ℹ️ Limito ${TINYPNG_MAX_DIMENSION_KEY} a ${MAX_TINYPNG_DIMENSION} px.`);
  }

  return Math.min(parsed, MAX_TINYPNG_DIMENSION);
}
