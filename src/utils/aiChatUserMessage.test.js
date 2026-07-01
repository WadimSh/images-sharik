jest.mock('../services/fetch/fetchBase', () => ({
  getApiBaseUrl: () => 'https://mp.sharik.ru',
}));

import {
  buildUserMessageCopyText,
  getUserMessagePromptText,
  getUserMessageResendPayload,
} from './aiChatUserMessage';

describe('aiChatUserMessage', () => {
  test('getUserMessagePromptText returns sanitized user text', () => {
    expect(
      getUserMessagePromptText({
        role: 'user',
        content: { text: '  Привет\nмир  ' },
      })
    ).toBe('Привет\nмир');
  });

  test('buildUserMessageCopyText includes prompt and attachment url', () => {
    expect(
      buildUserMessageCopyText('Красный шар', [
        { url: '/media/company-1/photo.png' },
      ])
    ).toBe('Красный шар\nhttps://mp.sharik.ru/media/company-1/photo.png');
  });

  test('getUserMessageResendPayload returns prompt and attachments', () => {
    expect(
      getUserMessageResendPayload({
        role: 'user',
        content: {
          text: 'Промпт',
          attachments: [{ fileId: '6655a1b2c3d4e5f6a7b8c9d1', fileName: 'photo.png' }],
        },
      })
    ).toEqual({
      prompt: 'Промпт',
      attachments: [{ fileId: '6655a1b2c3d4e5f6a7b8c9d1', fileName: 'photo.png' }],
    });
  });
});
