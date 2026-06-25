/**
 * Убирает C0/C1 управляющие символы, кроме перевода строки и табуляции.
 * @param {unknown} text
 * @returns {string}
 */
export function sanitizeChatText(text) {
  if (typeof text !== 'string') {
    return '';
  }

  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
}

/**
 * GFM-таблицы требуют перенос строки между рядами. Модели иногда склеивают ряды в одну строку.
 * @param {string} text
 * @returns {string}
 */
export function normalizeMarkdownTables(text) {
  if (!text.includes('|')) {
    return text;
  }

  return text.replace(/\|\s+\|\s+/g, '|\n| ');
}
