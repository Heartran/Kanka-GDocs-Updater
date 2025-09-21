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

const DEFAULT_TEXT_COLOR = '#000000';

function applyNormalTextStyle(element) {
  if (!element) return element;

  let text;
  try {
    text = element.editAsText();
  } catch (err) {
    return element;
  }

  if (!text) return element;

  text.setItalic(false);
  text.setForegroundColor(DEFAULT_TEXT_COLOR);
  return element;
}

function appendNormalParagraph(body, text) {
  return applyNormalTextStyle(body.appendParagraph(text));
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
  const paragraph = body.appendParagraph(text);
  paragraph.setHeading(headingMap[level]);
  return applyNormalTextStyle(paragraph);
}

function addKeyValueList(body, entries) {
  entries.forEach(entry => {
    appendNormalParagraph(body, `• ${entry.key}: ${entry.value}`);
  });
}

function addTable(body, headers, rows) {
  const table = body.appendTable();
  if (table.getNumRows() > 0) {
    table.removeRow(0);
  }
  const headerRow = table.appendTableRow();
  headers.forEach(header => {
    const cell = headerRow.appendTableCell(header);
    const text = cell.editAsText();
    if (text) {
      text.setBold(true);
    }
    applyNormalTextStyle(cell);
  });

  rows.forEach(row => {
    const tableRow = table.appendTableRow();
    row.forEach(cellValue => {
      const cell = tableRow.appendTableCell(cellValue);
      applyNormalTextStyle(cell);
    });
  });
}

function formatCalendarData(doc, entity) {
  const body = doc.getBody();
  addSectionTitle(body, entity.name || "Calendario");

  appendNormalParagraph(body, `📅 Data di riferimento: ${formatCalendarDate(entity.date)}`);

  // Mesi
  addSectionTitle(body, "📘 Mesi dell’anno", 3);
  addTable(body, ["Nome", "Giorni", "Alias", "Tipo"],
    entity.months.map(m => [m.name, `${m.length}`, m.alias || "-", m.type]));

  // Giorni settimana
  addSectionTitle(body, "📆 Giorni della settimana", 3);
  entity.weekdays.forEach(day => appendNormalParagraph(body, `• ${day}`));

  // Stagioni
  addSectionTitle(body, "🌸 Stagioni", 3);
  entity.seasons.forEach(s =>
    appendNormalParagraph(body, `• ${s.name} – giorno ${s.day} del mese ${s.month}`));

  // Lune
  addSectionTitle(body, "🌙 Lune", 3);
  addTable(body, ["Nome", "Luna piena", "Offset", "Colore"],
    entity.moons.map(m => [m.name, `${m.fullmoon}`, `${m.offset}`, m.colour]));

  // Eventi
  if (entity.entity_events?.length) {
    addSectionTitle(body, "🪧 Eventi ricorrenti", 3);
    entity.entity_events.forEach(ev => {
      appendNormalParagraph(body, `• ${ev.comment} – ${formatCalendarDate(ev.date)}${ev.is_recurring ? " (ricorrente)" : ""}`);
    });
  }
}

function formatCalendarDate(dateStr) {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const monthNames = [
    "Lairesa", "Kinera", "Eldar", "Nivara", "Flora", "Solara",
    "Ignara", "Altara", "Venta", "Folia", "Mora", "Nocta"
  ];
  return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}`;
}

function formatGenericEntity(doc, entity) {
  const body = doc.getBody();
  addSectionTitle(body, entity.name || '(senza nome)', 2);

  const raw = entity.entry || '';
  const parsed = resolveReferences(raw);
  const clean = stripHtml(parsed);
  appendNormalParagraph(body, clean);
}
