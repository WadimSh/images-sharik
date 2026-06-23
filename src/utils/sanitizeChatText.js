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
