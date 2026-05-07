import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import styles from './ProductImageDownloader.module.css';

export const ProductImageDownloader = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [error, setError] = useState('');
  const [log, setLog] = useState([]);

  const addLog = (message) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const processCsvFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const text = event.target.result;
          const lines = text.split('\n').filter(line => line.trim());
          const productCodes = [];
          
          lines.forEach(line => {
            const trimmedLine = line.trim();
            if (/^\d{4}-\d{4}$/.test(trimmedLine)) {
              productCodes.push(trimmedLine);
            } else {
              const match = trimmedLine.match(/\d{4}-\d{4}/);
              if (match) {
                productCodes.push(match[0]);
              }
            }
          });
          
          resolve(productCodes);
        } catch (err) {
          reject(new Error('Ошибка при чтении CSV файла'));
        }
      };
      
      reader.onerror = () => reject(new Error('Ошибка при чтении файла'));
      reader.readAsText(file);
    });
  };

  const searchProduct = async (productCode) => {
    try {
      const response = await fetch(
        `https://new.sharik.ru/api/rest/v1/products_lite/?page_size=100&search=${productCode}&ordering=relevance&supplier_category__isnull=False`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const results = data.results || data;
      
      if (Array.isArray(results) && results.length > 0) {
        const exactMatch = results.find((item) => 
          item.code === productCode || item.article === productCode
        );
        
        return exactMatch ? exactMatch.id : results[0].id;
      }
      
      return null;
    } catch (err) {
      console.error(`Ошибка при поиске товара ${productCode}:`, err);
      return null;
    }
  };

  const getProductDetails = async (productId) => {
    try {
      const response = await fetch(
        `https://new.sharik.ru/api/rest/v1/products_detailed/get_many/?ids=${productId}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (err) {
      console.error(`Ошибка при получении деталей товара ${productId}:`, err);
      return null;
    }
  };

  const convertToWebP = async (blob) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Не удалось создать контекст canvas'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (webpBlob) => {
            URL.revokeObjectURL(url);
            if (webpBlob) {
              resolve(webpBlob);
            } else {
              reject(new Error('Не удалось конвертировать в WebP'));
            }
          },
          'image/webp',
          0.9
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Ошибка загрузки изображения'));
      };
      
      img.src = url;
    });
  };

  const resizeImage = async (blob, width, height) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Не удалось создать контекст canvas'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (resizedBlob) => {
            URL.revokeObjectURL(url);
            if (resizedBlob) {
              resolve(resizedBlob);
            } else {
              reject(new Error('Не удалось изменить размер изображения'));
            }
          },
          'image/webp',
          0.9
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Ошибка загрузки изображения'));
      };
      
      img.src = url;
    });
  };

  const downloadZip = async (zip, folderName) => {
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${folderName}.zip`);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');
    setLog([]);
    setIsProcessing(true);
    
    try {
      addLog('Начинаем обработку CSV файла...');
      const productCodes = await processCsvFile(file);
      
      addLog(`Найдено ${productCodes.length} кодов товаров`);
      setProgress({ current: 0, total: productCodes.length, status: 'Обработка...' });
      
      // Создаем два ZIP архива
      const previewZip = new JSZip();
      const previewFolder = previewZip.folder('previews_400x400');
      const originalZip = new JSZip();
      const originalFolder = originalZip.folder('original_images');
      
      let totalImages = 0;
      
      for (let i = 0; i < productCodes.length; i++) {
        const productCode = productCodes[i];
        
        try {
          setProgress({ 
            current: i + 1, 
            total: productCodes.length, 
            status: `Обработка ${productCode} (${i + 1}/${productCodes.length})` 
          });
          
          addLog(`Поиск товара: ${productCode}`);
          
          const productId = await searchProduct(productCode);
          
          if (!productId) {
            addLog(`Товар не найден: ${productCode}`);
            continue;
          }
          
          addLog(`Найден ID товара: ${productId}`);
          
          const productDetails = await getProductDetails(productId);
          
          if (!productDetails || !productDetails.images || productDetails.images.length === 0) {
            addLog(`Нет изображений для товара: ${productCode}`);
            continue;
          }
          
          const images = productDetails.images;
          addLog(`Найдено изображений: ${images.length} для товара ${productCode}`);
          totalImages += images.length;
          
          // Обрабатываем первое изображение (превью 400x400)
          if (images.length > 0) {
            const firstImageUrl = `https://new.sharik.ru${images[0].image}`;
            const previewFilename = `${productCode}.webp`;
            
            try {
              const response = await fetch(firstImageUrl);
              if (response.ok) {
                const blob = await response.blob();
                const resizedBlob = await resizeImage(blob, 200, 200);
                
                // Добавляем в архив превью
                previewFolder.file(previewFilename, resizedBlob);
                addLog(`Превью добавлено в архив: ${previewFilename}`);
              }
            } catch (err) {
              addLog(`Ошибка при создании превью для ${productCode}: ${err}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          // Обрабатываем все изображения для папки original_images
          for (let j = 0; j < images.length; j++) {
            const imageUrl = `https://new.sharik.ru${images[j].image}`;
            const imageFilename = `${productCode}_m${j + 1}.webp`;
            
            try {
              const response = await fetch(imageUrl);
              if (response.ok) {
                const blob = await response.blob();
                const webpBlob = await convertToWebP(blob);
                
                // Добавляем в архив оригинальных изображений
                originalFolder.file(imageFilename, webpBlob);
                addLog(`Изображение добавлено в архив: ${imageFilename}`);
              }
            } catch (err) {
              addLog(`Ошибка при обработке ${imageFilename}: ${err}`);
            }
            
            if (j < images.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
          
          if (i % 5 === 0) {
            addLog(`Обработано ${i + 1} из ${productCodes.length} товаров`);
          }
          
          if (i < productCodes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
        } catch (err) {
          addLog(`Ошибка при обработке товара ${productCode}: ${err}`);
          continue;
        }
      }
      
      addLog('Формирование ZIP архивов...');
      setProgress({ current: productCodes.length, total: productCodes.length, status: 'Создание архивов...' });
      
      // Скачиваем оба архива
      await downloadZip(previewZip, 'previews_400x400');
      addLog('Архив с превью (400x400) скачан');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await downloadZip(originalZip, 'original_images');
      addLog('Архив с оригинальными изображениями скачан');
      
      addLog(`Обработка завершена! Всего обработано изображений: ${totalImages}`);
      setProgress({ current: productCodes.length, total: productCodes.length, status: 'Завершено' });
      
    } catch (err) {
      setError(err.message || 'Произошла ошибка при обработке файла');
      addLog(`Ошибка: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Загрузка изображений товаров</h1>
      
      <div className={styles.uploadSection}>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isProcessing}
          className={styles.fileInput}
        />
        <p className={styles.helpText}>
          Загрузите CSV файл с кодами товаров (формат: XXXX-XXXX)
        </p>
        <div className={styles.infoBox}>
          <p>После обработки будут скачаны два ZIP архива:</p>
          <ul>
            <li><strong>previews_200x200.zip</strong> - превью изображений 200x200px</li>
            <li><strong>original_images.zip</strong> - оригинальные изображения</li>
          </ul>
        </div>
      </div>
      
      {isProcessing && (
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ 
                width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` 
              }}
            />
          </div>
          <p className={styles.progressText}>
            {progress.status}
            {progress.total > 0 && ` (${Math.round((progress.current / progress.total) * 100)}%)`}
          </p>
        </div>
      )}
      
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}
      
      {log.length > 0 && (
        <div className={styles.logSection}>
          <h3 className={styles.logTitle}>Лог операций:</h3>
          <div className={styles.logContent}>
            {log.map((entry, index) => (
              <p key={index} className={styles.logEntry}>{entry}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
