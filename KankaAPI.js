const entityCache = {}; // cache in memoria per questa esecuzione

function fetchAllEntities(type) {
  const token = getApiToken();
  const campaignId = getCampaignId();
  const baseUrl = `https://api.kanka.io/1.0/campaigns/${campaignId}/${type}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };

  let results = [];
  let nextUrl = baseUrl;

  while (nextUrl) {
    const response = UrlFetchApp.fetch(nextUrl, { method: 'get', headers });
    const json = JSON.parse(response.getContentText());
    results.push(...json.data);
    nextUrl = json.links && json.links.next ? json.links.next : null;
  }

  rememberEntityNames(type, results);

  return results;
}

function fetchCharacters() {
  const token = getApiToken();
  const campaignId = getCampaignId();
  const baseUrl = `https://api.kanka.io/1.0/campaigns/${campaignId}/characters`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };

  let characters = [];
  let nextUrl = baseUrl;

  while (nextUrl) {
    const response = UrlFetchApp.fetch(nextUrl, { method: 'get', headers });
    const json = JSON.parse(response.getContentText());
    characters.push(...json.data);
    nextUrl = json.links && json.links.next ? json.links.next : null;
  }

  Logger.log(`Totale personaggi trovati: ${characters.length}`);
  return characters;
}

function fetchEntity(type, id) {
  const cacheKey = `${type}:${id}`;
  if (Object.prototype.hasOwnProperty.call(entityCache, cacheKey)) {
    return entityCache[cacheKey];
  }

  const token = getApiToken();
  const campaignId = getCampaignId();
  const baseUrl = `https://api.kanka.io/1.0/campaigns/${campaignId}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  const urls = [
    `${baseUrl}/${type}/${id}`,
    `${baseUrl}/entities/${id}`
  ];

  const MAX_RETRIES = 3;

  for (const url of urls) {
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
      try {
        const res = UrlFetchApp.fetch(url, { method: 'get', headers, muteHttpExceptions: true });
        const code = res.getResponseCode();

        if (code === 200) {
          const data = JSON.parse(res.getContentText()).data;
          entityCache[cacheKey] = data;
          return data;
        }

        if (code === 429 || (code >= 500 && code < 600)) {
          Utilities.sleep(250 * Math.pow(2, attempt));
          attempt++;
          continue;
        }

        break;
      } catch (e) {
        Utilities.sleep(250 * Math.pow(2, attempt));
        attempt++;
      }
    }
  }

  entityCache[cacheKey] = null;
  return null;
}


function fetchEntityName(type, id) {
  const entity = fetchEntity(type, id);
  return entity && entity.name ? entity.name : `[${type}:${id}]`;
}

function fetchEntityData(entityId) {
  const token = getApiToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };

  const url = `https://api.kanka.io/1.0/entities/${entityId}`;
  Logger.log(`→ FETCH entityData: ${url}`);
  Utilities.sleep(1000); // prevenzione rate limit

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers,
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    if (code === 200) {
      const json = JSON.parse(response.getContentText());
      const data = json.data;
      if (data && data.id && data.name) {
        storeEntityName(data.type || 'entities', data.id, data.name);
      }
      return data;
    } else {
      Logger.log(`❌ Errore ${code} su fetchEntityData(${entityId}): ${response.getContentText()}`);
    }
  } catch (e) {
    Logger.log(`❌ Eccezione fetchEntityData(${entityId}): ${e}`);
  }

  return null;
}