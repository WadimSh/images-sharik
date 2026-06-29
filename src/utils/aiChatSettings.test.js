import {
  getImageQualityOptionsForModel,
  getImageSizeOptionsForModel,
  modelSupportsImageQuality,
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

  test('seedream models expose resolution options and no quality', () => {
    expect(getImageSizeOptionsForModel({ output_name: 'seedream-4.0', ai: 'ByteDance' }).map((o) => o.value)).toEqual([
      '1K',
      '2K',
      '4K',
    ]);
    expect(modelSupportsImageQuality({ output_name: 'seedream-4.0' })).toBe(false);
    expect(getImageQualityOptionsForModel({ output_name: 'seedream-4.0' })).toEqual([]);
  });

  test('getImageQualityOptionsForModel returns profile-specific qualities', () => {
    expect(getImageQualityOptionsForModel({ output_name: 'gpt-5-mini', ai: 'OpenAI' }).map((o) => o.value)).toEqual([
      'auto',
      'low',
      'medium',
      'high',
    ]);
    expect(getImageQualityOptionsForModel({ output_name: 'alice-ai', ai: 'YandexGPT' }).map((o) => o.value)).toEqual([
      'auto',
      'low',
      'medium',
      'high',
    ]);
    expect(getImageQualityOptionsForModel({ output_name: 'alice-ai-art', ai: 'YandexGPT' })).toEqual([]);
  });
});
