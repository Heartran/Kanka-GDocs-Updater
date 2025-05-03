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