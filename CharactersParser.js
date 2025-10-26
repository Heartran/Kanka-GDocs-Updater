function formatCharacterData(doc, entity) {
  // Clear the document first
  const body = doc.getBody();
  body.clear();
  
  // Add character name as document title
  body.appendParagraph(entity.name || '(senza nome)')
    .setHeading(DocumentApp.ParagraphHeading.TITLE);
  
  // Add character image
  addEntityImagePlaceholder(body, 'characters', entity);
  
  // Create tabs
  const tabs = doc.getTabs();
  
  // Remove existing tabs if any
  tabs.forEach(tab => doc.removeTab(tab));
  
  // Create main tabs
  const overviewTab = doc.addTab(DocumentApp.TabType.BODY, 'Panoramica');
  const attributesTab = doc.addTab(DocumentApp.TabType.BODY, 'Attributi');
  const relationshipsTab = doc.addTab(DocumentApp.TabType.BODY, 'Relazioni');
  const inventoryTab = doc.addTab(DocumentApp.TabType.BODY, 'Inventario');
  
  // Set the first tab as active
  doc.setActiveTab(overviewTab);
  
  // --- PANORAMICA TAB ---
  const overviewBody = overviewTab.asDocumentTab().getBody();
  
  // Add metadata
  addMetadata(overviewBody, entity);
  
  // Add main information
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
    addSectionTitle(overviewBody, "🔎 Informazioni principali", 3);
    addKeyValueList(overviewBody, main);
  }
  
  // Add biography
  const raw = entity.entry || '';
  const parsed = resolveReferences(raw);
  const clean = stripHtml(parsed);
  if (clean) {
    addSectionTitle(overviewBody, "📝 Biografia / Note", 3);
    overviewBody.appendParagraph(clean);
  }
  
  // Add appearance and history to overview
  const extras = [];
  if (entity.appearance) extras.push({ key: 'Aspetto', value: stripHtml(resolveReferences(entity.appearance)) });
  if (entity.history) extras.push({ key: 'Storia', value: stripHtml(resolveReferences(entity.history)) });
  if (entity.private_notes) extras.push({ key: 'Note private', value: stripHtml(resolveReferences(entity.private_notes)) });

  if (extras.length > 0) {
    addSectionTitle(overviewBody, "🔧 Altri dettagli", 3);
    addKeyValueList(overviewBody, extras);
  }
  
  // --- ATTRIBUTI TAB ---
  const attributesBody = attributesTab.asDocumentTab().getBody();
  
  // Add custom attributes
  if (entity.attributes && entity.attributes.length > 0) {
    addSectionTitle(attributesBody, "🧬 Attributi personalizzati", 2);
    entity.attributes.forEach(attr => {
      attributesBody.appendParagraph(`• ${attr.name}: ${attr.value}`);
    });
  }
  
  // Add traits/personality
  if (Array.isArray(entity.traits) && entity.traits.length > 0) {
    addSectionTitle(attributesBody, "✨ Tratti della personalità", 2);
    entity.traits.forEach(t => attributesBody.appendParagraph(`• ${t}`));
  } else if (Array.isArray(entity.tags) && entity.tags.length > 0) {
    addSectionTitle(attributesBody, "🏷️ Tags", 2);
    entity.tags.forEach(t => attributesBody.appendParagraph(`• ${t.name || t}`));
  }
  
  // --- RELAZIONI TAB ---
  const relationshipsBody = relationshipsTab.asDocumentTab().getBody();
  
  if (entity.relations && entity.relations.length > 0) {
    addSectionTitle(relationshipsBody, "🤝 Relazioni", 2);
    entity.relations.forEach(rel => {
      const target = rel.target_name || (rel.target_id ? resolveEntityName('characters', rel.target_id) : '[sconosciuto]');
      const role = rel.role || rel.type || 'Relazione';
      relationshipsBody.appendParagraph(`• ${role} con ${target}`);
    });
  } else {
    relationshipsBody.appendParagraph("Nessuna relazione registrata.")
      .setItalic(true);
  }
  
  // --- INVENTARIO TAB ---
  const inventoryBody = inventoryTab.asDocumentTab().getBody();
  
  if (entity.inventory && entity.inventory.length > 0) {
    addSectionTitle(inventoryBody, "🎒 Inventario", 2);
    entity.inventory.forEach(item => {
      const line = `• ${item.name || item.entity?.name || item.entity_name || 'Oggetto'}${item.amount ? ` (${item.amount})` : ''}${item.notes ? ` — ${stripHtml(item.notes)}` : ''}`;
      inventoryBody.appendParagraph(line);
    });
  } else {
    inventoryBody.appendParagraph("L'inventario è vuoto.")
      .setItalic(true);
  }
  
  // Add a small footer with last update info
  const lastUpdate = entity.updated_at || entity.created_at || '';
  if (lastUpdate) {
    const formattedDate = Utilities.formatDate(new Date(lastUpdate), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
    body.appendParagraph(`\n\nUltimo aggiornamento: ${formattedDate}`)
      .setFontSize(8)
      .setForegroundColor('#666666');
  }
}