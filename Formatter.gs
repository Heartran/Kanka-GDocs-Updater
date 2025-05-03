function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').trim();
}

function resolveReferences(text) {
  if (!text) return '';
  const regex = /\[([a-z_]+):(\d+)\]/gi;

  const endpointMap = {
    location: 'locations',
    character: 'characters',
    race: 'races',
    tag: 'tags',
    organisation: 'organisations',
    family: 'families',
    journal: 'journals',
    item: 'items'
    // altri tipi supportati se vuoi
  };

  return text.replace(regex, (match, type, id) => {
    const endpoint = endpointMap[type];
    if (!endpoint) {
      Logger.log(`Tipo non supportato: ${type}`);
      return match;
    }

    return fetchEntityName(endpoint, id); // chiamata singola per ogni riferimento
  });
}