import { uploadGraphicFile } from '../services/mediaService';

/**
 * @param {string} url
 * @returns {Promise<Blob>}
 */
export async function fetchImageBlobFromUrl(url) {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Не удалось загрузить изображение');
  }

  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error('Файл не является изображением');
  }

  return blob;
}

/**
 * @param {Blob} blob
 * @returns {Promise<Blob>}
 */
export function convertBlobToWebP(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Не удалось подготовить изображение'));
        return;
      }

      context.drawImage(img, 0, 0);

      canvas.toBlob(
        (webpBlob) => {
          if (!webpBlob) {
            reject(new Error('Не удалось конвертировать изображение'));
            return;
          }
          resolve(webpBlob);
        },
        'image/webp',
        0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не удалось прочитать изображение'));
    };

    img.src = url;
  });
}

/**
 * @param {Blob} blob
 * @param {string} finalFileName
 * @returns {Promise<File>}
 */
export async function buildUploadFileFromBlob(blob, finalFileName) {
  const shouldConvertToWebp = blob.type.startsWith('image/') && blob.type !== 'image/webp';

  if (!shouldConvertToWebp) {
    return new File([blob], finalFileName, {
      type: blob.type,
      lastModified: Date.now(),
    });
  }

  const webpBlob = await convertBlobToWebP(blob);
  const finalFileNameWithExt = finalFileName.toLowerCase().endsWith('.webp')
    ? finalFileName
    : `${finalFileName.replace(/\.[^/.]+$/, '')}.webp`;

  return new File([webpBlob], finalFileNameWithExt, {
    type: 'image/webp',
    lastModified: Date.now(),
  });
}

/**
 * @param {object} params
 * @param {string} params.companyId
 * @param {Blob} params.blob
 * @param {string} params.finalFileName
 * @param {string[]} params.tags
 * @returns {Promise<object>}
 */
export async function uploadGraphicToLibrary({ companyId, blob, finalFileName, tags }) {
  if (!companyId) {
    throw new Error('Не удалось определить компанию для загрузки');
  }

  const fileToUpload = await buildUploadFileFromBlob(blob, finalFileName);
  return uploadGraphicFile(companyId, fileToUpload, null, tags);
}
