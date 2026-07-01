import {
  getMarkdownCodeBlockLabel,
  getMarkdownCodeLanguageLabel,
  isMarkdownBlockCode,
} from './aiChatMarkdownCode';

describe('aiChatMarkdownCode', () => {
  test('detects language from markdown className', () => {
    expect(getMarkdownCodeLanguageLabel('language-json')).toBe('json');
  });

  test('detects multiline fenced block without language', () => {
    expect(isMarkdownBlockCode(undefined, 'line1\nline2')).toBe(true);
    expect(getMarkdownCodeBlockLabel(undefined, 'line1\nline2')).toBe('code');
  });

  test('treats single-line inline code as non-block', () => {
    expect(isMarkdownBlockCode(undefined, 'inline')).toBe(false);
  });
});
