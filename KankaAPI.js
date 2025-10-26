const entityCache = {}; // cache in memoria per questa esecuzione
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 secondo

/**
 * Esegue una richiesta HTTP con meccanismo di retry e backoff esponenziale
 * @param {string} url - L'URL a cui effettuare la richiesta
 * @param {Object} options - Le opzioni della richiesta (metodo, headers, ecc.)
 * @param {number} [maxRetries=MAX_RETRIES] - Numero massimo di tentativi
 * @param {number} [retryDelay=INITIAL_RETRY_DELAY] - Ritardo iniziale tra i tentativi in ms
 * @returns {Object} L'oggetto risposta HTTP
 * @throws {Error} Se la richiesta fallisce dopo tutti i tentativi
 */
function fetchWithRetry(url, options, maxRetries = MAX_RETRIES, retryDelay = INITIAL_RETRY_DELAY) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = UrlFetchApp.fetch(url, { ...options, muteHttpExceptions: true });
      const statusCode = response.getResponseCode();
      
      // Se la risposta è un successo (2xx) o un errore client (4xx) che non richiede retry
      if (statusCode < 400 || (statusCode >= 400 && statusCode < 500 && statusCode !== 408 && statusCode !== 429)) {
        return response;
      }
      
      // Se raggiungiamo qui, la richiesta ha avuto un errore che potrebbe essere temporaneo
      lastError = new Error(`HTTP ${statusCode}: ${response.getContentText()}`);
      lastError.statusCode = statusCode;
      
      // Se è un errore di rate limit, attendiamo il tempo specificato nell'header Retry-After
      if (statusCode === 429) {
        const retryAfter = response.getHeaders()['retry-after'] || 60; // default a 60 secondi
        Utilities.sleep(retryAfter * 1000);
        continue;
      }
    } catch (e) {
      lastError = e;
    }
    
    // Calcola il prossimo ritardo con backoff esponenziale
    const delay = retryDelay * Math.pow(2, attempt);
    Logger.log(`Tentativo ${attempt + 1} fallito. Nuovo tentativo tra ${delay}ms`);
    Utilities.sleep(delay);
  }
  
  throw lastError || new Error('Richiesta fallita senza un messaggio di errore specifico');
}

/**
 * Recupera tutte le entità di un determinato tipo dal server Kanka
 * @param {string} type - Il tipo di entità da recuperare (es. 'characters', 'locations', ecc.)
 * @returns {Array} Un array di entità
 * @throws {Error} Se si verifica un errore durante il recupero delle entità
 */
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
  let page = 1;
  let totalItems = 0;

  try {
    while (nextUrl) {
      Logger.log(`Recupero pagina ${page} per ${type}...`);
      const response = fetchWithRetry(nextUrl, { 
        method: 'get', 
        headers 
      });
      
      const json = JSON.parse(response.getContentText());
      
      if (!Array.isArray(json.data)) {
        throw new Error(`Risposta API non valida per ${type}. Dati mancanti o non validi.`);
      }
      
      results.push(...json.data);
      totalItems = json.meta ? json.meta.total : results.length;
      nextUrl = json.links && json.links.next ? json.links.next : null;
      page++;
      
      // Breve pausa tra le richieste per evitare rate limiting
      Utilities.sleep(200);
    }

    Logger.log(`Recuperate ${results.length} di ${totalItems} ${type} in ${page - 1} pagine`);
    rememberEntityNames(type, results);
    
    return results;
  } catch (error) {
    Logger.log(`Errore durante il recupero delle entità di tipo ${type}: ${error.message}`);
    throw new Error(`Impossibile recuperare le entità di tipo ${type}: ${error.message}`);
  }
}

/**
 * Recupera tutti i personaggi dalla campagna Kanka
 * @returns {Array} Un array di personaggi
 * @throws {Error} Se si verifica un errore durante il recupero dei personaggi
 */
function fetchCharacters() {
  try {
    const characters = fetchAllEntities('characters');
    Logger.log(`Totale personaggi trovati: ${characters.length}`);
    return characters;
  } catch (error) {
    Logger.log(`Errore durante il recupero dei personaggi: ${error.message}`);
    throw new Error(`Impossibile recuperare i personaggi: ${error.message}`);
  }
}

/**
 * Recupera un'entità specifica dal server Kanka
 * @param {string} type - Il tipo di entità da recuperare (es. 'characters', 'locations', ecc.)
 * @param {number|string} id - L'ID dell'entità da recuperare
 * @returns {Object|null} L'entità richiesta o null se non trovata
 * @throws {Error} Se si verifica un errore durante il recupero dell'entità
 */
function fetchEntity(type, id) {
  const cacheKey = `${type}:${id}`;
  
  // Controlla se l'entità è già in cache
  if (Object.prototype.hasOwnProperty.call(entityCache, cacheKey)) {
    return entityCache[cacheKey];
  }

  const token = getApiToken();
  const campaignId = getCampaignId();
  const baseUrl = `https://api.kanka.io/1.0/campaigns/${campaignId}`;
  const headers = { 
    'Authorization': `Bearer ${token}`, 
    'Accept': 'application/json' 
  };

  // Prova prima l'endpoint specifico per il tipo, poi l'endpoint generico
  const urls = [
    `${baseUrl}/${type}/${id}`,
    `${baseUrl}/entities/${id}`
  ];

  for (const url of urls) {
    try {
      Logger.log(`Recupero entità da ${url}...`);
      const response = fetchWithRetry(url, { 
        method: 'get', 
        headers 
      });
      
      const json = JSON.parse(response.getContentText());
      
      if (json.data) {
        // Salva in cache e restituisci i dati
        entityCache[cacheKey] = json.data;
        return json.data;
      }
    } catch (error) {
      // Se riceviamo un 404, proviamo con l'URL successivo
      if (error.statusCode === 404) {
        continue;
      }
      
      // Per altri errori, logghiamo e rilanciamo
      Logger.log(`Errore durante il recupero dell'entità ${type}/${id}: ${error.message}`);
      throw new Error(`Impossibile recuperare l'entità ${type}/${id}: ${error.message}`);
    }
  }

  // Se arriviamo qui, l'entità non è stata trovata
  Logger.log(`Entità ${type}/${id} non trovata`);
  entityCache[cacheKey] = null;
  return null;
}


function fetchEntityName(type, id) {
  const entity = fetchEntity(type, id);
  return entity && entity.name ? entity.name : `[${type}:${id}]`;
}

/**
 * Recupera i dati completi di un'entità dal server Kanka
 * @param {number|string} entityId - L'ID dell'entità da recuperare
 * @returns {Object|null} I dati dell'entità o null se non trovata
 * @throws {Error} Se si verifica un errore durante il recupero dei dati
 */
function fetchEntityData(entityId) {
  const token = getApiToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };

  const url = `https://api.kanka.io/1.0/entities/${entityId}`;
  Logger.log(`Recupero dati entità ${entityId} da ${url}...`);
  
  try {
    const response = fetchWithRetry(url, {
      method: 'get',
      headers
    });
    
    const json = JSON.parse(response.getContentText());
    
    if (json.data) {
      const data = json.data;
      
      // Se l'entità ha un tipo e un nome, lo salviamo nella cache dei nomi
      if (data.id && data.name) {
        const entityType = data.type || 'entities';
        storeEntityName(entityType, data.id, data.name);
        Logger.log(`Trovata entità ${entityType}/${data.id}: ${data.name}`);
      }
      
      return data;
    }
    
    Logger.log(`Nessun dato trovato per l'entità ${entityId}`);
    return null;
  } catch (error) {
    Logger.log(`Errore durante il recupero dei dati per l'entità ${entityId}: ${error.message}`);
    
    // Se l'errore è un 404, l'entità non esiste
    if (error.statusCode === 404) {
      Logger.log(`Entità ${entityId} non trovata`);
      return null;
    }
    
    // Per altri errori, rilanciamo l'eccezione
    throw new Error(`Impossibile recuperare i dati per l'entità ${entityId}: ${error.message}`);
  }
}