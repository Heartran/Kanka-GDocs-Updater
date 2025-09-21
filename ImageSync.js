const IMAGE_PLACEHOLDER_MESSAGE = '🖼 Sincronizzazione immagini completata';

function syncEntityImages() {
  checkRequiredConfig();

  const docId = getMasterDocumentId();
  if (!docId) {
    Logger.log('❌ Documento principale non configurato.');
    return;
  }

  const doc = DocumentApp.openById(docId);
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  let updated = 0;
  let skipped = 0;

  paragraphs.forEach(paragraph => {
    const originalText = paragraph.getText();
    const placeholder = parseImagePlaceholder(originalText);
    if (!placeholder) {
      return;
    }

    const trimmed = (originalText || '').trim();
    const expectedPlaceholder = createImagePlaceholder(placeholder.type, placeholder.id);
    if (trimmed !== expectedPlaceholder) {
      Logger.log(`⚠️ Segnaposto immagine ignorato per evitare la perdita di testo: "${trimmed}"`);
      return;
    }

    paragraph.clear();
    const inserted = insertImageFromPlaceholder(paragraph, placeholder.type, placeholder.id);
    if (inserted) {
      updated++;
    } else {
      skipped++;
      paragraph.appendText(expectedPlaceholder);
      paragraph.setForegroundColor('#888888');
      paragraph.setItalic(true);
    }
  });

  Logger.log(`${IMAGE_PLACEHOLDER_MESSAGE}: ${updated} inserite, ${skipped} senza immagine`);
}

function insertImageFromPlaceholder(paragraph, type, id) {
  const entity = fetchEntity(type, id);
  if (!entity?.image_full) {
    Logger.log(`ℹ️ Nessuna immagine disponibile per ${type}:${id}`);
    return false;
  }

  try {
    const response = UrlFetchApp.fetch(entity.image_full, { muteHttpExceptions: true });
    const code = response.getResponseCode();
    const name = entity.name || '(senza nome)';
    if (code >= 400) {
      Logger.log(`⚠️ Impossibile caricare l'immagine per ${name} (HTTP ${code}): ${entity.image_full}`);
      return false;
    }

    const blob = response.getBlob();
    const contentType = blob.getContentType() || '';
    const bytes = blob.getBytes();
    if (!contentType.startsWith('image/') || !bytes || bytes.length === 0) {
      Logger.log(`⚠️ Dati immagine non validi per ${name}: ${entity.image_full}`);
      return false;
    }

    paragraph.appendInlineImage(blob);
    return true;
  } catch (e) {
    const name = entity?.name || '(senza nome)';
    Logger.log(`❌ Errore nel caricamento dell'immagine per ${name}: ${e}`);
    return false;
  }
}
