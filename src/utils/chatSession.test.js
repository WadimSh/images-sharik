import {
  buildChatSessionTitleFromPrompt,
  normalizeChatSessionTitle,
  CHAT_SESSION_TITLE_MAX_LENGTH,
} from './chatSession';

describe('chatSession', () => {
  test('normalizeChatSessionTitle trims and limits length', () => {
    expect(normalizeChatSessionTitle('  Привет  ')).toBe('Привет');
    expect(normalizeChatSessionTitle('x'.repeat(CHAT_SESSION_TITLE_MAX_LENGTH + 10))).toHaveLength(
      CHAT_SESSION_TITLE_MAX_LENGTH
    );
  });

  test('buildChatSessionTitleFromPrompt falls back to default title', () => {
    expect(buildChatSessionTitleFromPrompt('  Первый промпт  ')).toBe('Первый промпт');
    expect(buildChatSessionTitleFromPrompt('   ')).toBe('Новый чат');
  });
});
