const ENTITY_DOCUMENT_KEYS = {
  characters: 'GOOGLE_DOC_CHARACTERS_ID',
  locations: 'GOOGLE_DOC_LOCATIONS_ID',
  families: 'GOOGLE_DOC_FAMILIES_ID',
  races: 'GOOGLE_DOC_RACES_ID'
  // puoi aggiungere altri tipi qui in futuro
};


function getApiToken() {
  return PropertiesService.getScriptProperties().getProperty('KANKA_API_TOKEN');
}

function getCampaignId() {
  return PropertiesService.getScriptProperties().getProperty('CAMPAIGN_ID');
}

function getGoogleDocId() {
  return PropertiesService.getScriptProperties().getProperty('GOOGLE_DOC_ID');
}

function checkRequiredConfig() {
  const token = getApiToken();
  const campaignId = getCampaignId();
  const docId = getGoogleDocId();
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