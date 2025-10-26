function renderEntityByType(type, entity, doc) {
  if (type === 'calendars') {
    const full = fetchEntity(type, entity.id);
    if (full?.months && full?.weekdays) {
      formatCalendarData(doc, full);
      return;
    }
  }

  if (type === 'timelines') {
    const full = fetchEntity(type, entity.id);
    if (full?.eras?.length > 0) {
      formatTimelineData(doc, full);
      return;
    }
  }

  if (type === 'characters') {
    formatCharacterData(doc, entity); // da charactersParser.gs
    return;
  }

  // fallback generico - più ricco
  const full = fetchEntity(type, entity.id) || entity;
  const name = full.name || '(senza nome)';
  const raw = full.entry || '';
  const parsed = resolveReferences(raw);
  const clean = stripHtml(parsed);

  const body = doc.getBody();
  body.appendParagraph(name).setHeading(DocumentApp.ParagraphHeading.HEADING2);

  // immagine
  addEntityImagePlaceholder(body, type, full);

  // metadati (id, created/updated, owner)
  addMetadata(body, full);

  // Campi principali comuni
  const kv = [];
  if (full.title) kv.push({ key: 'Titolo', value: full.title });
  if (full.type) kv.push({ key: 'Tipo entità', value: full.type });
  if (full.age) kv.push({ key: 'Età', value: full.age });
  if (full.sex) kv.push({ key: 'Sesso', value: full.sex });
  if (full.pronouns) kv.push({ key: 'Pronomi', value: full.pronouns });

  // Riferimenti risolvibili
  if (full.location_id || full.location) {
    const locationName = full.location_name || (full.location_id ? resolveEntityName('locations', full.location_id) : full.location);
    kv.push({ key: 'Posizione', value: locationName });
  }
  if (full.family_id || full.family) {
    const familyName = full.family_name || (full.family_id ? resolveEntityName('families', full.family_id) : full.family);
    kv.push({ key: 'Famiglia', value: familyName });
  }
  if (full.race_id || full.race) {
    const raceName = full.race_name || (full.race_id ? resolveEntityName('races', full.race_id) : full.race);
    kv.push({ key: 'Razza', value: raceName });
  }

  if (kv.length > 0) {
    addSectionTitle(body, "🔎 Informazioni principali", 3);
    addKeyValueList(body, kv);
  }

  // Tags
  if (Array.isArray(full.tags) && full.tags.length > 0) {
    addSectionTitle(body, "🏷️ Tags", 3);
    full.tags.forEach(t => {
      const name = (t && (t.name || t)) ? (t.name || t) : String(t);
      body.appendParagraph(`• ${name}`);
    });
  } else if (full.tag_list) {
    addSectionTitle(body, "🏷️ Tags", 3);
    body.appendParagraph(full.tag_list);
  }

  // entry pulito
  if (clean) {
    addSectionTitle(body, "📝 Descrizione", 3);
    body.appendParagraph(clean);
  }

  // Attributi personalizzati se presenti come array
  if (Array.isArray(full.attributes) && full.attributes.length > 0) {
    addSectionTitle(body, "🧩 Attributi personalizzati", 3);
    full.attributes.forEach(a => {
      body.appendParagraph(`• ${a.name}: ${a.value}`);
    });
  }

  // Lista generale di proprietà utili (fallback)
  const extras = [];
  ['size', 'moral', 'status', 'age', 'height', 'weight', 'history', 'appearance'].forEach(k => {
    if (full[k]) extras.push({ key: capitalize(k), value: stripHtml(resolveReferences(String(full[k] || ''))) });
  });
  if (extras.length > 0) {
    addSectionTitle(body, "🔧 Altri dettagli", 3);
    addKeyValueList(body, extras);
  }

  body.appendParagraph('');
}
