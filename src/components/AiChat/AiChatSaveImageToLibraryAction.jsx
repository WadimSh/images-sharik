import { useCallback, useState } from 'react';
import { LuImageDown } from 'react-icons/lu';

import { useAuth } from '../../contexts/AuthContext';
import ImageEditedUploadModal from '../ImageEditedUploadModal/ImageEditedUploadModal';
import { Tooltip } from '../../ui/Tooltip/Tooltip';
import {
  fetchImageBlobFromUrl,
  uploadGraphicToLibrary,
} from '../../utils/saveGraphicToLibrary';

/**
 * @param {object} props
 * @param {{ url: string, fileName: string, mimeType?: string }} props.imageFile
 * @param {string|null|undefined} props.companyId
 */
export function AiChatSaveImageToLibraryAction({ imageFile, companyId = null }) {
  const { user } = useAuth();
  const [isPreparing, setIsPreparing] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedBlob, setSelectedBlob] = useState(null);

  const resolvedCompanyId = companyId || user?.company?.[0]?.id || null;
  const actionLabel = 'Сохранить в библиотеке';

  const handleOpen = useCallback(async () => {
    if (!imageFile?.url || isPreparing) {
      return;
    }

    setIsPreparing(true);
    try {
      const blob = await fetchImageBlobFromUrl(imageFile.url);
      setSelectedBlob(blob);
      setIsUploadModalOpen(true);
    } catch (error) {
      console.error('[AiChat] failed to prepare image for library save:', error);
      window.alert('Не удалось подготовить изображение');
    } finally {
      setIsPreparing(false);
    }
  }, [imageFile?.url, isPreparing]);

  const handleCloseModal = useCallback(() => {
    setIsUploadModalOpen(false);
    setSelectedBlob(null);
  }, []);

  const handleUpload = useCallback(
    async (finalFileName, allTags) => {
      if (!selectedBlob) {
        return;
      }

      try {
        await uploadGraphicToLibrary({
          companyId: resolvedCompanyId,
          blob: selectedBlob,
          finalFileName,
          tags: allTags,
        });

        window.alert('✅ Успешно загружен');
        handleCloseModal();
      } catch (error) {
        console.error('[AiChat] failed to upload image to library:', error);
        window.alert(`❌ Не удалось загрузить файл "${finalFileName}": ${error.message}`);
      }
    },
    [handleCloseModal, resolvedCompanyId, selectedBlob]
  );

  const selectedFile = selectedBlob
    ? new File([selectedBlob], imageFile.fileName || 'image.png', {
        type: selectedBlob.type || imageFile.mimeType || 'image/png',
        lastModified: Date.now(),
      })
    : null;

  return (
    <>
      <Tooltip content={actionLabel} position="bottom-shift-left">
        <button
          type="button"
          className="ai-chat-message-meta-copy"
          onClick={handleOpen}
          disabled={isPreparing}
          aria-label={actionLabel}
          data-testid="ai-chat-message-save-to-library"
        >
          <LuImageDown className="ai-chat-message-meta-copy-icon" aria-hidden="true" />
        </button>
      </Tooltip>

      {isUploadModalOpen ? (
        <ImageEditedUploadModal
          isOpen={isUploadModalOpen}
          onClose={handleCloseModal}
          onUpload={handleUpload}
          user={user}
          selectedFile={selectedFile}
          fileNameStoragePart="ai_generation"
          showAddTagPlusIcon={false}
        />
      ) : null}
    </>
  );
}
