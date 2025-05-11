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
