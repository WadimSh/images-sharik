import { normalizeMarkdownTables } from './sanitizeChatText';

describe('normalizeMarkdownTables', () => {
  test('splits glued table rows onto separate lines', () => {
    const input =
      '| Что делать | Чего избегать | | :--- | :--- | | ✅ Да | ❌ Нет |';
    const expected =
      '| Что делать | Чего избегать |\n| :--- | :--- |\n| ✅ Да | ❌ Нет |';

    expect(normalizeMarkdownTables(input)).toBe(expected);
  });

  test('leaves text without pipes unchanged', () => {
    expect(normalizeMarkdownTables('обычный текст')).toBe('обычный текст');
  });
});
