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
  const paragraph = body.appendParagraph(text);
  paragraph.setHeading(headingMap[level] || DocumentApp.ParagraphHeading.NORMAL);
  return paragraph;
}

function addKeyValueList(body, entries) {
  entries.forEach(entry => {
    body.appendParagraph(`• ${entry.key}: ${entry.value}`);
  });
}

function addTable(body, headers, rows) {
  const table = body.appendTable();

  // Add header cells
  const headerRow = table.appendTableRow();
  headers.forEach(h => headerRow.appendTableCell(String(h)));

  // Add data rows
  rows.forEach(row => {
    const tr = table.appendTableRow();
    row.forEach(cell => tr.appendTableCell(String(cell)));
  });
}

function formatCalendarData(doc, entity) {
  const body = doc.getBody();
  addSectionTitle(body, entity.name || "Calendario");

  body.appendParagraph(`📅 Data di riferimento: ${formatCalendarDate(entity.date)}`);

  // Mesi
  addSectionTitle(body, "📘 Mesi dell’anno", 3);
  addTable(body, ["Nome", "Giorni", "Alias", "Tipo"],
    entity.months.map(m => [m.name, `${m.length}`, m.alias || "-", m.type]));

  // Giorni settimana
  addSectionTitle(body, "📆 Giorni della settimana", 3);
  entity.weekdays.forEach(day => body.appendParagraph(`• ${day}`));

  // Stagioni
  addSectionTitle(body, "🌸 Stagioni", 3);
  entity.seasons.forEach(s =>
    body.appendParagraph(`• ${s.name} – giorno ${s.day} del mese ${s.month}`));

  // Lune
  addSectionTitle(body, "🌙 Lune", 3);
  addTable(body, ["Nome", "Luna piena", "Offset", "Colore"],
    entity.moons.map(m => [m.name, `${m.fullmoon}`, `${m.offset}`, m.colour]));

  // Eventi
  if (entity.entity_events?.length) {
    addSectionTitle(body, "🪧 Eventi ricorrenti", 3);
    entity.entity_events.forEach(ev => {
      body.appendParagraph(`• ${ev.comment} – ${formatCalendarDate(ev.date)}${ev.is_recurring ? " (ricorrente)" : ""}`);
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

function formatTimelineData(doc, entity) {
  const body = doc.getBody();
  addSectionTitle(body, entity.name || "📜 Timeline", 2);

  if (!entity.eras || entity.eras.length === 0) {
    body.appendParagraph("⚠️ Nessuna era presente in questa timeline.");
    return;
  }

  entity.eras.forEach(era => {
    // Titolo era
    const eraLabel = `🕰️ ${era.name}` + (era.abbreviation ? ` (${era.abbreviation})` : '');
    addSectionTitle(body, eraLabel, 3);

    // Periodo dell'era (se noto)
    if (era.start_year || era.end_year) {
      const start = era.start_year !== null ? era.start_year : "???";
      const end = era.end_year !== null ? era.end_year : "???";
      body.appendParagraph(`📅 Periodo: dal ${start} al ${end}`);
    }

    // Descrizione dell'era
    if (era.entry) {
      body.appendParagraph(stripHtml(resolveReferences(era.entry)));
    }

    // Eventi della timeline (elements)
    if (Array.isArray(era.elements) && era.elements.length > 0) {
      era.elements
        .sort((a, b) => a.position - b.position)
        .forEach(element => {
          const date = element.date ? `(${element.date})` : '';
          const title = element.name?.trim() || '';
          const entry = stripHtml(resolveReferences(element.entry || ''));

          const bulletTitle = title ? `• ${title} ${date}` : `• ${date}`;

          addSectionTitle(body, bulletTitle.trim(), 4);
          if (entry) body.appendParagraph(entry);
        });
    } else {
      body.appendParagraph("• Nessun evento registrato per quest'era.");
    }

    body.appendParagraph(""); // spazio extra
  });
}

