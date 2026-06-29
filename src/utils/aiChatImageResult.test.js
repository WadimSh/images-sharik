import { getAssistantImageFiles, normalizeAssistantImageFile } from './aiChatImageResult';

describe('aiChatImageResult', () => {
  test('normalizeAssistantImageFile resolves relative media urls', () => {
    expect(
      normalizeAssistantImageFile({
        url: '/media/company/file/photo.png',
        fileName: 'photo.png',
        mimeType: 'image/png',
      })
    ).toEqual({
      url: 'https://mp.sharik.ru/media/company/file/photo.png',
      fileName: 'photo.png',
      mimeType: 'image/png',
    });
  });

  test('getAssistantImageFiles reads result.files from assistant message', () => {
    expect(
      getAssistantImageFiles({
        role: 'assistant',
        result: {
          files: [
            {
              url: 'https://mp.sharik.ru/media/x/y/a.png',
              fileName: 'a.png',
            },
            {
              url: '',
              fileName: 'broken.png',
            },
          ],
        },
      })
    ).toEqual([
      {
        url: 'https://mp.sharik.ru/media/x/y/a.png',
        fileName: 'a.png',
      },
    ]);
  });
});
