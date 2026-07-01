/**
 * @param {unknown} className
 * @returns {string|null}
 */
export function getMarkdownCodeLanguageLabel(className) {
  const classNames = Array.isArray(className) ? className.join(' ') : String(className || '');
  const match = /language-([\w+-]+)/i.exec(classNames);
  return match ? match[1].toLowerCase() : null;
}

/**
 * @param {unknown} className
 * @param {import('react').ReactNode} children
 * @returns {boolean}
 */
export function isMarkdownBlockCode(className, children) {
  if (getMarkdownCodeLanguageLabel(className)) {
    return true;
  }

  return String(children ?? '').includes('\n');
}

/**
 * @param {unknown} className
 * @param {import('react').ReactNode} children
 * @returns {string}
 */
export function getMarkdownCodeBlockLabel(className, children) {
  return getMarkdownCodeLanguageLabel(className) || (isMarkdownBlockCode(className, children) ? 'code' : '');
}
