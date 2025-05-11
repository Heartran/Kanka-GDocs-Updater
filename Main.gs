function syncKankaToGoogleDoc() {
  try {
    checkRequiredConfig(); // Verifica che tutte le variabili siano settate

    const doc = DocumentApp.openById(getGoogleDocId());
    const body = doc.getBody();
    body.clear();

    body.appendParagraph('Personaggi di Eldarion')
        .setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph(`Aggiornato il: ${new Date().toLocaleString()}`);
    body.appendParagraph('');
    preloadEntityMaps(); // scarica tutto in anticipo
    const characters = fetchCharacters();

    characters.forEach(character => {
      const raw = character.entry || '';
      const parsed = resolveReferences(raw);
      const cleanText = stripHtml(parsed);

      body.appendParagraph(character.name)
          .setHeading(DocumentApp.ParagraphHeading.HEADING2);
      body.appendParagraph(cleanText);
      body.appendParagraph(''); // spazio

      if (character.tags && character.tags.length > 0) {
        body.appendParagraph('Tag associati:');
        character.tags.forEach(tagId => {
          const tagName = fetchEntityName('tags', tagId);
          body.appendListItem(`#${tagName}`);
        });
        body.appendParagraph('');
      }
    });

    Logger.log(`Documento aggiornato: https://docs.google.com/document/d/${getGoogleDocId()}/edit`);
  } catch (e) {
    Logger.log(`Errore nella sincronizzazione: ${e}`);
    throw e;
  }
}

function syncEntitiesToDoc(type) {
  const docId = getDocumentIdForType(type);
  if (!docId) {
    Logger.log(`❌ Documento non configurato per il tipo: ${type}`);
    return;
  }

  const doc = DocumentApp.openById(docId);
  const body = doc.getBody();
  const entities = fetchAllEntities(type);

  body.clear();
  body.appendParagraph(`📄 Elenco: ${type.charAt(0).toUpperCase() + type.slice(1)}`)
      .setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(`Aggiornato il: ${new Date().toLocaleString()}`);
  body.appendParagraph('');

  entities.forEach(entity => {
    const name = entity.name || '(senza nome)';
    const raw = entity.entry || '';
    const parsed = resolveReferences(raw);
    const clean = stripHtml(parsed);

    body.appendParagraph(name).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(clean);
    body.appendParagraph('');
  });

  Logger.log(`✅ Documento aggiornato per ${type}: https://docs.google.com/document/d/${docId}/edit`);
}
