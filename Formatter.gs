function resolveReferences(text) {
  if (!text) return '';
  const regex = /\[([a-z_]+):(\d+)\]/gi;

  return text.replace(regex, (match, type, id) => {
    const name = fetchEntityName('entities', id);
    if (!name || name === `[entities:${id}]`) {
      Logger.log(`❌ Reference non risolta: [${type}:${id}]`);
      return match;
    }
    return name;
  });
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

function addSectionTitle(body, text, level = 2) {
  const headingMap = {
    1: DocumentApp.ParagraphHeading.HEADING1,
    2: DocumentApp.ParagraphHeading.HEADING2,
    3: DocumentApp.ParagraphHeading.HEADING3
  };
  return body.appendParagraph(text).setHeading(headingMap[level]);
}
