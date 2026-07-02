import { prepareAssistantMarkdownSection, splitAssistantMessageSections } from './aiChatAssistantSections';

const THINK_OPEN = '<' + 'think' + '>';
const THINK_CLOSE = '<' + '/think>';

describe('aiChatAssistantSections', () => {
  test('returns single answer section when no reasoning marker exists', () => {
    expect(splitAssistantMessageSections('Обычный ответ без размышлений')).toEqual([
      { type: 'answer', content: 'Обычный ответ без размышлений' },
    ]);
  });

  test('splits markdown reasoning section before answer heading', () => {
    expect(
      splitAssistantMessageSections('## Размышления\n\nНужно уточнить детали.\n\n## Ответ\n\nГотовый ответ.')
    ).toEqual([
      { type: 'reasoning', content: 'Нужно уточнить детали.' },
      { type: 'answer', content: 'Готовый ответ.' },
    ]);
  });

  test('splits reasoning section before horizontal rule', () => {
    expect(
      splitAssistantMessageSections('## Размышления\n\nПромежуточные мысли.\n\n---\n\nИтоговый ответ.')
    ).toEqual([
      { type: 'reasoning', content: 'Промежуточные мысли.' },
      { type: 'answer', content: 'Итоговый ответ.' },
    ]);
  });

  test('splits reasoning section labeled Рассуждение:', () => {
    expect(
      splitAssistantMessageSections('Рассуждение:\n\nПроверяю поставщиков.\n\nОтвет:\n\n[{"sku":"A"}]')
    ).toEqual([
      { type: 'reasoning', content: 'Проверяю поставщиков.' },
      { type: 'answer', content: '[{"sku":"A"}]' },
    ]);
  });

  test('splits inline reasoning section labeled Рассуждение:', () => {
    expect(
      splitAssistantMessageSections('Рассуждение: проверяю поставщиков.\n\nОтвет:\n\nГотово.')
    ).toEqual([
      { type: 'reasoning', content: 'проверяю поставщиков.' },
      { type: 'answer', content: 'Готово.' },
    ]);
  });

  test('splits bold reasoning heading with trailing colon', () => {
    expect(
      splitAssistantMessageSections('**Рассуждение:**\n\nСверяю данные.\n\nОтвет:\n\nИтог.')
    ).toEqual([
      { type: 'reasoning', content: 'Сверяю данные.' },
      { type: 'answer', content: 'Итог.' },
    ]);
  });

  test('prepareAssistantMarkdownSection wraps bare json array', () => {
    expect(prepareAssistantMarkdownSection('[{"sku":"A"}]')).toBe('```json\n[{"sku":"A"}]\n```');
  });

  test('prepareAssistantMarkdownSection leaves regular text unchanged', () => {
    expect(prepareAssistantMarkdownSection('Обычный текст')).toBe('Обычный текст');
  });

  test('splits think tag block from main answer', () => {
    const text = [
      'Преамбула.',
      THINK_OPEN,
      'Внутренние мысли.',
      THINK_CLOSE,
      'Финальный ответ.',
    ].join('\n');

    expect(splitAssistantMessageSections(text)).toEqual([
      { type: 'answer', content: 'Преамбула.' },
      { type: 'reasoning', content: 'Внутренние мысли.' },
      { type: 'answer', content: 'Финальный ответ.' },
    ]);
  });
});
