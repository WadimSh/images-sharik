import {
  AI_CHAT_THINKING_PHRASES,
  AI_IMAGE_THINKING_PHRASES,
  getThinkingPhraseBySeed,
  getThinkingPhraseForMessage,
  pickRandomImageThinkingPhrase,
  pickRandomThinkingPhrase,
} from './aiChatThinkingPhrases';

describe('aiChatThinkingPhrases', () => {
  test('pickRandomThinkingPhrase returns a phrase from the text list', () => {
    const phrase = pickRandomThinkingPhrase();
    expect(AI_CHAT_THINKING_PHRASES).toContain(phrase);
  });

  test('pickRandomImageThinkingPhrase returns a phrase from the image list', () => {
    const phrase = pickRandomImageThinkingPhrase();
    expect(AI_IMAGE_THINKING_PHRASES).toContain(phrase);
  });

  test('getThinkingPhraseBySeed is stable for the same seed', () => {
    expect(getThinkingPhraseBySeed('msg-1')).toBe(getThinkingPhraseBySeed('msg-1'));
    expect(getThinkingPhraseBySeed('msg-2')).not.toBe(getThinkingPhraseBySeed('msg-1'));
  });

  test('getThinkingPhraseBySeed uses image phrases when provided', () => {
    const phrase = getThinkingPhraseBySeed('msg-42', AI_IMAGE_THINKING_PHRASES);
    expect(AI_IMAGE_THINKING_PHRASES).toContain(phrase);
    expect(AI_CHAT_THINKING_PHRASES).not.toContain(phrase);
  });

  test('getThinkingPhraseForMessage prefers explicit phrase', () => {
    expect(
      getThinkingPhraseForMessage({
        id: 'msg-1',
        thinkingPhrase: 'Кастомная фраза…',
      })
    ).toBe('Кастомная фраза…');
  });

  test('getThinkingPhraseForMessage falls back to message id for text', () => {
    expect(getThinkingPhraseForMessage({ id: 'msg-42' })).toBe(
      getThinkingPhraseBySeed('msg-42')
    );
  });

  test('getThinkingPhraseForMessage uses image phrases for out_image generation', () => {
    const phrase = getThinkingPhraseForMessage({
      id: 'msg-42',
      generation: { type: 'out_image' },
    });

    expect(AI_IMAGE_THINKING_PHRASES).toContain(phrase);
    expect(AI_CHAT_THINKING_PHRASES).not.toContain(phrase);
  });
});
