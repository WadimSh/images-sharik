import { editorHistoryDB } from '../../../utils/handleDB';
import { loadImageFromBlob } from './loadImageFromBlob';

export const MAX_EDITOR_HISTORY = 30;

export function createDefaultAdjustments() {
  return {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    temperature: 0,
    vignette: 0,
  };
}

export function buildHistoryState(snapshotId, state) {
  return {
    snapshotId,
    rotation: state.rotation,
    zoom: state.zoom,
    baseZoom: state.baseZoom ?? state.zoom,
    flipX: state.flipX,
    flipY: state.flipY,
    activeFilter: state.activeFilter,
    adjustments: { ...state.adjustments },
    cropRect: { ...state.cropRect },
    cropMode: state.cropMode,
    aspectCropRect: { ...state.aspectCropRect },
    aspectCropMode: state.aspectCropMode,
    selectedAspectRatio: state.selectedAspectRatio,
    panOffset: { ...(state.panOffset || { x: 0, y: 0 }) },
    lassoMode: state.lassoMode ?? false,
  };
}

export function areHistoryStatesEqual(a, b) {
  if (!a || !b) return false;

  return (
    a.snapshotId === b.snapshotId &&
    a.rotation === b.rotation &&
    a.zoom === b.zoom &&
    a.baseZoom === b.baseZoom &&
    a.flipX === b.flipX &&
    a.flipY === b.flipY &&
    a.activeFilter === b.activeFilter &&
    JSON.stringify(a.adjustments) === JSON.stringify(b.adjustments) &&
    JSON.stringify(a.cropRect) === JSON.stringify(b.cropRect) &&
    a.cropMode === b.cropMode &&
    JSON.stringify(a.aspectCropRect) === JSON.stringify(b.aspectCropRect) &&
    a.aspectCropMode === b.aspectCropMode &&
    a.selectedAspectRatio === b.selectedAspectRatio &&
    JSON.stringify(a.panOffset) === JSON.stringify(b.panOffset) &&
    a.lassoMode === b.lassoMode
  );
}

export async function imageElementToBlob(imageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  ctx.drawImage(imageElement, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create image blob'));
    }, 'image/png');
  });
}

export async function saveImageSnapshot(sessionId, imageElement) {
  const blob = await imageElementToBlob(imageElement);
  return editorHistoryDB.addSnapshot(sessionId, blob);
}

export async function loadSnapshotImage(snapshotId) {
  const record = await editorHistoryDB.getSnapshot(snapshotId);
  if (!record?.blob) {
    throw new Error('History snapshot not found');
  }
  return loadImageFromBlob(record.blob);
}

export async function deleteHistorySnapshots(states = []) {
  await Promise.all(
    states
      .filter((state) => state?.snapshotId)
      .map((state) => editorHistoryDB.deleteSnapshot(state.snapshotId))
  );
}

export function createInitialHistoryState(snapshotId, fitZoom) {
  return buildHistoryState(snapshotId, {
    rotation: 0,
    zoom: fitZoom,
    baseZoom: fitZoom,
    flipX: false,
    flipY: false,
    activeFilter: 'none',
    adjustments: createDefaultAdjustments(),
    cropRect: { x: 0, y: 0, w: 0, h: 0 },
    cropMode: false,
    aspectCropRect: { x: 0, y: 0, w: 0, h: 0 },
    aspectCropMode: false,
    selectedAspectRatio: 'original',
    panOffset: { x: 0, y: 0 },
    lassoMode: false,
  });
}

export function createImageMutationStateOverrides(fitZoom) {
  return {
    rotation: 0,
    flipX: false,
    flipY: false,
    cropMode: false,
    aspectCropMode: false,
    lassoMode: false,
    cropRect: { x: 0, y: 0, w: 0, h: 0 },
    aspectCropRect: { x: 0, y: 0, w: 0, h: 0 },
    panOffset: { x: 0, y: 0 },
    zoom: fitZoom,
    baseZoom: fitZoom,
  };
}
