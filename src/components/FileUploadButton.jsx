import { useRef } from 'react';
import { FiUploadCloud } from 'react-icons/fi';
import { useUpload } from '../contexts/UploadContext';
import { uploadGraphicFile } from '../services/mediaService';

// Функция для транслитерации кириллицы в латиницу
const transliterateFileName = (filename) => {
  const translitMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
    'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
    'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
    'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
    'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch',
    'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
    'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };
  
  let result = filename.replace(/[а-яёА-ЯЁ]/g, char => translitMap[char] || char);
  
  result = result.replace(/[^\w\s.-]/g, '_'); 
  result = result.replace(/\s+/g, '_'); 
  result = result.replace(/_+/g, '_'); 
  result = result.replace(/^_+|_+$/g, ''); 
  
  return result;
};

// Функция для создания нового File объекта с транслитерированным именем
const createTransliteratedFile = (originalFile) => {
  const newFileName = transliterateFileName(originalFile.name);
  
  if (newFileName === originalFile.name) {
    return originalFile;
  }
  
  const blob = new Blob([originalFile], { type: originalFile.type });
  const newFile = new File([blob], newFileName, {
    type: originalFile.type,
    lastModified: originalFile.lastModified
  });
  
  return newFile;
};

// Функция для извлечения артикулов из названия файла
const extractArticleNumbers = (filename) => {
  const articleRegex = /\d{4}-\d{4}/g;
  const matches = filename.match(articleRegex);
  return matches ? [...new Set(matches)] : ["нет кода"];
};

const getFileNameWithoutExtension = (filename) => {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex === -1 ? filename : filename.substring(0, lastDotIndex);
};

// Функция для проверки, содержит ли имя файла кириллицу
const containsCyrillic = (filename) => {
  return /[а-яёА-ЯЁ]/.test(filename);
};

const FileUploadButton = ({ id, buttonText, className = '', maxFiles = 100 }) => {
  const fileInputRef = useRef(null);
  const { updateUploadState } = useUpload();

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    // 1. Проверяем количество файлов
    if (files.length > maxFiles) {
      alert(`Максимальное количество файлов: ${maxFiles}. Вы выбрали: ${files.length}`);
      event.target.value = '';
      return;
    }

    // 2. Проверяем типы файлов
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      alert(`Недопустимые форматы файлов: ${invalidFiles.map(f => f.name).join(', ')}\nРазрешены: JPEG, PNG, GIF, WebP, SVG`);
      event.target.value = '';
      return;
    }

    // 3. Проверяем размер файлов (100MB каждый)
    const maxSize = 100 * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      alert(`Следующие файлы превышают размер 100MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      event.target.value = '';
      return;
    }

    updateUploadState({
      isUploading: true,
      uploadProgress: {},
      uploadResults: [],
      currentFileIndex: 0,
      totalFilesCount: files.length
    });
    
    const controller = new AbortController();
    updateUploadState({ uploadController: controller });

    const results = [];
    const renamedFiles = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const originalFile = files[i];
        
        if (controller.signal.aborted) { break };

        updateUploadState({ currentFileIndex: i + 1 });
        
        // Показываем оригинальное имя в прогрессе
        updateUploadState(prev => ({
          uploadProgress: {
            ...prev.uploadProgress,
            [originalFile.name]: { status: 'uploading', progress: 0 }
          }
        }));

        try {
          // Создаем транслитерированный файл
          const processedFile = createTransliteratedFile(originalFile);
          
          // Сохраняем информацию о переименовании
          if (processedFile.name !== originalFile.name) {
            renamedFiles.push({
              original: originalFile.name,
              renamed: processedFile.name
            });
          }
          
          // Извлекаем артикулы из ОРИГИНАЛЬНОГО имени (чтобы не потерять артикулы)
          const originalFileNameWithoutExt = getFileNameWithoutExtension(originalFile.name);
          const extractedTags = extractArticleNumbers(originalFileNameWithoutExt);
          
          // Загружаем ОБРАБОТАННЫЙ файл с тегами из ОРИГИНАЛЬНОГО имени
          const result = await uploadGraphicFile(id, processedFile, controller.signal, extractedTags);
          
          // Обновляем прогресс
          updateUploadState(prev => ({
            uploadProgress: {
              ...prev.uploadProgress,
              [originalFile.name]: { 
                status: 'completed', 
                progress: 100,
                renamedTo: processedFile.name !== originalFile.name ? processedFile.name : undefined
              }
            }
          }));
          
          results.push({
            file: originalFile.name,
            processedName: processedFile.name,
            status: 'success',
            result,
            size: (originalFile.size / 1024 / 1024).toFixed(2) + ' MB',
            tags: extractedTags,
            tagsCount: extractedTags.length,
            wasRenamed: processedFile.name !== originalFile.name,
            hasCyrillic: containsCyrillic(originalFile.name)
          });
          
        } catch (error) {
          console.error(`❌ Ошибка загрузки файла ${originalFile.name}:`, error);
          
          updateUploadState(prev => ({
            uploadProgress: {
              ...prev.uploadProgress,
              [originalFile.name]: { 
                status: 'failed', 
                progress: 0, 
                error: error.message || 'Неизвестная ошибка'
              }
            }
          }));
          
          results.push({
            file: originalFile.name,
            status: 'failed',
            error: error.message || 'Неизвестная ошибка',
            size: (originalFile.size / 1024 / 1024).toFixed(2) + ' MB'
          });
        }
      }

      updateUploadState({ uploadResults: results });
    } catch (error) {
      console.error('Общая ошибка при загрузке файлов:', error);
      
      if (error.name !== 'AbortError') {
        alert(`Ошибка при загрузке файлов: ${error.message}`);
      }
      
    } finally {
      updateUploadState({
        isUploading: false,
        uploadController: null
      });
      event.target.value = '';
    }
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        disabled={false}
        className={`template-button ${className}`}
        style={{ 
          background: 'transparent',
          cursor: 'pointer'
        }}
      >
        <FiUploadCloud /> 
        {buttonText}
      </button>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/jpeg,image/png,image/webp"
        multiple
      />
    </>
  );
};

export default FileUploadButton;