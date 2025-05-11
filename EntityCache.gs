const entityMaps = {
  characters: new Map(),
  locations: new Map(),
  organisations: new Map(),
  families: new Map(),
  races: new Map(),
  tags: new Map()
};

function preloadEntityMaps() {
  const types = Object.keys(entityMaps);
  types.forEach(type => {
    const entities = fetchAllEntities(type); // Paginato
    const map = new Map(entities.map(e => [String(e.id), e.name]));
    entityMaps[type] = map;
    Logger.log(`Precaricati ${map.size} elementi da ${type}`);
  });
}

function resolveEntityName(type, id) {
  const map = entityMaps[type];
  if (map && map.has(String(id))) {
    return map.get(String(id));
  } else {
    Logger.log(`Reference non risolta: ${type}:${id}`);
    return `[${type}:${id}]`;
  }
}