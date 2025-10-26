function formatCharacterData(doc, entity) {
  const body = doc.getBody();
  body.clear();
  
  // Add character name as document title with death indicator if applicable
  const title = `${entity.name || '(senza nome)'}${entity.is_dead ? ' (Deceduto/a)' : ''}`;
  body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.TITLE);
  
  // Add character image if available
  if (entity.image_full || entity.image_thumb) {
    addEntityImagePlaceholder(body, 'characters', entity);
  }
  
  // Helper function to add a section with title and content
  const addSection = (tabBody, title, content, level = 3) => {
    if (content && content.trim() !== '') {
      addSectionTitle(tabBody, title, level);
      tabBody.appendParagraph(content);
      return true;
    }
    return false;
  };
  
  // --- PANORAMICA TAB ---
  const overviewBody = body;
  
  // Add metadata (creator, last update, etc.)
  addMetadata(overviewBody, entity);
  
  // Main information section
  const mainInfo = [];
  if (entity.title) mainInfo.push({ key: 'Titolo', value: entity.title });
  if (entity.type) mainInfo.push({ key: 'Tipo', value: entity.type });
  if (entity.age) mainInfo.push({ key: 'Età', value: entity.age });
  if (entity.sex) mainInfo.push({ key: 'Sesso', value: entity.sex });
  if (entity.pronouns) mainInfo.push({ key: 'Pronomi', value: entity.pronouns });
  
  // Handle races (both public and private)
  const races = [];
  if (entity.race_name) races.push(entity.race_name);
  if (entity.race_id && !entity.race_name) {
    const raceName = resolveEntityName('races', entity.race_id);
    if (raceName) races.push(raceName);
  }
  if (entity.races && entity.races.length > 0) {
    entity.races.forEach(raceId => {
      const raceName = resolveEntityName('races', raceId);
      if (raceName) races.push(raceName);
    });
  }
  if (entity.private_races && entity.private_races.length > 0) {
    entity.private_races.forEach(raceId => {
      const raceName = resolveEntityName('races', raceId);
      if (raceName) races.push(`${raceName} (privato)`);
    });
  }
  if (races.length > 0) {
    mainInfo.push({ key: 'Razza/e', value: races.join(', ') });
  }

  // Family information
  const families = [];
  if (entity.family_name) families.push(entity.family_name);
  if (entity.family_id && !entity.family_name) {
    const familyName = resolveEntityName('families', entity.family_id);
    if (familyName) families.push(familyName);
  }
  if (entity.families && entity.families.length > 0) {
    entity.families.forEach(familyId => {
      const familyName = resolveEntityName('families', familyId);
      if (familyName) families.push(familyName);
    });
  }
  if (families.length > 0) {
    mainInfo.push({ 
      key: families.length > 1 ? 'Famiglie' : 'Famiglia', 
      value: families.join(', ') 
    });
  }

  // Location information
  if (entity.location_name) {
    mainInfo.push({ key: 'Posizione', value: entity.location_name });
  } else if (entity.location_id) {
    const locationName = resolveEntityName('locations', entity.location_id);
    if (locationName) {
      mainInfo.push({ key: 'Posizione', value: locationName });
    }
  }

  // Add main info to overview
  if (mainInfo.length > 0) {
    addSectionTitle(overviewBody, "🔎 Informazioni principali", 3);
    addKeyValueList(overviewBody, mainInfo);
  }
  
  // Add biography with proper HTML handling
  const rawBio = entity.entry || '';
  const parsedBio = resolveReferences(rawBio);
  const cleanBio = stripHtml(parsedBio);
  addSection(overviewBody, "📝 Biografia", cleanBio);
  
  // Add appearance if available
  if (entity.appearance) {
    const cleanAppearance = stripHtml(resolveReferences(entity.appearance));
    addSection(overviewBody, "👤 Aspetto fisico", cleanAppearance);
  }
  
  // Add history if available
  if (entity.history) {
    const cleanHistory = stripHtml(resolveReferences(entity.history));
    addSection(overviewBody, "📜 Storia", cleanHistory);
  }
  
  // --- ATTRIBUTI TAB ---
  const attributesBody = body;
  
  // Add custom attributes
  if (entity.attributes && entity.attributes.length > 0) {
    addSectionTitle(attributesBody, "🧬 Attributi personalizzati", 2);
    const groupedAttributes = {};
    
    // Group attributes by section
    entity.attributes.forEach(attr => {
      const section = attr.section || 'Generali';
      if (!groupedAttributes[section]) {
        groupedAttributes[section] = [];
      }
      groupedAttributes[section].push(attr);
    });
    
    // Add each section
    Object.entries(groupedAttributes).forEach(([section, attrs]) => {
      addSectionTitle(attributesBody, `📋 ${section}`, 3);
      attrs.forEach(attr => {
        attributesBody.appendParagraph(`• ${attr.name}: ${attr.value}`);
      });
    });
  } else {
    attributesBody.appendParagraph("Nessun attributo personalizzato trovato.")
      .setItalic(true);
  }
  
  // --- PERSONALITÀ TAB ---
  const personalityBody = body;
  
  // Process traits if available
  if (Array.isArray(entity.traits) && entity.traits.length > 0) {
    const traitsBySection = {};
    
    // Group traits by section
    entity.traits.forEach(trait => {
      const section = trait.section || 'Generale';
      if (!traitsBySection[section]) {
        traitsBySection[section] = [];
      }
      traitsBySection[section].push(trait);
    });
    
    // Add each trait section
    Object.entries(traitsBySection).forEach(([section, traits]) => {
      addSectionTitle(personalityBody, `✨ ${section}`, 3);
      traits.forEach(trait => {
        const entry = trait.entry_parsed ? stripHtml(trait.entry_parsed) : trait.entry;
        personalityBody.appendParagraph(`• ${trait.name}: ${entry || '(nessun dettaglio)'}`);
      });
    });
  } else if (Array.isArray(entity.tags) && entity.tags.length > 0) {
    addSectionTitle(personalityBody, "🏷️ Tags", 2);
    entity.tags.forEach(tag => {
      personalityBody.appendParagraph(`• ${tag.name || tag}`);
    });
  } else {
    personalityBody.appendParagraph("Nessun tratto o tag trovato.")
      .setItalic(true);
  }
  
  // --- RELAZIONI TAB ---
  const relationshipsBody = body;
  
  if (entity.relations && entity.relations.length > 0) {
    // Group relations by type
    const relationsByType = {};
    entity.relations.forEach(rel => {
      const type = rel.relation || rel.type || 'Generica';
      if (!relationsByType[type]) {
        relationsByType[type] = [];
      }
      relationsByType[type].push(rel);
    });
    
    // Add each relation type
    Object.entries(relationsByType).forEach(([type, relations]) => {
      addSectionTitle(relationshipsBody, `🤝 ${type}`, 3);
      relations.forEach(rel => {
        const target = rel.target_name || 
                     (rel.target_id ? resolveEntityName(rel.target_entity_type || 'characters', rel.target_id) : '[sconosciuto]');
        const details = rel.attitude ? ` (${rel.attitude})` : '';
        relationshipsBody.appendParagraph(`• ${rel.relation || 'Relazione'} con ${target}${details}`);
        
        if (rel.attributions) {
          relationshipsBody.appendParagraph(`  - Attribuzioni: ${rel.attributions}`)
            .setIndentStart(20);
        }
      });
    });
  } else {
    relationshipsBody.appendParagraph("Nessuna relazione registrata.")
      .setItalic(true);
  }
  
  // --- INVENTARIO TAB ---
  const inventoryBody = body;
  
  if (entity.inventory && entity.inventory.length > 0) {
    // Group inventory by location if available
    const inventoryByLocation = {};
    entity.inventory.forEach(item => {
      const location = item.location_id ? 
        resolveEntityName('locations', item.location_id) : 'Generale';
      if (!inventoryByLocation[location]) {
        inventoryByLocation[location] = [];
      }
      inventoryByLocation[location].push(item);
    });
    
    // Add each location's items
    Object.entries(inventoryByLocation).forEach(([location, items]) => {
      addSectionTitle(inventoryBody, `📍 ${location}`, 3);
      items.forEach(item => {
        const name = item.name || item.entity?.name || item.entity_name || 'Oggetto';
        const amount = item.amount ? ` (${item.amount})` : '';
        const position = item.position ? ` [${item.position}]` : '';
        const notes = item.notes ? ` — ${stripHtml(resolveReferences(item.notes))}` : '';
        inventoryBody.appendParagraph(`• ${name}${amount}${position}${notes}`);
      });
    });
  } else {
    inventoryBody.appendParagraph("L'inventario è vuoto.")
      .setItalic(true);
  }
  
  // --- NOTE & ALTRO TAB ---
  const notesBody = body;
  
  // Add private notes if available and visible
  if (entity.private_notes && entity.is_private_visible !== false) {
    const cleanPrivateNotes = stripHtml(resolveReferences(entity.private_notes));
    addSection(notesBody, "🔒 Note private", cleanPrivateNotes, 2);
  }
  
  // Add tags if any
  if (Array.isArray(entity.tags) && entity.tags.length > 0) {
    addSectionTitle(notesBody, "🏷️ Tags", 2);
    notesBody.appendParagraph(
      entity.tags.map(t => t.name || t).join(' • ')
    );
  }
  
  // Add template information if this is a template
  if (entity.is_template) {
    addSectionTitle(notesBody, "📋 Modello", 2);
    notesBody.appendParagraph("Questo personaggio è un modello utilizzabile per creare altri personaggi.");
  }
  
  // Add visibility information
  const visibility = [];
  if (entity.is_private) visibility.push("Privato");
  if (entity.is_personality_visible === false) visibility.push("Personalità nascosta");
  if (visibility.length > 0) {
    addSectionTitle(notesBody, "👁️ Visibilità", 2);
    notesBody.appendParagraph(visibility.join(' • '));
  }
  
  // Add a small footer with last update info on the first page
  const lastUpdate = entity.updated_at || entity.created_at;
  if (lastUpdate) {
    const formattedDate = Utilities.formatDate(
      new Date(lastUpdate), 
      Session.getScriptTimeZone(), 
      "dd/MM/yyyy 'alle' HH:mm"
    );
    
    const footer = body.appendParagraph(`\n\nUltimo aggiornamento: ${formattedDate}`);
    footer.setFontSize(8).setForegroundColor('#666666');
    
    // Add creator/updater info if available
    if (entity.created_by_name || entity.updated_by_name) {
      const creator = entity.created_by_name ? `Creato da ${entity.created_by_name}` : '';
      const updater = entity.updated_by_name && entity.updated_by_name !== entity.created_by_name ? 
        ` • Ultima modifica di ${entity.updated_by_name}` : '';
      
      if (creator || updater) {
        const credits = body.appendParagraph(`${creator}${updater}`);
        credits.setFontSize(8).setForegroundColor('#666666');
      }
    }
  }
}