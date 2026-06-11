import { mapCropRectToImageSpace } from './cropCoordinates';
import { getRotatedBoundingSize } from './editorMath';
import { canvasPointToRenderedCanvasPoint } from './canvasPointTransform';

export const renderTransformedImageCanvas = ({
  image,
  rotation = 0,
  flipX = false,
  flipY = false,
  filterCss = 'none',
}) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  const rendered = getRotatedBoundingSize(image.width, image.height, rotation);
  canvas.width = Math.round(rendered.width);
  canvas.height = Math.round(rendered.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  if (filterCss) {
    ctx.filter = filterCss;
  }
  ctx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);
  ctx.restore();

  return canvas;
};

export const cropRenderedImage = (source, cropRect) => {
  if (cropRect.w <= 0 || cropRect.h <= 0) return null;

  const croppedCanvas = document.createElement('canvas');
  const ctx = croppedCanvas.getContext('2d');
  if (!ctx) return null;

  croppedCanvas.width = Math.round(cropRect.w);
  croppedCanvas.height = Math.round(cropRect.h);

  ctx.drawImage(
    source,
    cropRect.x,
    cropRect.y,
    cropRect.w,
    cropRect.h,
    0,
    0,
    croppedCanvas.width,
    croppedCanvas.height
  );

  return croppedCanvas;
};

export const imageFromCanvas = (canvas) => (
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image from canvas'));
    img.src = canvas.toDataURL('image/png');
  })
);

export const cropImageWithTransforms = async ({
  image,
  cropRect,
  canvasWidth,
  canvasHeight,
  zoom,
  panOffset,
  rotation,
  flipX,
  flipY,
  filterCss,
}) => {
  const imageSpaceCrop = mapCropRectToImageSpace({
    cropRect,
    imageWidth: image.width,
    imageHeight: image.height,
    canvasWidth,
    canvasHeight,
    zoom,
    panOffset,
    rotation,
    flipX,
    flipY,
  });

  if (imageSpaceCrop.w <= 0 || imageSpaceCrop.h <= 0) return null;

  const rendered = renderTransformedImageCanvas({
    image,
    rotation,
    flipX,
    flipY,
    filterCss,
  });

  const croppedCanvas = cropRenderedImage(rendered, imageSpaceCrop);
  if (!croppedCanvas) return null;

  return imageFromCanvas(croppedCanvas);
};

const traceLassoPath = (ctx, lassoPoints, toRenderedPoint) => {
  const firstPoint = toRenderedPoint(lassoPoints[0]);
  ctx.moveTo(firstPoint.x, firstPoint.y);

  for (let i = 1; i < lassoPoints.length; i += 1) {
    const point = toRenderedPoint(lassoPoints[i]);
    ctx.lineTo(point.x, point.y);
  }

  ctx.closePath();
};

export const applyLassoCutWithTransforms = async ({
  image,
  lassoPoints,
  canvasWidth,
  canvasHeight,
  zoom,
  panOffset,
  rotation,
  flipX,
  flipY,
  filterCss,
  operation = 'eraseInside',
}) => {
  if (lassoPoints.length < 3) return null;

  const rendered = renderTransformedImageCanvas({
    image,
    rotation,
    flipX,
    flipY,
    filterCss,
  });
  const ctx = rendered.getContext('2d');
  if (!ctx) return null;

  const clamp = (value, max) => Math.max(0, Math.min(value, max));

  const toRenderedPoint = (point) => {
    const renderedPoint = canvasPointToRenderedCanvasPoint(
      point,
      image.width,
      image.height,
      canvasWidth,
      canvasHeight,
      zoom,
      panOffset,
      rotation,
      flipX,
      flipY
    );
    return {
      x: clamp(renderedPoint.x, rendered.width),
      y: clamp(renderedPoint.y, rendered.height),
    };
  };

  ctx.save();
  ctx.beginPath();

  if (operation === 'eraseOutside') {
    ctx.rect(0, 0, rendered.width, rendered.height);
  }

  traceLassoPath(ctx, lassoPoints, toRenderedPoint);
  ctx.clip(operation === 'eraseOutside' ? 'evenodd' : 'nonzero');
  ctx.clearRect(0, 0, rendered.width, rendered.height);
  ctx.restore();

  return imageFromCanvas(rendered);
};
