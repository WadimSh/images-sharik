import { mapCropRectToImageSpace } from './cropCoordinates';

export const calculateFitZoom = (imgWidth, imgHeight, containerWidth, containerHeight) => {
  const widthRatio = containerWidth / imgWidth;
  const heightRatio = containerHeight / imgHeight;
  const fitZoom = Math.min(widthRatio, heightRatio);
  return Math.min(Math.max(fitZoom, 0.1), 1);
};

/** Axis-aligned bounding box of an image rotated by rotationDeg (degrees). */
export const getRotatedBoundingSize = (width, height, rotationDeg) => {
  const rad = (rotationDeg * Math.PI) / 180;
  const absCos = Math.abs(Math.cos(rad));
  const absSin = Math.abs(Math.sin(rad));
  return {
    width: width * absCos + height * absSin,
    height: width * absSin + height * absCos,
  };
};

export const getImageTransformInfo = (
  imageWidth,
  imageHeight,
  canvasWidth,
  canvasHeight,
  zoom,
  panOffset,
  rotation = 0
) => {
  const bounds = getRotatedBoundingSize(imageWidth, imageHeight, rotation);
  const imgDisplayWidth = bounds.width * zoom;
  const imgDisplayHeight = bounds.height * zoom;
  const imgX = (canvasWidth - imgDisplayWidth) / 2 + panOffset.x;
  const imgY = (canvasHeight - imgDisplayHeight) / 2 + panOffset.y;

  return {
    imgX,
    imgY,
    imgDisplayWidth,
    imgDisplayHeight,
    canvasToOriginalScaleX: bounds.width / imgDisplayWidth,
    canvasToOriginalScaleY: bounds.height / imgDisplayHeight,
  };
};

export const getImageDisplayInfo = (
  imageWidth,
  imageHeight,
  canvasWidth,
  canvasHeight,
  zoom,
  panOffset,
  rotation = 0
) => {
  const bounds = getRotatedBoundingSize(imageWidth, imageHeight, rotation);
  const displayWidth = bounds.width * zoom;
  const displayHeight = bounds.height * zoom;

  return {
    displayX: (canvasWidth - displayWidth) / 2 + panOffset.x,
    displayY: (canvasHeight - displayHeight) / 2 + panOffset.y,
    displayWidth,
    displayHeight,
  };
};

export const calculateAspectCropRectByRatio = (
  imageWidth,
  imageHeight,
  canvasWidth,
  canvasHeight,
  zoom,
  panOffset,
  ratio,
  rotation = 0
) => {
  const imgDisplayInfo = getImageDisplayInfo(
    imageWidth,
    imageHeight,
    canvasWidth,
    canvasHeight,
    zoom,
    panOffset,
    rotation
  );

  const maxWidth = Math.min(imgDisplayInfo.displayWidth, canvasWidth);
  const maxHeight = Math.min(imgDisplayInfo.displayHeight, canvasHeight);
  const bounds = getRotatedBoundingSize(imageWidth, imageHeight, rotation);
  const imageRatio = bounds.width / bounds.height;

  let targetWidth;
  let targetHeight;

  if (ratio === null) {
    if (imageRatio >= 1) {
      targetWidth = maxWidth;
      targetHeight = targetWidth / imageRatio;
      if (targetHeight > maxHeight) {
        targetHeight = maxHeight;
        targetWidth = targetHeight * imageRatio;
      }
    } else {
      targetHeight = maxHeight;
      targetWidth = targetHeight * imageRatio;
      if (targetWidth > maxWidth) {
        targetWidth = maxWidth;
        targetHeight = targetWidth / imageRatio;
      }
    }
  } else if (ratio >= 1) {
    targetWidth = maxWidth;
    targetHeight = targetWidth / ratio;
    if (targetHeight > maxHeight) {
      targetHeight = maxHeight;
      targetWidth = targetHeight * ratio;
    }
  } else {
    targetHeight = maxHeight;
    targetWidth = targetHeight * ratio;
    if (targetWidth > maxWidth) {
      targetWidth = maxWidth;
      targetHeight = targetWidth / ratio;
    }
  }

  const centerX = imgDisplayInfo.displayX + imgDisplayInfo.displayWidth / 2;
  const centerY = imgDisplayInfo.displayY + imgDisplayInfo.displayHeight / 2;

  return {
    x: centerX - targetWidth / 2,
    y: centerY - targetHeight / 2,
    w: targetWidth,
    h: targetHeight,
  };
};

export const getRectForOriginalSize = (
  rect,
  imageWidth,
  imageHeight,
  canvasWidth,
  canvasHeight,
  zoom,
  panOffset,
  rotation,
  flipX,
  flipY
) => (
  mapCropRectToImageSpace({
    cropRect: rect,
    imageWidth,
    imageHeight,
    canvasWidth,
    canvasHeight,
    zoom,
    panOffset,
    rotation,
    flipX,
    flipY,
  })
);
