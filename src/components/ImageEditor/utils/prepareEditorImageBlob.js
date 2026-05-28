/**
 * Подготавливает blob текущего состояния редактора (трансформации, фильтры, обрезка).
 */
export function getEditorExportDimensions({
  image,
  cropMode,
  cropRect,
  getOriginalImageCoordinates,
}) {
  if (!image) return { width: 0, height: 0 };

  if (cropMode && cropRect.w > 0 && cropRect.h > 0) {
    const originalCrop = getOriginalImageCoordinates(cropRect);

    if (originalCrop && originalCrop.w > 0 && originalCrop.h > 0) {
      return { width: originalCrop.w, height: originalCrop.h };
    }
  }

  return { width: image.width, height: image.height };
}

export async function prepareEditorImageBlob({
  image,
  rotation,
  flipX,
  flipY,
  filterCss,
  cropMode,
  cropRect,
  getOriginalImageCoordinates,
}) {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) throw new Error('Cannot create canvas context');

  tempCanvas.width = image.width;
  tempCanvas.height = image.height;

  tempCtx.save();
  tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
  tempCtx.rotate((rotation * Math.PI) / 180);
  tempCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  tempCtx.filter = filterCss;
  tempCtx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);
  tempCtx.restore();

  let finalCanvas = tempCanvas;

  if (cropMode && cropRect.w > 0 && cropRect.h > 0) {
    const originalCrop = getOriginalImageCoordinates(cropRect);

    if (originalCrop && originalCrop.w > 0 && originalCrop.h > 0) {
      const croppedCanvas = document.createElement('canvas');
      const croppedCtx = croppedCanvas.getContext('2d');
      if (!croppedCtx) throw new Error('Cannot create cropped canvas');

      croppedCanvas.width = originalCrop.w;
      croppedCanvas.height = originalCrop.h;

      croppedCtx.drawImage(
        tempCanvas,
        originalCrop.x, originalCrop.y, originalCrop.w, originalCrop.h,
        0, 0, originalCrop.w, originalCrop.h
      );

      finalCanvas = croppedCanvas;
    }
  }

  const blob = await new Promise((resolve, reject) => {
    finalCanvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('Failed to export image'));
    }, 'image/png');
  });

  return blob;
}
