/**
 * Подготавливает blob текущего состояния редактора (трансформации, фильтры, обрезка).
 */

import { getRotatedBoundingSize } from './editorMath';
import { renderTransformedImageCanvas, cropRenderedImage } from './cropImageProcessing';

export function getEditorExportDimensions({
  image,
  cropMode,
  cropRect,
  aspectCropMode,
  aspectCropRect,
  rotation = 0,
  resolveCropRectOnTransformedCanvas,
}) {
  if (!image) return { width: 0, height: 0 };

  const activeCropRect = cropMode && cropRect?.w > 0 && cropRect?.h > 0
    ? cropRect
    : aspectCropMode && aspectCropRect?.w > 0 && aspectCropRect?.h > 0
      ? aspectCropRect
      : null;

  if (activeCropRect && resolveCropRectOnTransformedCanvas) {
    const mappedCrop = resolveCropRectOnTransformedCanvas(activeCropRect);
    if (mappedCrop?.w > 0 && mappedCrop?.h > 0) {
      return {
        width: Math.round(mappedCrop.w),
        height: Math.round(mappedCrop.h),
      };
    }
  }

  const bounds = getRotatedBoundingSize(image.width, image.height, rotation);
  return {
    width: Math.round(bounds.width),
    height: Math.round(bounds.height),
  };
}

export async function prepareEditorImageBlob({
  image,
  rotation,
  flipX,
  flipY,
  filterCss,
  cropMode,
  cropRect,
  aspectCropMode,
  aspectCropRect,
  resolveCropRectOnTransformedCanvas,
  mimeType = 'image/png',
  quality,
}) {
  const transformedCanvas = renderTransformedImageCanvas({
    image,
    rotation,
    flipX,
    flipY,
    filterCss,
  });

  let finalCanvas = transformedCanvas;

  const activeCropRect = cropMode && cropRect?.w > 0 && cropRect?.h > 0
    ? cropRect
    : aspectCropMode && aspectCropRect?.w > 0 && aspectCropRect?.h > 0
      ? aspectCropRect
      : null;

  if (activeCropRect && resolveCropRectOnTransformedCanvas) {
    const mappedCrop = resolveCropRectOnTransformedCanvas(activeCropRect);

    if (mappedCrop?.w > 0 && mappedCrop?.h > 0) {
      const croppedCanvas = cropRenderedImage(transformedCanvas, mappedCrop);
      if (croppedCanvas) {
        finalCanvas = croppedCanvas;
      }
    }
  }

  const blob = await new Promise((resolve, reject) => {
    finalCanvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Failed to export image'));
      },
      mimeType,
      quality
    );
  });

  return blob;
}
