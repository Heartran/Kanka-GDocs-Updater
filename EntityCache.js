const entityMaps = {};
const missingReferenceKeys = new Set();

const referenceTypeAliases = {
  character: 'characters',
  characters: 'characters',
  creature: 'creatures',
  creatures: 'creatures',
  location: 'locations',
  locations: 'locations',
  family: 'families',
  families: 'families',
  organisation: 'organisations',
  organisations: 'organisations',
  organization: 'organisations',
  organizations: 'organisations',
  race: 'races',
  races: 'races',
  tag: 'tags',
  tags: 'tags',
  item: 'items',
  items: 'items',
  event: 'events',
  events: 'events',
  journal: 'journals',
  journals: 'journals',
  quest: 'quests',
  quests: 'quests',
  ability: 'abilities',
  abilities: 'abilities',
  calendar: 'calendars',
  calendars: 'calendars',
  timeline: 'timelines',
  timelines: 'timelines',
  note: 'journals',
  notes: 'journals',
  entity: 'entities',
  entities: 'entities'
};

function normalizeReferenceType(type) {
  if (!type) return null;
  const key = String(type).toLowerCase();
  return referenceTypeAliases[key] || key;
}

function ensureEntityMap(type) {
  if (!type) return;
  const normalized = normalizeReferenceType(type);
  if (!normalized) return;
  if (!entityMaps[normalized]) {
    entityMaps[normalized] = new Map();
  }
}

function storeEntityName(type, id, name) {
  const normalized = normalizeReferenceType(type);
  if (!normalized || !id || !name) return;
  ensureEntityMap(normalized);
  entityMaps[normalized].set(String(id), String(name));
}

function rememberEntityNames(type, entities) {
  if (!Array.isArray(entities)) return;
  const normalized = normalizeReferenceType(type);
  if (!normalized) return;
  ensureEntityMap(normalized);
  entities.forEach(entity => {
    if (entity && entity.id && entity.name) {
      storeEntityName(normalized, entity.id, entity.name);
    }
  });
}

function preloadEntityMaps(types) {
  const input = Array.isArray(types) && types.length ? types : Object.keys(entityMaps);
  const normalizedTypes = Array.from(
    new Set(
      input
        .map(normalizeReferenceType)
        .filter(Boolean)
    )
  );

  const dataByType = {};
  normalizedTypes.forEach(type => {
    ensureEntityMap(type);
    const entities = fetchAllEntities(type);
    dataByType[type] = entities;
    rememberEntityNames(type, entities);
    const count = entityMaps[type] ? entityMaps[type].size : 0;
    Logger.log(`Precaricati ${count} elementi da ${type}`);
  });

  return dataByType;
}

function resolveEntityName(type, id) {
  if (!id) return '';

  const normalized = normalizeReferenceType(type);
  const key = String(id);
  const map = normalized ? entityMaps[normalized] : undefined;

  if (map && map.has(key)) {
    return map.get(key);
  }

  const lookupType = normalized || type;
  const name = fetchEntityName(lookupType, id);
  if (name && !/^\[.+:\d+\]$/.test(name)) {
    return name;
  }

  return `[${type}:${id}]`;
}
