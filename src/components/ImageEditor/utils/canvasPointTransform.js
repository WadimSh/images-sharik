const rotatePoint = (x, y, centerX, centerY, angle) => {
  const dx = x - centerX;
  const dy = y - centerY;
  return {
    x: centerX + dx * Math.cos(angle) - dy * Math.sin(angle),
    y: centerY + dx * Math.sin(angle) + dy * Math.cos(angle),
  };
};

/** Inverse of drawImageBase transform: canvas coords → image pixel coords */
export const canvasPointToImagePoint = (
  point,
  imageWidth,
  imageHeight,
  canvasWidth,
  canvasHeight,
  zoom,
  panOffset,
  rotation,
  flipX,
  flipY
) => {
  let x = point.x - (canvasWidth / 2 + panOffset.x);
  let y = point.y - (canvasHeight / 2 + panOffset.y);

  if (rotation !== 0) {
    const angle = (-rotation * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rotatedX = x * cos - y * sin;
    const rotatedY = x * sin + y * cos;
    x = rotatedX;
    y = rotatedY;
  }

  const scaleX = flipX ? -zoom : zoom;
  const scaleY = flipY ? -zoom : zoom;
  x /= scaleX;
  y /= scaleY;

  return {
    x: x + imageWidth / 2,
    y: y + imageHeight / 2,
  };
};

/** Forward transform matching renderTransformedImageCanvas: image coords → rendered canvas coords */
export const imagePointToRenderedCanvasPoint = (
  point,
  imageWidth,
  imageHeight,
  rotation,
  flipX,
  flipY
) => {
  let x = point.x - imageWidth / 2;
  let y = point.y - imageHeight / 2;

  x *= flipX ? -1 : 1;
  y *= flipY ? -1 : 1;

  if (rotation !== 0) {
    const angle = (rotation * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rotatedX = x * cos - y * sin;
    const rotatedY = x * sin + y * cos;
    x = rotatedX;
    y = rotatedY;
  }

  const rad = (rotation * Math.PI) / 180;
  const absCos = Math.abs(Math.cos(rad));
  const absSin = Math.abs(Math.sin(rad));
  const outWidth = imageWidth * absCos + imageHeight * absSin;
  const outHeight = imageWidth * absSin + imageHeight * absCos;

  return {
    x: x + outWidth / 2,
    y: y + outHeight / 2,
  };
};

/** Display canvas coords → coords on renderTransformedImageCanvas output */
export const canvasPointToRenderedCanvasPoint = (
  point,
  imageWidth,
  imageHeight,
  canvasWidth,
  canvasHeight,
  zoom,
  panOffset,
  rotation,
  flipX,
  flipY
) => {
  const imagePoint = canvasPointToImagePoint(
    point,
    imageWidth,
    imageHeight,
    canvasWidth,
    canvasHeight,
    zoom,
    panOffset,
    rotation,
    flipX,
    flipY
  );

  return imagePointToRenderedCanvasPoint(
    imagePoint,
    imageWidth,
    imageHeight,
    rotation,
    flipX,
    flipY
  );
};

export { rotatePoint };
