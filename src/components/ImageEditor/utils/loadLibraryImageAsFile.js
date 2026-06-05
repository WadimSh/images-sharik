const BASE_URL = process.env.REACT_APP_API_URL || 'https://mp.sharik.ru';

export function getLibraryImageUrl(url) {
  if (!url) return '';
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
}

export async function loadLibraryImageAsFile({ url, fileName }) {
  const fullUrl = getLibraryImageUrl(url);
  const response = await fetch(fullUrl);

  if (!response.ok) {
    throw new Error('Не удалось загрузить изображение из хранилища');
  }

  const blob = await response.blob();
  const name = fileName || 'guidance.jpg';

  return new File([blob], name, {
    type: blob.type || 'image/jpeg',
  });
}
