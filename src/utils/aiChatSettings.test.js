import {
  getImageQualityOptionsForModel,
  getImageSizeOptionsForModel,
  normalizeImageSettingsForModel,
} from './mitupImageParams';

describe('aiChatSettings image params', () => {
  test('normalizeImageSettingsForModel maps legacy values for gemini-3-pro-image', () => {
    const settings = normalizeImageSettingsForModel(
      {
        outputType: 'out_image',
        model: 'gemini-3-pro-image',
        imageSize: '1024x1024',
        imageQuality: 'standard',
      },
      { output_name: 'gemini-3-pro-image', out_image: true }
    );

    expect(settings.imageSize).toBe('1:1');
    expect(settings.imageQuality).toBe('1K');
  });

  test('getImageSizeOptionsForModel returns pixel sizes for gpt-image models', () => {
    const options = getImageSizeOptionsForModel({ output_name: 'gpt-image-2' });
    expect(options.some((option) => option.value === '1024x1024')).toBe(true);
  });

  test('getImageQualityOptionsForModel returns uppercase qualities for gemini pro image', () => {
    const options = getImageQualityOptionsForModel({ output_name: 'gemini-3-pro-image' });
    expect(options.map((option) => option.value)).toEqual(['1K', '2K', '4K']);
  });
});
