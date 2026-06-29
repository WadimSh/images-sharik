import {
  buildMitupImageAiParams,
  detectImageParamProfile,
  getImageQualityOptionsForModel,
  getImageSizeOptionsForModel,
  getMitupModelApiId,
  modelSupportsImageQuality,
  normalizeImageSettingsForModel,
} from './mitupImageParams';

describe('mitupImageParams', () => {
  test('getMitupModelApiId prefers model slug over output_name', () => {
    expect(
      getMitupModelApiId({
        output_name: 'Gemini 3 Pro Image',
        model: 'gemini-3-pro-image',
      })
    ).toBe('gemini-3-pro-image');
  });

  test('gemini-2.5-flash-image supports Mitup aspect ratios and 1K only', () => {
    const model = { output_name: 'gemini-2.5-flash-image' };
    expect(getImageSizeOptionsForModel(model).map((option) => option.value)).toEqual([
      '1:1',
      '2:3',
      '3:2',
      '3:4',
      '4:3',
      '4:5',
      '5:4',
      '9:16',
      '16:9',
      '21:9',
    ]);
    expect(getImageQualityOptionsForModel(model).map((option) => option.value)).toEqual(['1K']);
    expect(
      buildMitupImageAiParams(model, { imageSize: '2:3', imageQuality: '2K' })
    ).toEqual({
      image_size: '2:3',
      image_quality: '1K',
    });
  });

  test('gemini-3-pro-image supports 1K, 2K and 4K quality', () => {
    expect(getImageQualityOptionsForModel({ output_name: 'gemini-3-pro-image' }).map((o) => o.value)).toEqual([
      '1K',
      '2K',
      '4K',
    ]);
    expect(
      buildMitupImageAiParams(
        { output_name: 'gemini-3-pro-image' },
        { imageSize: '16:9', imageQuality: '4K' }
      )
    ).toEqual({
      image_size: '16:9',
      image_quality: '4K',
    });
  });

  test('gemini-3.1-flash-image includes extended aspect ratios', () => {
    expect(getImageSizeOptionsForModel({ output_name: 'gemini-3.1-flash-image' }).map((o) => o.value)).toEqual([
      '1:1',
      '1:4',
      '1:8',
      '2:3',
      '3:2',
      '3:4',
      '4:1',
      '4:3',
      '4:5',
      '5:4',
      '8:1',
      '9:16',
      '16:9',
      '21:9',
    ]);
  });

  test('gemini models use aspect ratio and uppercase quality', () => {
    expect(detectImageParamProfile({ output_name: 'gemini-3-pro-image' })).toBe('gemini');
    expect(
      buildMitupImageAiParams(
        { output_name: 'gemini-3-pro-image' },
        { imageSize: '1:1', imageQuality: '2K' }
      )
    ).toEqual({
      image_size: '1:1',
      image_quality: '2K',
    });
  });

  test('seedream-4.0 sends resolution in image_size without image_quality', () => {
    expect(
      getImageSizeOptionsForModel({ output_name: 'seedream-4.0', ai: 'ByteDance' }).map((o) => o.value)
    ).toEqual(['1K', '2K', '4K']);
    expect(modelSupportsImageQuality({ output_name: 'seedream-4.0' })).toBe(false);
    expect(getImageQualityOptionsForModel({ output_name: 'seedream-4.0' })).toEqual([]);
    expect(
      buildMitupImageAiParams(
        { output_name: 'seedream-4.0', ai: 'ByteDance' },
        { imageSize: '2K', imageQuality: '1k' }
      )
    ).toEqual({
      image_size: '2K',
    });
  });

  test('seedream-4.5 supports 2K and 4K only', () => {
    expect(
      getImageSizeOptionsForModel({ output_name: 'seedream-4.5', ai: 'ByteDance' }).map((o) => o.value)
    ).toEqual(['2K', '4K']);
    expect(
      buildMitupImageAiParams(
        { output_name: 'seedream-4.5', ai: 'ByteDance' },
        { imageSize: '4K' }
      )
    ).toEqual({
      image_size: '4K',
    });
  });

  test('seedream-5.0-lite supports 2K, 3K and 4K', () => {
    expect(
      getImageSizeOptionsForModel({ output_name: 'seedream-5.0-lite', ai: 'ByteDance' }).map((o) => o.value)
    ).toEqual(['2K', '3K', '4K']);
    expect(
      buildMitupImageAiParams(
        { output_name: 'seedream-5.0-lite', ai: 'ByteDance' },
        { imageSize: '3K' }
      )
    ).toEqual({
      image_size: '3K',
    });
  });

  test('grok-imagine uses auto ratios and lowercase 1k/2k quality', () => {
    expect(
      getImageSizeOptionsForModel({ output_name: 'grok-imagine', ai: 'Grok' }).map((o) => o.value)
    ).toEqual([
      'auto',
      '1:1',
      '2:1',
      '1:2',
      '3:2',
      '2:3',
      '3:4',
      '4:3',
      '16:9',
      '9:16',
      '20:9',
      '9:20',
    ]);
    expect(
      buildMitupImageAiParams(
        { output_name: 'grok-imagine-quality', ai: 'Grok' },
        { imageSize: '20:9', imageQuality: '2K' }
      )
    ).toEqual({
      image_size: '20:9',
      image_quality: '2k',
    });
  });

  test('openai chat models use pixel sizes and auto/low/medium/high quality', () => {
    expect(
      getImageSizeOptionsForModel({ output_name: 'gpt-5-mini', ai: 'OpenAI' }).map((o) => o.value)
    ).toEqual(['auto', '1024x1024', '1536x1024', '1024x1536']);
    expect(
      getImageQualityOptionsForModel({ output_name: 'gpt-5.4-mini', ai: 'OpenAI' }).map((o) => o.value)
    ).toEqual(['auto', 'low', 'medium', 'high']);
    expect(
      buildMitupImageAiParams(
        { output_name: 'gpt-5-mini', ai: 'OpenAI' },
        { imageSize: '1536x1024', imageQuality: 'high' }
      )
    ).toEqual({
      image_size: '1536x1024',
      image_quality: 'high',
    });
  });

  test('gpt-image-2 supports extended pixel sizes', () => {
    expect(detectImageParamProfile({ output_name: 'gpt-image-2', ai: 'OpenAI' })).toBe('openai_image');
    expect(
      getImageSizeOptionsForModel({ output_name: 'gpt-image-2', ai: 'OpenAI' }).map((o) => o.value)
    ).toEqual([
      'auto',
      '1024x1024',
      '1536x1024',
      '1024x1536',
      '2048x2048',
      '2048x1152',
      '3840x2160',
      '2160x3840',
    ]);
    expect(
      buildMitupImageAiParams(
        { output_name: 'gpt-image-2', ai: 'OpenAI' },
        { imageSize: '3840x2160', imageQuality: 'medium' }
      )
    ).toEqual({
      image_size: '3840x2160',
      image_quality: 'medium',
    });
  });

  test('alice-ai-art uses pixel sizes without quality', () => {
    expect(detectImageParamProfile({ output_name: 'alice-ai-art', ai: 'YandexGPT' })).toBe('yandex_art');
    expect(
      getImageSizeOptionsForModel({ output_name: 'alice-ai-art', ai: 'YandexGPT' }).map((o) => o.value)
    ).toEqual(['auto', '1024x1024', '1536x1024', '1024x1536']);
    expect(modelSupportsImageQuality({ output_name: 'alice-ai-art', ai: 'YandexGPT' })).toBe(false);
    expect(
      buildMitupImageAiParams(
        { output_name: 'alice-ai-art', ai: 'YandexGPT' },
        { imageSize: '1536x1024', imageQuality: 'high' }
      )
    ).toEqual({
      image_size: '1536x1024',
    });
  });

  test('alice-ai uses pixel sizes without auto and openai-style quality', () => {
    expect(detectImageParamProfile({ output_name: 'alice-ai', ai: 'YandexGPT' })).toBe('yandex_alice');
    expect(
      getImageSizeOptionsForModel({ output_name: 'alice-ai', ai: 'YandexGPT' }).map((o) => o.value)
    ).toEqual(['1024x1024', '1536x1024', '1024x1536']);
    expect(
      buildMitupImageAiParams(
        { output_name: 'alice-ai', ai: 'YandexGPT' },
        { imageSize: '1024x1536', imageQuality: 'medium' }
      )
    ).toEqual({
      image_size: '1024x1536',
      image_quality: 'medium',
    });
  });

  test('yandex-gpt and alice-ai-flash use auto pixel sizes and quality', () => {
    expect(
      buildMitupImageAiParams(
        { output_name: 'yandex-gpt-pro', ai: 'YandexGPT' },
        { imageSize: 'auto', imageQuality: 'low' }
      )
    ).toEqual({
      image_size: 'auto',
      image_quality: 'low',
    });
    expect(
      buildMitupImageAiParams(
        { output_name: 'alice-ai-flash', ai: 'YandexGPT' },
        { imageSize: '1024x1024', imageQuality: 'auto' }
      )
    ).toEqual({
      image_size: '1024x1024',
      image_quality: 'auto',
    });
  });

  test('gigachat-pro sends no image params', () => {
    expect(detectImageParamProfile({ output_name: 'gigachat-pro', ai: 'GigaChat' })).toBe('no_image_params');
    expect(
      buildMitupImageAiParams(
        { output_name: 'gigachat-pro', ai: 'GigaChat' },
        { imageSize: '1:1', imageQuality: '1K' }
      )
    ).toEqual({});
  });

  test('normalizeImageSettingsForModel drops imageQuality for seedream', () => {
    const settings = normalizeImageSettingsForModel(
      { outputType: 'out_image', imageSize: '1:1', imageQuality: '1k' },
      { output_name: 'seedream-4.0', ai: 'ByteDance' }
    );

    expect(settings.imageSize).toBe('1K');
    expect(settings.imageQuality).toBeUndefined();
  });
});
