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

    const inserted = insertImageFromPlaceholder(paragraph, placeholder.type, placeholder.id);
    if (inserted) {
      updated++;
    } else {
      skipped++;
      ensurePlaceholderFormatting(paragraph, expectedPlaceholder);
    }
  });

  Logger.log(`${IMAGE_PLACEHOLDER_MESSAGE}: ${updated} inserite, ${skipped} senza immagine`);
}

function insertImageFromPlaceholder(paragraph, type, id) {
  const entity = fetchEntity(type, id);
  const imageUrl = resolveEntityImageUrl(entity);
  if (!imageUrl) {
    Logger.log(`ℹ️ Nessuna immagine disponibile per ${type}:${id}`);
    return false;
  }

  try {
    if (!entity?.image_thumb && entity?.image_full) {
      Logger.log(`ℹ️ Miniatura non disponibile per ${type}:${id}, utilizzo l'immagine completa.`);
    }

    const response = UrlFetchApp.fetch(imageUrl, { muteHttpExceptions: true });
    const code = response.getResponseCode();
    const name = entity.name || '(senza nome)';
    if (code >= 400) {
      Logger.log(`⚠️ Impossibile caricare l'immagine per ${name} (HTTP ${code}): ${imageUrl}`);
      return false;
    }

    const blob = response.getBlob();
    const preparedBlob = prepareImageBlob(blob, `${type}-${id}`);
    if (!preparedBlob) {
      Logger.log(`⚠️ Dati immagine non utilizzabili per ${name}: ${entity.image_full}`);
      return false;
    }

    paragraph.clear();
    paragraph.appendInlineImage(preparedBlob);
    formatInsertedImage(paragraph);
    return true;
  } catch (e) {
    const name = entity?.name || '(senza nome)';
    Logger.log(`❌ Errore nel caricamento dell'immagine per ${name}: ${e}`);
    return false;
  }
}

function formatInsertedImage(paragraph) {
  try {
    paragraph.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    paragraph.setSpacingBefore(6);
    paragraph.setSpacingAfter(6);
    paragraph.setLineSpacing(1);
  } catch (formatError) {
    Logger.log(`⚠️ Impossibile applicare la formattazione del paragrafo per l'immagine: ${formatError}`);
  }
}

function ensurePlaceholderFormatting(paragraph, placeholderText) {
  const currentText = (paragraph.getText() || '').trim();
  const textElement = paragraph.editAsText();
  if (!textElement) {
    return;
  }

  if (currentText !== placeholderText) {
    textElement.setText(placeholderText);
  }

  const length = textElement.getText().length;
  if (length === 0) {
    return;
  }

  textElement.setItalic(0, length - 1, true);
  textElement.setForegroundColor(0, length - 1, '#888888');
}

function resolveEntityImageUrl(entity) {
  if (!entity) {
    return null;
  }

  if (entity.image_thumb) {
    return entity.image_thumb;
  }

  if (entity.image_full) {
    return entity.image_full;
  }

  return null;
}

function prepareImageBlob(blob, filenameHint) {
  if (!blob) {
    return null;
  }

  const bytes = blob.getBytes();
  if (!bytes || bytes.length === 0) {
    return null;
  }

  let contentType = (blob.getContentType() || '').toLowerCase();
  if (!contentType.startsWith('image/')) {
    return null;
  }

  const supportedTypes = [MimeType.PNG, MimeType.JPEG, MimeType.GIF, MimeType.BMP];
  let workingBlob = blob;

  if (!supportedTypes.includes(contentType)) {
    try {
      workingBlob = blob.getAs(MimeType.PNG);
      contentType = MimeType.PNG;
    } catch (conversionError) {
      Logger.log(`⚠️ Impossibile convertire l'immagine (${contentType}) in PNG: ${conversionError}`);
      return null;
    }
  }

  if (filenameHint) {
    const extension = contentType.split('/')[1] || 'png';
    workingBlob.setName(`${filenameHint}.${extension}`);
  }

  return workingBlob;
}
