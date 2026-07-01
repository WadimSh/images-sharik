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

export const AI_IMAGE_THINKING_PHRASES = [
  'Набираю краски на палитру',
  'Сейчас будет красиво, настраиваю фокус',
  'Фантазия включена, переношу на холст',
  'Затачиваю пиксели, момент',
  'Навожу резкость и добавляю магии',
  'Ищу идеальный свет для этого кадра',
  'Смешиваю цвета, чтобы было сочно',
  'Дорисовываю детали, не мешайте вдохновению',
  'Перевожу ваши слова в картинку',
  'Подумать над композицией, сейчас сделаю',
  'Добавляю контраст и убираю лишнее',
  'Обрабатываю запрос кистью и нейросетью',
];

/**
 * @param {readonly string[]} phrases
 * @returns {string}
 */
export function pickRandomPhraseFromList(phrases) {
  const index = Math.floor(Math.random() * phrases.length);
  return phrases[index];
}

/**
 * @returns {string}
 */
export function pickRandomThinkingPhrase() {
  return pickRandomPhraseFromList(AI_CHAT_THINKING_PHRASES);
}

/**
 * @returns {string}
 */
export function pickRandomImageThinkingPhrase() {
  return pickRandomPhraseFromList(AI_IMAGE_THINKING_PHRASES);
}

/**
 * @param {string} seed
 * @param {readonly string[]} [phrases=AI_CHAT_THINKING_PHRASES]
 * @returns {string}
 */
export function getThinkingPhraseBySeed(seed, phrases = AI_CHAT_THINKING_PHRASES) {
  if (!seed) {
    return pickRandomPhraseFromList(phrases);
  }

  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return phrases[hash % phrases.length];
}

/**
 * @param {object|null|undefined} message
 * @returns {readonly string[]}
 */
export function getThinkingPhrasesForMessage(message) {
  return message?.generation?.type === 'out_image'
    ? AI_IMAGE_THINKING_PHRASES
    : AI_CHAT_THINKING_PHRASES;
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

  const phrases = getThinkingPhrasesForMessage(message);
  const messageId = message?.id || message?._id;
  if (messageId) {
    return getThinkingPhraseBySeed(String(messageId), phrases);
  }

  return pickRandomPhraseFromList(phrases);
}
