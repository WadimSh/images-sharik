import {
  MITUP_MAX_ATTACHMENT_BYTES,
  normalizeMongoFileId,
  sanitizeChatAttachment,
  sanitizeChatAttachments,
  serializeChatAttachmentsForApi,
  validateChatAttachments,
  validateAttachmentSize,
  parseAttachmentSizeBytes,
  formatOversizedAttachmentMessage,
  isAttachmentWithinSizeLimit,
  resolveAttachmentPreviewUrl,
  getMessageAttachments,
} from './chatAttachment';

describe('chatAttachment', () => {
  test('normalizeMongoFileId accepts 24-char hex string', () => {
    expect(normalizeMongoFileId('6655a1b2c3d4e5f6a7b8c9d1')).toBe('6655a1b2c3d4e5f6a7b8c9d1');
  });

  test('normalizeMongoFileId extracts nested _id', () => {
    expect(
      normalizeMongoFileId({
        _id: '6655a1b2c3d4e5f6a7b8c9d1',
        fileName: 'photo.png',
      })
    ).toBe('6655a1b2c3d4e5f6a7b8c9d1');
  });

  test('normalizeMongoFileId rejects invalid values', () => {
    expect(normalizeMongoFileId('123')).toBeNull();
    expect(normalizeMongoFileId(null)).toBeNull();
    expect(normalizeMongoFileId({ foo: 'bar' })).toBeNull();
  });

  test('sanitizeChatAttachment keeps only allowed fields', () => {
    expect(
      sanitizeChatAttachment({
        fileId: '6655a1b2c3d4e5f6a7b8c9d1',
        fileName: 'photo.png',
        url: 'https://mp.sharik.ru/media/x/y/photo.png',
        mimeType: 'image/png',
        size: 1024,
        extra: 'ignored',
      })
    ).toEqual({
      fileId: '6655a1b2c3d4e5f6a7b8c9d1',
      fileName: 'photo.png',
      url: 'https://mp.sharik.ru/media/x/y/photo.png',
      mimeType: 'image/png',
      sizeBytes: 1024,
    });
  });

  test('validateAttachmentSize rejects files over Mitup limit', () => {
    expect(validateAttachmentSize(MITUP_MAX_ATTACHMENT_BYTES)).toBeNull();
    expect(validateAttachmentSize(MITUP_MAX_ATTACHMENT_BYTES + 1)).toMatch(/слишком большой/);
  });

  test('validateChatAttachments rejects oversized attachment', () => {
    expect(
      validateChatAttachments([
        {
          fileId: '6655a1b2c3d4e5f6a7b8c9d1',
          sizeBytes: MITUP_MAX_ATTACHMENT_BYTES + 1,
        },
      ])
    ).toMatch(/слишком большой/);
  });

  test('parseAttachmentSizeBytes and isAttachmentWithinSizeLimit', () => {
    expect(parseAttachmentSizeBytes('2048')).toBe(2048);
    expect(parseAttachmentSizeBytes('bad')).toBeNull();
    expect(isAttachmentWithinSizeLimit(MITUP_MAX_ATTACHMENT_BYTES)).toBe(true);
    expect(isAttachmentWithinSizeLimit(MITUP_MAX_ATTACHMENT_BYTES + 1)).toBe(false);
    expect(isAttachmentWithinSizeLimit(null)).toBe(true);
  });

  test('formatOversizedAttachmentMessage includes human-readable sizes', () => {
    expect(formatOversizedAttachmentMessage(6 * 1024 * 1024)).toMatch(/6 МБ/);
    expect(formatOversizedAttachmentMessage(6 * 1024 * 1024)).toMatch(/5 МБ/);
  });

  test('serializeChatAttachmentsForApi omits sizeBytes for studio API', () => {
    expect(
      serializeChatAttachmentsForApi([
        {
          fileId: '6655a1b2c3d4e5f6a7b8c9d1',
          fileName: 'photo.webp',
          url: 'https://mp.sharik.ru/media/x/y/photo.webp',
          mimeType: 'image/webp',
          sizeBytes: 164288,
        },
      ])
    ).toEqual([
      {
        fileId: '6655a1b2c3d4e5f6a7b8c9d1',
        fileName: 'photo.webp',
        url: 'https://mp.sharik.ru/media/x/y/photo.webp',
        mimeType: 'image/webp',
      },
    ]);
  });

  test('validateChatAttachments detects invalid attachment id', () => {
    expect(
      validateChatAttachments([{ fileId: { _id: '6655a1b2c3d4e5f6a7b8c9d1' } }])
    ).toBeNull();

    expect(validateChatAttachments([{ fileId: 'not-an-object-id' }])).toMatch(
      /Некорректный файл вложения/
    );
  });

  test('sanitizeChatAttachments filters invalid entries', () => {
    expect(
      sanitizeChatAttachments([
        { fileId: '6655a1b2c3d4e5f6a7b8c9d1', fileName: 'a.png' },
        { fileId: 'bad' },
      ])
    ).toEqual([{ fileId: '6655a1b2c3d4e5f6a7b8c9d1', fileName: 'a.png' }]);
  });

  test('resolveAttachmentPreviewUrl prefixes relative media paths', () => {
    expect(resolveAttachmentPreviewUrl('/media/company/file/photo.webp')).toBe(
      'https://mp.sharik.ru/media/company/file/photo.webp'
    );
  });

  test('getMessageAttachments reads user message content', () => {
    expect(
      getMessageAttachments({
        content: {
          text: 'Привет',
          attachments: [{ fileId: '6655a1b2c3d4e5f6a7b8c9d1', fileName: 'photo.webp' }],
        },
      })
    ).toEqual([{ fileId: '6655a1b2c3d4e5f6a7b8c9d1', fileName: 'photo.webp' }]);
  });
});
