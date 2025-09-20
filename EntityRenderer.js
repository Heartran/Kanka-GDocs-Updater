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

  // fallback generico
  const name = entity.name || '(senza nome)';
  const raw = entity.entry || '';
  const parsed = resolveReferences(raw);
  const clean = stripHtml(parsed);

  const body = doc.getBody();
  body.appendParagraph(name).setHeading(DocumentApp.ParagraphHeading.HEADING2);
  addEntityImagePlaceholder(body, type, entity);
  body.appendParagraph(clean);
  body.appendParagraph('');
}
