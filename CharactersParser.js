function formatCharacterData(doc, entity) {
  const body = doc.getBody();
  addSectionTitle(body, entity.name || '(senza nome)', 2);
  addEntityImagePlaceholder(body, 'characters', entity);

  // Metadati
  addMetadata(body, entity);

  // Informazioni principali
  const main = [];
  if (entity.title) main.push({ key: 'Titolo', value: entity.title });
  if (entity.type) main.push({ key: 'Tipo', value: entity.type });
  if (entity.age) main.push({ key: 'Età', value: entity.age });
  if (entity.sex) main.push({ key: 'Sesso', value: entity.sex });
  if (entity.pronouns) main.push({ key: 'Pronomi', value: entity.pronouns });
  if (entity.race_name) main.push({ key: 'Razza', value: entity.race_name });
  else if (entity.race_id) main.push({ key: 'Razza', value: resolveEntityName('races', entity.race_id) });

  if (entity.family_name) main.push({ key: 'Famiglia', value: entity.family_name });
  else if (entity.family_id) main.push({ key: 'Famiglia', value: resolveEntityName('families', entity.family_id) });

  if (entity.location_name) main.push({ key: 'Posizione', value: entity.location_name });
  else if (entity.location_id) main.push({ key: 'Posizione', value: resolveEntityName('locations', entity.location_id) });

  if (main.length > 0) {
    addSectionTitle(body, "🔎 Informazioni principali", 3);
    addKeyValueList(body, main);
  }

  // Descrizione
  const raw = entity.entry || '';
  const parsed = resolveReferences(raw);
  const clean = stripHtml(parsed);
  if (clean) {
    addSectionTitle(body, "📝 Biografia / Note", 3);
    body.appendParagraph(clean);
  }

  // Attributi personalizzati (se presenti)
  if (entity.attributes && entity.attributes.length > 0) {
    addSectionTitle(body, "🧬 Attributi", 3);
    entity.attributes.forEach(attr => {
      body.appendParagraph(`• ${attr.name}: ${attr.value}`);
    });
  }

  // Tratti / Tag della personalità
  if (Array.isArray(entity.traits) && entity.traits.length > 0) {
    addSectionTitle(body, "✨ Tratti", 3);
    entity.traits.forEach(t => body.appendParagraph(`• ${t}`));
  } else if (Array.isArray(entity.tags) && entity.tags.length > 0) {
    addSectionTitle(body, "🏷️ Tags", 3);
    entity.tags.forEach(t => body.appendParagraph(`• ${t.name || t}`));
  }

  // Relazioni
  if (entity.relations && entity.relations.length > 0) {
    addSectionTitle(body, "🤝 Relazioni", 3);
    entity.relations.forEach(rel => {
      const target = rel.target_name || (rel.target_id ? resolveEntityName('characters', rel.target_id) : '[sconosciuto]');
      const role = rel.role || rel.type || 'Relazione';
      body.appendParagraph(`• ${role} con ${target}`);
    });
  }

  // Inventario
  if (entity.inventory && entity.inventory.length > 0) {
    addSectionTitle(body, "🎒 Inventario", 3);
    entity.inventory.forEach(item => {
      const line = `• ${item.name || item.entity?.name || item.entity_name || 'Oggetto'}${item.amount ? ` (${item.amount})` : ''}${item.notes ? ` — ${stripHtml(item.notes)}` : ''}`;
      body.appendParagraph(line);
    });
  }

  // Personalizzazioni libere (appearance, history, notes...)
  const extras = [];
  if (entity.appearance) extras.push({ key: 'Aspetto', value: stripHtml(resolveReferences(entity.appearance)) });
  if (entity.history) extras.push({ key: 'Storia', value: stripHtml(resolveReferences(entity.history)) });
  if (entity.private_notes) extras.push({ key: 'Note private', value: stripHtml(resolveReferences(entity.private_notes)) });

  if (extras.length > 0) {
    addSectionTitle(body, "🔧 Altri dettagli", 3);
    addKeyValueList(body, extras);
  }

  body.appendParagraph('');
}