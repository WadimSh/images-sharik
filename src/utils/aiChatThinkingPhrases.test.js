import {
  AI_CHAT_THINKING_PHRASES,
  getThinkingPhraseBySeed,
  getThinkingPhraseForMessage,
  pickRandomThinkingPhrase,
} from './aiChatThinkingPhrases';

describe('aiChatThinkingPhrases', () => {
  test('pickRandomThinkingPhrase returns a phrase from the list', () => {
    const phrase = pickRandomThinkingPhrase();
    expect(AI_CHAT_THINKING_PHRASES).toContain(phrase);
  });

  test('getThinkingPhraseBySeed is stable for the same seed', () => {
    expect(getThinkingPhraseBySeed('msg-1')).toBe(getThinkingPhraseBySeed('msg-1'));
    expect(getThinkingPhraseBySeed('msg-2')).not.toBe(getThinkingPhraseBySeed('msg-1'));
  });

  test('getThinkingPhraseForMessage prefers explicit phrase', () => {
    expect(
      getThinkingPhraseForMessage({
        id: 'msg-1',
        thinkingPhrase: 'Кастомная фраза…',
      })
    ).toBe('Кастомная фраза…');
  });

  test('getThinkingPhraseForMessage falls back to message id', () => {
    expect(getThinkingPhraseForMessage({ id: 'msg-42' })).toBe(
      getThinkingPhraseBySeed('msg-42')
    );
  });
});
