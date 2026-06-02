import { useState, useCallback, useRef } from 'react';
import { prepareEditorImageBlob } from './utils/prepareEditorImageBlob';
import { loadImageFromBlob } from './utils/loadImageFromBlob';
import {
  removeBackground,
  IMPROVEMENT_HANDLERS,
} from './services/photoroomService';
import { EXPAND_MAX_FILE_SIZE, EXPAND_SOURCE_DISABLED_REASON } from './expandConfig';

const ERROR_MESSAGES = {
  background: 'Ошибка при удалении фона',
  upscale: 'Ошибка при увеличении разрешения',
  uncrop: 'Ошибка при восстановлении изображения',
  shadow: 'Ошибка при добавлении тени',
  lighting: 'Ошибка при изменении освещённости',
  expand: 'Ошибка при увеличении изображения',
  createBackground: 'Ошибка при создании фона',
  catalogStudio: 'Ошибка при создании каталожного изображения',
  lifestyleEnvironment: 'Ошибка при создании сцены в окружении',
  lifestyleInUse: 'Ошибка при создании сцены в использовании',
};

export function usePhotoroomProcessing({
  apiKey,
  image,
  rotation,
  flipX,
  flipY,
  cropMode,
  cropRect,
  getFilters,
  getOriginalImageCoordinates,
  containerRef,
  calculateFitZoom,
  onImageProcessed,
  onSaveHistory,
}) {
  const [activeProcessing, setActiveProcessing] = useState(null);
  const processingRef = useRef(false);

  const isProcessing = activeProcessing !== null;

  const getEditorBlob = useCallback(async () => {
    return prepareEditorImageBlob({
      image,
      rotation,
      flipX,
      flipY,
      filterCss: getFilters(),
      cropMode,
      cropRect,
      getOriginalImageCoordinates,
    });
  }, [
    image,
    rotation,
    flipX,
    flipY,
    cropMode,
    cropRect,
    getFilters,
    getOriginalImageCoordinates,
  ]);

  const applyProcessedBlob = useCallback(async (blob) => {
    const processedImage = await loadImageFromBlob(blob);

    const container = containerRef.current;
    let fitZoom = 1;
    if (container) {
      fitZoom = calculateFitZoom(
        processedImage.width,
        processedImage.height,
        container.clientWidth,
        container.clientHeight
      );
    }

    onImageProcessed(processedImage, containerRef, calculateFitZoom);

    await onSaveHistory({
      newImage: processedImage,
      stateOverrides: {
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
      },
    });
  }, [onImageProcessed, containerRef, calculateFitZoom, onSaveHistory]);

  const runOperation = useCallback(async (operationId, apiHandler) => {
    if (!image || processingRef.current) return;

    processingRef.current = true;
    setActiveProcessing(operationId);

    try {
      const blob = await getEditorBlob();

      if (operationId === 'expand' && blob.size > EXPAND_MAX_FILE_SIZE) {
        throw new Error(EXPAND_SOURCE_DISABLED_REASON);
      }

      const processedBlob = await apiHandler(apiKey, blob);
      await applyProcessedBlob(processedBlob);
    } catch (error) {
      console.error(`Photoroom ${operationId} error:`, error);
      const prefix = ERROR_MESSAGES[operationId] || 'Ошибка обработки изображения';
      alert(`${prefix}: ${error.message}`);
    } finally {
      processingRef.current = false;
      setActiveProcessing(null);
    }
  }, [image, getEditorBlob, apiKey, applyProcessedBlob]);

  const handleRemoveBackground = useCallback(() => {
    runOperation('background', removeBackground);
  }, [runOperation]);

  const handleImprovement = useCallback((improvementId, options) => {
    const handler = IMPROVEMENT_HANDLERS[improvementId];
    if (!handler) return;
    runOperation(improvementId, (apiKey, blob) => handler(apiKey, blob, options));
  }, [runOperation]);

  return {
    activeProcessing,
    isProcessing,
    handleRemoveBackground,
    handleImprovement,
  };
}
