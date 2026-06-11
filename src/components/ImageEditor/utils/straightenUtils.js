import { imageFromCanvas, renderTransformedImageCanvas } from './cropImageProcessing';

export const STRAIGHTEN_MIN_ANGLE = -45;
export const STRAIGHTEN_MAX_ANGLE = 45;

export const computeStraightenScale = (width, height, angleDeg) => {
  if (width <= 0 || height <= 0 || angleDeg === 0) {
    return 1;
  }

  const rad = Math.abs((angleDeg * Math.PI) / 180);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return Math.max(
    (width * cos + height * sin) / width,
    (width * sin + height * cos) / height
  );
};

export const clampStraightenAngle = (angle) => (
  Math.max(STRAIGHTEN_MIN_ANGLE, Math.min(STRAIGHTEN_MAX_ANGLE, angle))
);

export const applyStraightenToImage = async ({
  image,
  angleDeg,
  rotation,
  flipX,
  flipY,
  filterCss,
}) => {
  const source = renderTransformedImageCanvas({
    image,
    rotation,
    flipX,
    flipY,
    filterCss,
  });

  const { width, height } = source;
  const scale = computeStraightenScale(width, height, angleDeg);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  canvas.width = width;
  canvas.height = height;

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((angleDeg * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.drawImage(source, -width / 2, -height / 2, width, height);
  ctx.restore();

  return imageFromCanvas(canvas);
};

export const getImageBoundsCornersOnCanvas = (
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
  const localCorners = [
    { x: -imageWidth / 2, y: -imageHeight / 2 },
    { x: imageWidth / 2, y: -imageHeight / 2 },
    { x: imageWidth / 2, y: imageHeight / 2 },
    { x: -imageWidth / 2, y: imageHeight / 2 },
  ];

  const cx = canvasWidth / 2 + panOffset.x;
  const cy = canvasHeight / 2 + panOffset.y;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const scaleX = flipX ? -zoom : zoom;
  const scaleY = flipY ? -zoom : zoom;

  return localCorners.map(({ x, y }) => {
    const sx = x * scaleX;
    const sy = y * scaleY;
    return {
      x: cx + sx * cos - sy * sin,
      y: cy + sx * sin + sy * cos,
    };
  });
};

const STRAIGHTEN_GRID_DIVISIONS = 8;

/** Screen-aligned guide grid for straighten mode (preview only, not baked into export). */
export const drawStraightenGridOverlay = (ctx, boundsCorners) => {
  if (boundsCorners.length < 3) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(boundsCorners[0].x, boundsCorners[0].y);
  for (let i = 1; i < boundsCorners.length; i += 1) {
    ctx.lineTo(boundsCorners[i].x, boundsCorners[i].y);
  }
  ctx.closePath();
  ctx.clip();

  const minX = Math.min(...boundsCorners.map((c) => c.x));
  const maxX = Math.max(...boundsCorners.map((c) => c.x));
  const minY = Math.min(...boundsCorners.map((c) => c.y));
  const maxY = Math.max(...boundsCorners.map((c) => c.y));
  const boundsWidth = maxX - minX;
  const boundsHeight = maxY - minY;

  if (boundsWidth <= 0 || boundsHeight <= 0) {
    ctx.restore();
    return;
  }

  ctx.lineWidth = 1;
  ctx.setLineDash([]);

  for (let i = 1; i < STRAIGHTEN_GRID_DIVISIONS; i += 1) {
    const isMajor = i === STRAIGHTEN_GRID_DIVISIONS / 2;
    ctx.strokeStyle = isMajor
      ? 'rgba(255, 255, 255, 0.72)'
      : 'rgba(255, 255, 255, 0.38)';

    const y = minY + (boundsHeight * i) / STRAIGHTEN_GRID_DIVISIONS;
    ctx.beginPath();
    ctx.moveTo(minX, y + 0.5);
    ctx.lineTo(maxX, y + 0.5);
    ctx.stroke();

    const x = minX + (boundsWidth * i) / STRAIGHTEN_GRID_DIVISIONS;
    ctx.beginPath();
    ctx.moveTo(x + 0.5, minY);
    ctx.lineTo(x + 0.5, maxY);
    ctx.stroke();
  }

  ctx.restore();
};
