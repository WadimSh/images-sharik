export const hexToRgba = (hex, alpha = 1) => {
  // Убираем # если есть
  const cleanHex = hex.replace('#', '');
  
  // Парсим RGB значения
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  // Обрабатываем особые случаи для градиентов
  const processedAlpha = alpha === 0 ? 0.01 : alpha; // Предотвращаем полную прозрачность
  
  // Возвращаем rgba строку
  return `rgba(${r}, ${g}, ${b}, ${processedAlpha})`;
};