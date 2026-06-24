/**
 * @param {{ username?: string, email?: string }|null|undefined} user
 * @returns {string|null}
 */
export function getUserDisplayName(user) {
  const raw = user?.username || (user?.email ? user.email.split('@')[0] : null);
  if (!raw) return null;

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * @param {{ username?: string, email?: string }|null|undefined} user
 * @returns {string}
 */
export function getAiChatWelcomeGreeting(user) {
  const displayName = getUserDisplayName(user);

  if (displayName) {
    return `Здравствуйте, ${displayName}! Что вас интересует?`;
  }

  return 'Здравствуйте! Что вас интересует?';
}
