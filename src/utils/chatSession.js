/**
 * @param {string|Date|null|undefined} value
 * @returns {string}
 */
export function formatRelativeTime(value) {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 45) {
    return 'только что';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin} мин. назад`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `${diffHours} ч. назад`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} дн. назад`;
  }

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * @param {object|null|undefined} session
 * @returns {string}
 */
export function getSessionId(session) {
  return session?.id || session?._id || '';
}

export const CHAT_SESSION_TITLE_MAX_LENGTH = 100;

/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeChatSessionTitle(value) {
  return String(value ?? '').trim().slice(0, CHAT_SESSION_TITLE_MAX_LENGTH);
}

/**
 * @param {unknown} prompt
 * @returns {string}
 */
export function buildChatSessionTitleFromPrompt(prompt) {
  return normalizeChatSessionTitle(prompt) || 'Новый чат';
}
