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
  const name = entity?.name || '(senza nome)';
  const entityLabel = entity ? `${name} (${type}:${id})` : `${type}:${id}`;
  const preparedBlob = getEntityImageBlob(entity, type, id);

  if (!preparedBlob) {
    Logger.log(`ℹ️ Nessuna immagine disponibile per ${entityLabel}`);
    return false;
  }

  try {
    paragraph.clear();
    paragraph.appendInlineImage(preparedBlob);
    formatInsertedImage(paragraph);
    return true;
  } catch (e) {
    Logger.log(`❌ Errore nell'inserimento dell'immagine per ${entityLabel}: ${e}`);
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

function getEntityImageBlob(entity, type, id) {
  if (!entity) {
    return null;
  }

  const name = entity.name || '(senza nome)';
  const entityLabel = `${name} (${type}:${id})`;
  const filenameHint = `${type}-${id}`;
  const variants = [];

  if (entity.image_full) {
    variants.push({ url: entity.image_full, label: 'immagine completa', allowTiny: true });
  }

  if (entity.image_thumb) {
    variants.push({ url: entity.image_thumb, label: 'miniatura', allowTiny: false });
  }

  if (variants.length === 0) {
    return null;
  }

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const blob = downloadImageBlob(variant.url, entityLabel, variant.label);
    if (!blob) {
      continue;
    }

    const prepared = prepareEntityImageBlob(blob, filenameHint, entityLabel, variant.allowTiny);
    if (prepared) {
      if (!variant.allowTiny) {
        Logger.log(`ℹ️ Utilizzo la miniatura Kanka per ${entityLabel}.`);
      }
      return prepared;
    }
  }

  return null;
}

function downloadImageBlob(url, entityLabel, description) {
  if (!url) {
    return null;
  }

  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const code = response.getResponseCode();
    if (code >= 400) {
      Logger.log(`⚠️ Impossibile scaricare ${description} per ${entityLabel} (HTTP ${code}): ${url}`);
      return null;
    }

    return response.getBlob();
  } catch (error) {
    Logger.log(`❌ Errore durante lo scaricamento di ${description} per ${entityLabel}: ${error}`);
    return null;
  }
}

function prepareEntityImageBlob(blob, filenameHint, entityLabel, allowTinyResize) {
  if (!blob) {
    return null;
  }

  let workingBlob = blob;
  if (allowTinyResize) {
    workingBlob = attemptTinyResize(workingBlob, entityLabel);
  }

  const preparedBlob = prepareImageBlob(workingBlob, filenameHint);
  if (!preparedBlob) {
    Logger.log(`⚠️ Dati immagine non utilizzabili per ${entityLabel}.`);
  }
  return preparedBlob;
}

function attemptTinyResize(blob, entityLabel) {
  if (!blob) {
    return blob;
  }

  if (typeof getTinyPngApiKey !== 'function') {
    return blob;
  }

  const apiKey = getTinyPngApiKey();
  if (!apiKey) {
    return blob;
  }

  const credentials = apiKey.startsWith('api:') ? apiKey : `api:${apiKey}`;
  const authHeader = 'Basic ' + Utilities.base64Encode(credentials);

  try {
    const shrinkResp = UrlFetchApp.fetch('https://api.tinify.com/shrink', {
      method: 'post',
      headers: { Authorization: authHeader },
      payload: blob,
      muteHttpExceptions: true,
    });
    const shrinkCode = shrinkResp.getResponseCode();
    if (shrinkCode >= 400) {
      Logger.log(`⚠️ Compressione TinyPNG fallita per ${entityLabel} (HTTP ${shrinkCode}): ${shrinkResp.getContentText()}`);
      return blob;
    }

    let tinyUrl = extractTinyOutputUrl(shrinkResp);
    if (!tinyUrl) {
      Logger.log(`⚠️ Risposta TinyPNG senza URL di output per ${entityLabel}.`);
      return blob;
    }

    const maxDimension = typeof getTinyPngMaxDimension === 'function' ? getTinyPngMaxDimension() : null;
    if (maxDimension && maxDimension > 0) {
      const resizeResp = UrlFetchApp.fetch(tinyUrl, {
        method: 'post',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        payload: JSON.stringify({ resize: { method: 'fit', width: maxDimension, height: maxDimension } }),
        muteHttpExceptions: true,
      });
      const resizeCode = resizeResp.getResponseCode();
      if (resizeCode >= 400) {
        Logger.log(`⚠️ Ridimensionamento TinyPNG fallito per ${entityLabel} (HTTP ${resizeCode}): ${resizeResp.getContentText()}`);
      } else {
        const resizedUrl = extractTinyOutputUrl(resizeResp);
        if (resizedUrl) {
          tinyUrl = resizedUrl;
        } else if (isTinyBinaryResponse(resizeResp)) {
          return resizeResp.getBlob();
        }
      }
    }

    const finalResp = UrlFetchApp.fetch(tinyUrl, {
      headers: { Authorization: authHeader },
      muteHttpExceptions: true,
    });
    const finalCode = finalResp.getResponseCode();
    if (finalCode >= 400) {
      Logger.log(`⚠️ Download TinyPNG fallito per ${entityLabel} (HTTP ${finalCode}): ${tinyUrl}`);
      return blob;
    }

    return finalResp.getBlob();
  } catch (error) {
    Logger.log(`⚠️ Impossibile ridimensionare l'immagine con TinyPNG per ${entityLabel}: ${error}`);
    return blob;
  }
}

function extractTinyOutputUrl(response) {
  if (!response) {
    return null;
  }

  const headers = response.getHeaders ? response.getHeaders() : {};
  if (headers) {
    const directLocation = headers.Location || headers.location;
    if (directLocation) {
      return directLocation;
    }
  }

  const text = response.getContentText();
  if (text) {
    try {
      const payload = JSON.parse(text);
      if (payload && payload.output && payload.output.url) {
        return payload.output.url;
      }
    } catch (jsonError) {
      // Ignoro la risposta non JSON
    }
  }

  return null;
}

function isTinyBinaryResponse(response) {
  if (!response || !response.getHeaders) {
    return false;
  }

  const headers = response.getHeaders();
  const contentType = (headers['Content-Type'] || headers['content-type'] || '').toLowerCase();
  return contentType.startsWith('image/');
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
