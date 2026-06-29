import {
  buildMitupImageAiParams,
  detectImageParamProfile,
  getMitupModelApiId,
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

  test('detectImageParamProfile recognizes gemini-3-pro-image', () => {
    expect(detectImageParamProfile({ output_name: 'gemini-3-pro-image' })).toBe(
      'gemini_pro_resolution'
    );
  });

  test('buildMitupImageAiParams maps gemini-3-pro-image quality to uppercase', () => {
    expect(
      buildMitupImageAiParams(
        { output_name: 'gemini-3-pro-image' },
        { imageSize: '1:1', imageQuality: '1k' }
      )
    ).toEqual({
      image_size: '1:1',
      image_quality: '1K',
    });
  });

  test('buildMitupImageAiParams keeps openai pixel params', () => {
    expect(
      buildMitupImageAiParams(
        { output_name: 'gpt-image-2' },
        { imageSize: '1024x1024', imageQuality: 'hd' }
      )
    ).toEqual({
      image_size: '1024x1024',
      image_quality: 'hd',
    });
  });

  test('normalizeImageSettingsForModel switches quality options per model', () => {
    const settings = normalizeImageSettingsForModel(
      {
        outputType: 'out_image',
        imageSize: '1024x1024',
        imageQuality: 'standard',
      },
      { output_name: 'gemini-3-pro-image' }
    );

    expect(settings.imageSize).toBe('1:1');
    expect(settings.imageQuality).toBe('1K');
  });
});
