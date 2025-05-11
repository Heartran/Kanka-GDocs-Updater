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
logToSidebar(`Totale personaggi trovati: ${characters.length}`);
  return characters;
}

function fetchEntity(type, id) {
  const cacheKey = `${type}:${id}`;
  if (entityCache.hasOwnProperty(cacheKey)) return entityCache[cacheKey];

  const token = getApiToken();
  const campaignId = getCampaignId();
  const baseUrl = `https://api.kanka.io/1.0/campaigns/${campaignId}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };

  const tryUrls = [
    `${baseUrl}/${type}/${id}`,
    `${baseUrl}/entities/${id}`  // fallback generico
  ];

  for (const url of tryUrls) {
    Logger.log(`→ CHIAMATA: ${url}`);
logToSidebar(`→ CHIAMATA: ${url}`);
    Utilities.sleep(1000);

    try {
      const response = UrlFetchApp.fetch(url, {
        method: 'get',
        headers,
        muteHttpExceptions: true
      });

      const code = response.getResponseCode();
      if (code === 200) {
        const data = JSON.parse(response.getContentText()).data;
        entityCache[cacheKey] = data;
        return data;
      } else {
        Logger.log(`→ ERRORE ${code} su ${url}`);
logToSidebar(`→ ERRORE ${code} su ${url}`);
      }
    } catch (e) {
      Logger.log(`→ Eccezione su ${url}: ${e}`);
logToSidebar(`→ Eccezione su ${url}: ${e}`);
    }
  }

  entityCache[cacheKey] = null;
  return null;
}


function fetchEntityName(type, id) {
  const entity = fetchEntity(type, id);
  return entity && entity.name ? entity.name : `[${type}:${id}]`;
}