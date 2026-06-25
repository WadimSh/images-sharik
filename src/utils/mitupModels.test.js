import { isExtensionAllowed, isExtensionListedByMitup } from './mitupModels';

const visionModel = {
  ai: 'Google',
  output_name: 'Gemini Flash',
  out_text: true,
  out_image: false,
  in_text: true,
  in_image: true,
  ext: 'png, jpg, jpeg, bmp, tiff',
};

describe('mitupModels extension checks', () => {
  test('allows webp from library even when Mitup ext omits it', () => {
    expect(isExtensionAllowed(visionModel, 'product.webp')).toBe(true);
    expect(isExtensionListedByMitup(visionModel, 'product.webp')).toBe(false);
  });

  test('allows extensions explicitly listed by Mitup', () => {
    expect(isExtensionAllowed(visionModel, 'photo.png')).toBe(true);
    expect(isExtensionListedByMitup(visionModel, 'photo.png')).toBe(true);
  });

  test('rejects non-image extensions not in library set', () => {
    expect(isExtensionAllowed(visionModel, 'notes.pdf')).toBe(false);
  });

  test('rejects when model does not accept images', () => {
    expect(
      isExtensionAllowed(
        { ...visionModel, in_image: false },
        'photo.webp'
      )
    ).toBe(false);
  });
});
