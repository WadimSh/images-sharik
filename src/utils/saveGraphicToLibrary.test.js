import { uploadGraphicFile } from '../services/mediaService';
import {
  buildUploadFileFromBlob,
  fetchImageBlobFromUrl,
  uploadGraphicToLibrary,
} from './saveGraphicToLibrary';

jest.mock('../services/mediaService', () => ({
  uploadGraphicFile: jest.fn(),
}));

describe('saveGraphicToLibrary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('fetchImageBlobFromUrl downloads image blob', async () => {
    const blob = new Blob(['png'], { type: 'image/png' });
    global.fetch.mockResolvedValue({
      ok: true,
      blob: async () => blob,
    });

    await expect(fetchImageBlobFromUrl('https://example.com/image.png')).resolves.toEqual(blob);
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/image.png', {
      credentials: 'include',
    });
  });

  test('buildUploadFileFromBlob keeps webp file as-is', async () => {
    const webpBlob = new Blob(['webp'], { type: 'image/webp' });
    const file = await buildUploadFileFromBlob(webpBlob, 'generated.webp');

    expect(file.type).toBe('image/webp');
    expect(file.name).toBe('generated.webp');
  });

  test('uploadGraphicToLibrary uploads file with tags', async () => {
    const webpBlob = new Blob(['webp'], { type: 'image/webp' });
    uploadGraphicFile.mockResolvedValue({ success: true });

    await uploadGraphicToLibrary({
      companyId: 'company-1',
      blob: webpBlob,
      finalFileName: 'ai-image.webp',
      tags: ['tag-1'],
    });

    expect(uploadGraphicFile).toHaveBeenCalledWith(
      'company-1',
      expect.objectContaining({
        type: 'image/webp',
        name: 'ai-image.webp',
      }),
      null,
      ['tag-1']
    );
  });
});
