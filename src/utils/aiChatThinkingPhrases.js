export const AI_CHAT_THINKING_PHRASES = [
  'Хороший вопрос, надо подумать',
  'Ну ты спросил, сейчас скажу',
  'Да, это важно знать, минуточку',
  'Что-то я уже слышал про это, надо уточнить',
  'Очень актуальная тема, постараюсь быстро ответить',
  'Непростой вопрос, сейчас разберусь',
  'Тема интересная, готовлю ответ',
  'Секунду, собираю мысли в кучу',
  'Хороший повод всё проверить, момент',
  'Сейчас посмотрю, что можно сказать по делу',
  'Запрос принят, формулирую ответ',
  'Дайте подумать — хочется ответить точно',
];

/**
 * @returns {string}
 */
export function pickRandomThinkingPhrase() {
  const index = Math.floor(Math.random() * AI_CHAT_THINKING_PHRASES.length);
  return AI_CHAT_THINKING_PHRASES[index];
}

/**
 * @param {string} seed
 * @returns {string}
 */
export function getThinkingPhraseBySeed(seed) {
  if (!seed) {
    return pickRandomThinkingPhrase();
  }

  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return AI_CHAT_THINKING_PHRASES[hash % AI_CHAT_THINKING_PHRASES.length];
}

/**
 * @param {object|null|undefined} message
 * @returns {string}
 */
export function getThinkingPhraseForMessage(message) {
  const explicitPhrase = message?.thinkingPhrase ?? message?.meta?.thinkingPhrase;
  if (explicitPhrase) {
    return String(explicitPhrase);
  }

  const messageId = message?.id || message?._id;
  if (messageId) {
    return getThinkingPhraseBySeed(String(messageId));
  }

  return pickRandomThinkingPhrase();
}
