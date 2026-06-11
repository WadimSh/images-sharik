import { canvasPointToRenderedCanvasPoint } from './canvasPointTransform';
import { getRotatedBoundingSize } from './editorMath';

const clampCropRect = (rect, imageWidth, imageHeight) => {
  const x1 = Math.max(0, rect.x);
  const y1 = Math.max(0, rect.y);
  const x2 = Math.min(imageWidth, rect.x + rect.w);
  const y2 = Math.min(imageHeight, rect.y + rect.h);

  return {
    x: x1,
    y: y1,
    w: Math.max(0, x2 - x1),
    h: Math.max(0, y2 - y1),
  };
};

const mapCanvasPointToRenderedSpace = (point, params) => (
  canvasPointToRenderedCanvasPoint(
    point,
    params.imageWidth,
    params.imageHeight,
    params.canvasWidth,
    params.canvasHeight,
    params.zoom,
    params.panOffset,
    params.rotation,
    params.flipX,
    params.flipY
  )
);

export const mapCropRectToImageSpace = (params) => {
  const { cropRect, imageWidth, imageHeight } = params;

  if (cropRect.w <= 0 || cropRect.h <= 0) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }

  const transformParams = {
    imageWidth: params.imageWidth,
    imageHeight: params.imageHeight,
    canvasWidth: params.canvasWidth,
    canvasHeight: params.canvasHeight,
    zoom: params.zoom,
    panOffset: params.panOffset,
    rotation: params.rotation,
    flipX: params.flipX,
    flipY: params.flipY,
  };

  const corners = [
    { x: cropRect.x, y: cropRect.y },
    { x: cropRect.x + cropRect.w, y: cropRect.y },
    { x: cropRect.x + cropRect.w, y: cropRect.y + cropRect.h },
    { x: cropRect.x, y: cropRect.y + cropRect.h },
  ];

  const mappedCorners = corners.map((corner) =>
    mapCanvasPointToRenderedSpace(corner, transformParams)
  );

  const minX = Math.min(...mappedCorners.map((point) => point.x));
  const maxX = Math.max(...mappedCorners.map((point) => point.x));
  const minY = Math.min(...mappedCorners.map((point) => point.y));
  const maxY = Math.max(...mappedCorners.map((point) => point.y));

  const renderedSize = getRotatedBoundingSize(imageWidth, imageHeight, params.rotation);

  return clampCropRect(
    {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
    },
    renderedSize.width,
    renderedSize.height
  );
};
