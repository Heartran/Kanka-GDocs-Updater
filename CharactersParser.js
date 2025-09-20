function formatCharacterData(doc, entity) {
  const body = doc.getBody();
  addSectionTitle(body, entity.name || '(senza nome)', 2);
  addEntityImagePlaceholder(body, 'characters', entity);

  // Descrizione
  const raw = entity.entry || '';
  const parsed = resolveReferences(raw);
  const clean = stripHtml(parsed);
  if (clean) body.appendParagraph(clean);

  // Attributi personalizzati
  if (entity.attributes && entity.attributes.length > 0) {
    addSectionTitle(body, "🧬 Attributi", 3);
    entity.attributes.forEach(attr => {
      body.appendParagraph(`• ${attr.name}: ${attr.value}`);
    });
  }

  // Relazioni
  if (entity.relations && entity.relations.length > 0) {
    addSectionTitle(body, "🤝 Relazioni", 3);
    entity.relations.forEach(rel => {
      body.appendParagraph(`• ${rel.role || 'Relazione'} con ${rel.target_name}`);
    });
  }

  // Inventory
  if (entity.inventory && entity.inventory.length > 0) {
    addSectionTitle(body, "🎒 Inventario", 3);
    entity.inventory.forEach(item => {
      const line = `• ${item.name} (${item.amount || 1})`;
      body.appendParagraph(line);
    });
  }

  body.appendParagraph('');
}