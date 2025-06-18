import imageCompression from 'browser-image-compression';

export const handleFileUpload = async (file, setElements) => {
  if (!file) return;

  try {
    // Настройки компрессии
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: file.type.includes('png') ? 'image/png' : 'image/jpeg',
      initialQuality: 0.6
    };

    // Сжимаем изображение
    const compressedFile = await imageCompression(file, options);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = () => {
        const containerWidth = 450;
        const containerHeight = 600;

        const scale = Math.min(
          containerWidth / img.width,
          containerHeight / img.height,
          1
        );

        const newWidth = img.width * scale;
        const newHeight = img.height * scale;

        const position = {
          x: (containerWidth - newWidth) / 2,
          y: (containerHeight - newHeight) / 2
        };

        const newElement = {
          id: Date.now(),
          type: 'image',
          position,
          image: event.target.result,
          width: newWidth,
          height: newHeight,
          originalWidth: img.width,
          originalHeight: img.height,
          isFlipped: false
        };

        setElements(prev => [...prev, newElement]);
      };
      img.onerror = () => alert('Image upload error');
      img.src = event.target.result;
    };
    reader.readAsDataURL(compressedFile);

  } catch (error) {
    console.error('Compression error:', error);
    alert('Couldn`t process the image');
  }
}; 