import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  FiRotateCw, FiCrop, FiThermometer,
  FiSun, FiDroplet,
  FiSliders, FiRotateCcw, FiCheck, FiZoomIn, FiZoomOut, FiMaximize,
  FiChevronDown, FiDownload, FiSave
} from 'react-icons/fi';
import { LuUndo2, LuRedo2, LuFlipHorizontal, LuFlipVertical } from "react-icons/lu";
import { IoContrastOutline } from "react-icons/io5";
import styles from './ImageEditor.module.css';

const ImageEditor = ({ 
  isOpen, 
  imageUrl, 
  onClose
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const [saveFormat, setSaveFormat] = useState('png');
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [saveAction, setSaveAction] = useState('download');
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeFilter, setActiveFilter] = useState('none');
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    temperature: 0,
    vignette: 0
  });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState('color');
  const [mounted, setMounted] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [baseZoom, setBaseZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Закрытие дропдауна при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSaveDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Получаем имя оригинального файла
  const getOriginalFileName = () => {
    try {
      const url = new URL(imageUrl);
      const pathname = url.pathname;
      const fileName = pathname.split('/').pop() || 'image';
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      return nameWithoutExt;
    } catch {
      return 'edited_image';
    }
  };

  // Форматируем текущую дату
  const getFormattedDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  };

  // Получаем имя файла для сохранения
  const getSaveFileName = () => {
    const originalName = getOriginalFileName();
    const date = getFormattedDate();
    const extension = saveFormat === 'jpg' ? 'jpg' : saveFormat;
    return `${originalName}_edited_${date}.${extension}`;
  };

  const calculateFitZoom = (imgWidth, imgHeight, containerWidth, containerHeight) => {
    const widthRatio = containerWidth / imgWidth;
    const heightRatio = containerHeight / imgHeight;
    const fitZoom = Math.min(widthRatio, heightRatio);
    return Math.min(Math.max(fitZoom, 0.1), 1);
  };

  const resetAllSettings = useCallback(() => {
    setRotation(0);
    setZoom(baseZoom);
    setFlipX(false);
    setFlipY(false);
    setCropMode(false);
    setCropRect({ x: 0, y: 0, w: 0, h: 0 });
    setActiveFilter('none');
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      temperature: 0,
      vignette: 0
    });
    setActiveTab('color');
    setHistory([]);
    setHistoryIndex(-1);
    setPanOffset({ x: 0, y: 0 });
  }, [baseZoom]);

  // Сброс при открытии
  useEffect(() => {
    if (isOpen) {
      resetAllSettings();
    }
  }, [isOpen, resetAllSettings]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Отслеживаем размеры контейнера
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Загрузка изображения
  useEffect(() => {
    const loadImage = async () => {
      if (!isOpen || !imageUrl) return;
      
      setLoading(true);
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Failed to load image');
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        const img = new Image();
        img.onload = () => {
          setImage(img);
          
          const container = containerRef.current;
          let fitZoom = 1;
          if (container) {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            fitZoom = calculateFitZoom(img.width, img.height, containerWidth, containerHeight);
            setBaseZoom(fitZoom);
            setZoom(fitZoom);
          }
          
          drawImageBase(img);
          
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              const initialState = {
                imageData,
                rotation: 0,
                zoom: fitZoom,
                flipX: false,
                flipY: false,
                activeFilter: 'none',
                adjustments: {
                  brightness: 0,
                  contrast: 0,
                  saturation: 0,
                  exposure: 0,
                  temperature: 0,
                  vignette: 0
                },
                cropRect: { x: 0, y: 0, w: 0, h: 0 },
                cropMode: false,
              };
              setHistory([initialState]);
              setHistoryIndex(0);
            }
          }
          
          URL.revokeObjectURL(objectUrl);
          setLoading(false);
        };
        img.src = objectUrl;
      } catch (err) {
        console.error('Failed to load image:', err);
        alert('Не удалось загрузить изображение');
        setLoading(false);
        onClose();
      }
    };
    
    loadImage();
  }, [imageUrl, isOpen, containerSize]);

  const getFilters = () => {
    const filters = [];
    
    if (adjustments.brightness !== 0) {
      filters.push(`brightness(${1 + adjustments.brightness / 100})`);
    }
    if (adjustments.contrast !== 0) {
      filters.push(`contrast(${1 + adjustments.contrast / 100})`);
    }
    if (adjustments.saturation !== 0) {
      filters.push(`saturate(${1 + adjustments.saturation / 100})`);
    }
    if (adjustments.exposure !== 0) {
      filters.push(`brightness(${1 + adjustments.exposure / 200})`);
    }

    if (adjustments.temperature > 0) {
      filters.push(`sepia(${adjustments.temperature / 200})`);
      filters.push(`saturate(${1 + adjustments.temperature / 200})`);
    } else if (adjustments.temperature < 0) {
      filters.push(`hue-rotate(${adjustments.temperature * 0.5}deg)`);
    }

    switch (activeFilter) {
      case 'none':
        break;
      case 'grayscale':
        filters.push('grayscale(1)');
        break;
      case 'sepia':
        filters.push('sepia(1)');
        break;
      case 'blur':
        filters.push('blur(2px)');
        break;
      case 'sharpen':
        filters.push('contrast(1.2)');
        break;
      case 'vintage':
        filters.push('sepia(0.5)');
        filters.push('contrast(0.9)');
        filters.push('brightness(0.95)');
        break;
      case 'warm':
        filters.push('sepia(0.3)');
        filters.push('saturate(1.2)');
        filters.push('hue-rotate(-10deg)');
        break;
      case 'dramatic':
        filters.push('contrast(1.4)');
        filters.push('brightness(0.95)');
        filters.push('saturate(1.2)');
        break;
      case 'fade':
        filters.push('brightness(1.05)');
        filters.push('contrast(0.85)');
        filters.push('saturate(0.7)');
        break;
      default:
        break;
    }

    return filters.join(' ');
  };

  const drawImageBase = (img) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    const canvasWidth = container?.clientWidth || 500;
    const canvasHeight = container?.clientHeight || 500;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    ctx.translate(canvas.width / 2 + panOffset.x, canvas.height / 2 + panOffset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipX ? -zoom : zoom, flipY ? -zoom : zoom);
    ctx.filter = getFilters();
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
    ctx.restore();
  };

  const drawCropOverlayOnly = () => {
    const canvas = canvasRef.current;
    if (!canvas || !cropMode || cropRect.w === 0 || cropRect.h === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.strokeStyle = '#0a84ff';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    
    ctx.fillStyle = '#0a84ff';
    const markerSize = 8;
    ctx.fillRect(cropRect.x - markerSize/2, cropRect.y - markerSize/2, markerSize, markerSize);
    ctx.fillRect(cropRect.x + cropRect.w - markerSize/2, cropRect.y - markerSize/2, markerSize, markerSize);
    ctx.fillRect(cropRect.x - markerSize/2, cropRect.y + cropRect.h - markerSize/2, markerSize, markerSize);
    ctx.fillRect(cropRect.x + cropRect.w - markerSize/2, cropRect.y + cropRect.h - markerSize/2, markerSize, markerSize);
    ctx.restore();
  };

  useEffect(() => {
    if (image) {
      drawImageBase(image);
      if (cropMode && cropRect.w > 0 && cropRect.h > 0) {
        drawCropOverlayOnly();
      }
    }
  }, [image, rotation, zoom, flipX, flipY, activeFilter, adjustments, cropMode, cropRect, panOffset]);

  const getCorner = (x, y) => {
    const margin = 8;
    if (Math.abs(x - cropRect.x) < margin && Math.abs(y - cropRect.y) < margin) return 'tl';
    if (Math.abs(x - (cropRect.x + cropRect.w)) < margin && Math.abs(y - cropRect.y) < margin) return 'tr';
    if (Math.abs(x - cropRect.x) < margin && Math.abs(y - (cropRect.y + cropRect.h)) < margin) return 'bl';
    if (Math.abs(x - (cropRect.x + cropRect.w)) < margin && Math.abs(y - (cropRect.y + cropRect.h)) < margin) return 'br';
    return null;
  };

  const handleCropMouseDown = (e) => {
    if (!cropMode) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const corner = getCorner(x, y);
    if (corner && cropRect.w > 0 && cropRect.h > 0) {
      setIsResizing(true);
      setResizeCorner(corner);
      setDragStart({ x, y });
      return;
    }
    
    setIsDragging(true);
    setDragStart({ x, y });
    setCropRect({ x, y, w: 0, h: 0 });
  };

  const handleCropMouseMove = (e) => {
    if (!cropMode) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (isResizing && resizeCorner) {
      let newRect = { ...cropRect };
      switch (resizeCorner) {
        case 'tl':
          newRect = {
            x: Math.min(x, cropRect.x + cropRect.w),
            y: Math.min(y, cropRect.y + cropRect.h),
            w: Math.abs(cropRect.x + cropRect.w - x),
            h: Math.abs(cropRect.y + cropRect.h - y)
          };
          break;
        case 'tr':
          newRect = {
            x: cropRect.x,
            y: Math.min(y, cropRect.y + cropRect.h),
            w: Math.abs(x - cropRect.x),
            h: Math.abs(cropRect.y + cropRect.h - y)
          };
          break;
        case 'bl':
          newRect = {
            x: Math.min(x, cropRect.x + cropRect.w),
            y: cropRect.y,
            w: Math.abs(cropRect.x + cropRect.w - x),
            h: Math.abs(y - cropRect.y)
          };
          break;
        case 'br':
          newRect = {
            x: cropRect.x,
            y: cropRect.y,
            w: Math.abs(x - cropRect.x),
            h: Math.abs(y - cropRect.y)
          };
          break;
      }
      if (newRect.w > 5 && newRect.h > 5) {
        setCropRect(newRect);
      }
    } else if (isDragging) {
      setCropRect({
        x: Math.min(dragStart.x, x),
        y: Math.min(dragStart.y, y),
        w: Math.abs(x - dragStart.x),
        h: Math.abs(y - dragStart.y)
      });
    }
  };

  const handleCropMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeCorner(null);
  };

  const applyCrop = () => {
    if (!image || cropRect.w === 0 || cropRect.h === 0) {
      setCropMode(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const wasCropMode = cropMode;
    setCropMode(false);
    
    drawImageBase(image);
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCanvas.width = cropRect.w;
    tempCanvas.height = cropRect.h;
    
    tempCtx.drawImage(
      canvas,
      cropRect.x, cropRect.y, cropRect.w, cropRect.h,
      0, 0, cropRect.w, cropRect.h
    );

    setCropMode(wasCropMode);
    drawCropOverlayOnly();

    const croppedImage = new Image();
    croppedImage.onload = () => {
      setCropMode(false);
      setCropRect({ x: 0, y: 0, w: 0, h: 0 });
      setImage(croppedImage);
      setPanOffset({ x: 0, y: 0 });
      
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas && croppedImage) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawImageBase(croppedImage);
          }
        }
        saveToHistory();
      }, 50);
    };
    croppedImage.src = tempCanvas.toDataURL();
  };

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const newState = {
      imageData,
      rotation,
      zoom,
      flipX,
      flipY,
      activeFilter,
      adjustments: { ...adjustments },
      cropRect: { ...cropRect },
      cropMode,
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, rotation, zoom, flipX, flipY, activeFilter, adjustments, cropRect, cropMode]);

  const restoreFromHistory = useCallback((state) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = state.imageData.width;
    canvas.height = state.imageData.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(state.imageData, 0, 0);
    }

    setRotation(state.rotation);
    setZoom(state.zoom);
    setFlipX(state.flipX);
    setFlipY(state.flipY);
    setActiveFilter(state.activeFilter);
    setAdjustments(state.adjustments);
    setCropRect(state.cropRect);
    setCropMode(state.cropMode);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const rotate = (direction) => {
    const newRotation = direction === 'right' ? rotation + 90 : rotation - 90;
    setRotation(newRotation % 360);
    setTimeout(() => saveToHistory(), 50);
  };

  const flip = (axis) => {
    if (axis === 'x') {
      setFlipX(!flipX);
    } else {
      setFlipY(!flipY);
    }
    setTimeout(() => saveToHistory(), 50);
  };

  const setFilterWithHistory = useCallback((filter) => {
    setActiveFilter(filter);
    setTimeout(() => saveToHistory(), 50);
  }, [saveToHistory]);

  const setAdjustmentWithHistory = useCallback((key, value) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
    setTimeout(() => saveToHistory(), 50);
  }, [saveToHistory]);

  const reset = () => {
    setRotation(0);
    setZoom(baseZoom);
    setFlipX(false);
    setFlipY(false);
    setActiveFilter('none');
    setCropMode(false);
    setCropRect({ x: 0, y: 0, w: 0, h: 0 });
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      exposure: 0,
      temperature: 0,
      vignette: 0
    });
    setPanOffset({ x: 0, y: 0 });
    
    if (imageUrl) {
      fetch(imageUrl, { credentials: 'include' })
        .then(res => res.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            setImage(img);
            URL.revokeObjectURL(url);
          };
          img.src = url;
        });
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      restoreFromHistory(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      restoreFromHistory(history[newIndex]);
    }
  };

  // Создание Blob для сохранения
  const createImageBlob = (format, quality) => {
    return new Promise((resolve) => {
      if (!image) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;
      
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      
      tempCtx.save();
      tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
      tempCtx.rotate((rotation * Math.PI) / 180);
      tempCtx.scale(flipX ? -zoom : zoom, flipY ? -zoom : zoom);
      tempCtx.filter = getFilters();
      tempCtx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);
      tempCtx.restore();
      
      let mimeType;
      switch (format) {
        case 'png':
          mimeType = 'image/png';
          break;
        case 'jpg':
          mimeType = 'image/jpeg';
          break;
        case 'webp':
          mimeType = 'image/webp';
          break;
        default:
          mimeType = 'image/png';
      }
      
      tempCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, mimeType, quality);
    });
  };

  // Скачать на компьютер (открыть модалку выбора формата)
  const handleDownloadClick = () => {
    setSaveAction('download');
    setShowFormatModal(true);
  };

  // Сохранить как (на сервер) - открыть модалку выбора формата
  const handleSaveAsClick = () => {
    setSaveAction('saveToServer');
    setShowFormatModal(true);
  };

  // Сохранить (заглушка)
  const handleSave = () => {
    alert('Функционал сохранения в разработке');
  };

  // Подтверждение действия после выбора формата
  const confirmSave = async () => {
    setIsSaving(true);
    
    try {
      const quality = saveFormat === 'png' ? undefined : 0.92;
      const blob = await createImageBlob(saveFormat, quality);
      const fileName = getSaveFileName();
      
      if (saveAction === 'download') {
        // Скачиваем на компьютер
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('Изображение скачано');
      } else {
        // Сохраняем на сервер
        const mimeType = saveFormat === 'png' ? 'image/png' : saveFormat === 'jpg' ? 'image/jpeg' : 'image/webp';
        const fileToUpload = new File([blob], fileName, { type: mimeType });
        
        // Здесь должен быть ваш API вызов
        // const result = await apiUploadFile(fileToUpload, [], folderId);
        
        alert('Изображение сохранено на сервере');
        
      }
    } catch (err) {
      console.error('Operation failed:', err);
      alert(saveAction === 'download' ? 'Не удалось скачать изображение' : 'Не удалось сохранить изображение');
    } finally {
      setIsSaving(false);
      setShowFormatModal(false);
    }
  };

  const AdjustmentSlider = ({ 
    label, 
    value, 
    onChange, 
    min = -100, 
    max = 100,
    icon 
  }) => {
    const valueClass = value > 0 ? styles.positive : value < 0 ? styles.negative : styles.zero;
    const displayValue = value > 0 ? `+${value}` : `${value}`;

    return (
      <div className={styles.sliderGroup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sliderHeader}>
          {icon && <span className={styles.sliderIcon}>{icon}</span>}
          <span className={styles.sliderLabel}>{label}</span>
          <span className={`${styles.sliderValue} ${valueClass}`}>
            {displayValue}
          </span>
        </div>
        <div className={styles.sliderTrack}>
          <div className={styles.sliderBackground} />
          <div 
            className={styles.sliderFill}
            style={{
              width: `${Math.abs(value) / max * 50}%`,
              left: value > 0 ? '50%' : `calc(50% - ${Math.abs(value) / max * 50}%)`,
              backgroundColor: value > 0 ? 'var(--color-text-accent, #0a84ff)' : 'var(--color-text-accent, #0a84ff)'
            }}
          />
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => {
              onChange(Number(e.target.value));
            }}
            className={styles.slider}
            onClick={(e) => e.stopPropagation()}
          />
          <div className={styles.centerMarker} />
        </div>
      </div>
    );
  };

  const filters = [
    { id: 'none', label: 'Оригинал', icon: '🎨' },
    { id: 'grayscale', label: 'Ч/б', icon: '⚫' },
    { id: 'sepia', label: 'Сепия', icon: '🟤' },
    { id: 'blur', label: 'Размытие', icon: '🌫️' },
    { id: 'sharpen', label: 'Резкость', icon: '⚡' },
    { id: 'vintage', label: 'Винтаж', icon: '📷' },
    { id: 'warm', label: 'Теплый', icon: '🔥' },
    { id: 'dramatic', label: 'Драма', icon: '🎭' },
    { id: 'fade', label: 'Выцветший', icon: '🌾' }
  ];

  const getFilterPreviewUrl = (filterId) => {
    if (!image) return '';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const size = 80;
    canvas.width = size;
    canvas.height = size;

    ctx.drawImage(image, 0, 0, size, size);

    const filter = getFilterCSS(filterId);
    if (filter) {
      ctx.filter = filter;
      ctx.drawImage(canvas, 0, 0);
    }

    return canvas.toDataURL();
  };

  const getFilterCSS = (filterId) => {
    switch (filterId) {
      case 'grayscale':
        return 'grayscale(1)';
      case 'sepia':
        return 'sepia(1)';
      case 'blur':
        return 'blur(2px)';
      case 'sharpen':
        return 'contrast(1.2)';
      case 'vintage':
        return 'sepia(0.5) contrast(0.9) brightness(0.95)';
      case 'warm':
        return 'sepia(0.3) saturate(1.2) hue-rotate(-10deg)';
      case 'dramatic':
        return 'contrast(1.4) brightness(0.95) saturate(1.2)';
      case 'fade':
        return 'brightness(1.05) contrast(0.85) saturate(0.7)';
      default:
        return '';
    }
  };

  const fitToContainer = () => {
    if (image && containerRef.current) {
      const container = containerRef.current;
      const fitZoom = calculateFitZoom(
        image.width, image.height,
        container.clientWidth, container.clientHeight
      );
      setBaseZoom(fitZoom);
      setZoom(fitZoom);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e) => {
    if (!cropMode && e.button === 0) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (cropMode) {
      handleCropMouseDown(e);
      return;
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (cropMode) {
      handleCropMouseMove(e);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (cropMode) {
      handleCropMouseUp();
    }
  };

  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
  }, [image, zoom, rotation, flipX, flipY, baseZoom]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      <div className={styles.editorOverlay} onClick={(e) => e.stopPropagation()}>
        <div className={styles.editorModal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.editorHeader}>
            <div className={styles.editorHeaderLeft}>
              <button
                className={styles.zoomButton}
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                disabled={zoom >= 3}
              >
                <FiZoomIn size={20} />
              </button>

              <button
                className={styles.zoomButton}
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                disabled={zoom <= 0.5}
              >
                <FiZoomOut size={20} />
              </button>

              <button
                className={styles.fitButton}
                onClick={fitToContainer}
              >
                <FiMaximize size={18} />
              </button>

              <span className={styles.zoomValue}>{Math.round(zoom * 100)}%</span>

              <div className={styles.headerDivider} />

              <button
                className={styles.resetButton}
                onClick={reset}
              >
                <span>Сбросить</span>
              </button>

              <div className={styles.historyControls}>
                <button
                  className={styles.historyButton}
                  onClick={undo}
                  disabled={historyIndex <= 0}
                >
                  <LuUndo2 size={18} />
                </button>
                <button
                  className={styles.historyButton}
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                >
                  <LuRedo2 size={18} />
                </button>
              </div>
            </div>

            <div className={styles.transformGroup}>
              <button
                className={styles.transformButton}
                onClick={() => rotate('left')}
              >
                <FiRotateCcw size={20} />
              </button>

              <button
                className={styles.transformButton}
                onClick={() => rotate('right')}
              >
                <FiRotateCw size={20} />
              </button>

              <button
                className={styles.transformButton}
                onClick={() => flip('x')}
              >
                <LuFlipHorizontal size={20} />
              </button>

              <button
                className={styles.transformButton}
                onClick={() => flip('y')}
              >
                <LuFlipVertical size={20} />
              </button>

              <div className={styles.transformDivider} />

              <div className={styles.cropWrapper}>
                <button
                  className={`${styles.transformButton} ${cropMode ? styles.active : ''}`}
                  onClick={() => setCropMode(!cropMode)}
                >
                  <FiCrop size={20} />
                </button>
                {cropMode && cropRect.w > 0 && (
                  <button
                    className={styles.applyCropButton}
                    onClick={applyCrop}
                  >
                    Применить
                  </button>
                )}
              </div>
            </div>

            <div className={styles.editorHeaderRight}>
              {/* Составная кнопка */}
              <div className={styles.compositeButton} ref={dropdownRef}>
                <button
                  className={styles.saveButton}
                  onClick={handleDownloadClick}
                >
                  <FiDownload size={16} />
                  <span>Скачать</span>
                </button>
                <button
                  className={styles.dropdownToggle}
                  onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                >
                  <FiChevronDown size={16} />
                </button>
                
                {showSaveDropdown && (
                  <div className={styles.saveDropdown}>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        handleDownloadClick();
                        setShowSaveDropdown(false);
                      }}
                    >
                      <FiDownload size={16} />
                      <span>Скачать</span>
                    </button>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        handleSaveAsClick();
                        setShowSaveDropdown(false);
                      }}
                    >
                      <FiSave size={16} />
                      <span>Сохранить как</span>
                    </button>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        handleSave();
                        setShowSaveDropdown(false);
                      }}
                    >
                      <FiCheck size={16} />
                      <span>Сохранить</span>
                    </button>
                  </div>
                )}
              </div>
              
              <button
                className={styles.cancelButton}
                onClick={onClose}
              >
                Отмена
              </button>
            </div>
          </div>

          <div className={styles.editorContent}>
            <div 
              ref={containerRef} 
              className={styles.canvasContainer}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ 
                cursor: cropMode ? 'crosshair' : (isPanning ? 'grabbing' : 'grab')
              }}
            >
              {loading ? (
                <div className={styles.loader}>Загрузка изображения...</div>
              ) : (
                <canvas
                  ref={canvasRef}
                  className={styles.canvas}
                />
              )}
            </div>

            <div className={styles.toolsPanel} onClick={(e) => e.stopPropagation()}>
              <div className={styles.tabs}>
                <button 
                  className={`${styles.tab} ${activeTab === 'color' ? styles.active : ''}`}
                  onClick={() => setActiveTab('color')}
                >
                  Цвет
                </button>
                <button 
                  className={`${styles.tab} ${activeTab === 'effects' ? styles.active : ''}`}
                  onClick={() => setActiveTab('effects')}
                >
                  Эффекты
                </button>
              </div>

              {activeTab === 'color' && (
                <div className={styles.toolsGroup}>
                  <AdjustmentSlider
                    label="Яркость"
                    value={adjustments.brightness}
                    onChange={(v) => setAdjustmentWithHistory('brightness', v)}
                    icon={<FiSun size={18} />}
                  />
                  <AdjustmentSlider
                    label="Контраст"
                    value={adjustments.contrast}
                    onChange={(v) => setAdjustmentWithHistory('contrast', v)}
                    icon={<IoContrastOutline size={18} />}
                  />
                  <AdjustmentSlider
                    label="Насыщенность"
                    value={adjustments.saturation}
                    onChange={(v) => setAdjustmentWithHistory('saturation', v)}
                    icon={<FiDroplet size={18} />}
                  />
                  <AdjustmentSlider
                    label="Экспозиция"
                    value={adjustments.exposure}
                    onChange={(v) => setAdjustmentWithHistory('exposure', v)}
                    icon={<FiSliders size={18} />}
                  />
                  <AdjustmentSlider
                    label="Температура"
                    value={adjustments.temperature}
                    onChange={(v) => setAdjustmentWithHistory('temperature', v)}
                    icon={<FiThermometer size={18} />}
                  />
                </div>
              )}

              {activeTab === 'effects' && (
                <div className={styles.toolsGroup}>
                  <div className={styles.filterGrid}>
                    {filters.map(filter => (
                      <button
                        key={filter.id}
                        className={`${styles.filterCard} ${activeFilter === filter.id ? styles.active : ''}`}
                        onClick={() => setFilterWithHistory(filter.id)}
                      >
                        <div className={styles.filterPreview}>
                          {image ? (
                            <img 
                              src={getFilterPreviewUrl(filter.id)}
                              alt={filter.label}
                              className={styles.filterPreviewImage}
                            />
                          ) : (
                            <div className={styles.filterPreviewPlaceholder}>
                              <span className={styles.filterIconLarge}>{filter.icon}</span>
                            </div>
                          )}
                        </div>
                        <span className={styles.filterLabel}>{filter.label}</span>
                        {activeFilter === filter.id && (
                          <span className={styles.activeCheck}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модалка выбора формата */}
      {showFormatModal && (
        <div className={styles.formatModalOverlay} onClick={() => setShowFormatModal(false)}>
          <div className={styles.formatModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.formatModalHeader}>
              <h3 className={styles.formatModalTitle}>
                {saveAction === 'download' ? 'Выберите формат для скачивания' : 'Выберите формат для сохранения'}
              </h3>
            </div>
            
            <div className={styles.formatOptions}>
              <button
                className={`${styles.formatOptionCard} ${saveFormat === 'png' ? styles.active : ''}`}
                onClick={() => setSaveFormat('png')}
              >
                <div className={styles.formatOptionIcon}>PNG</div>
              </button>
              
              <button
                className={`${styles.formatOptionCard} ${saveFormat === 'jpg' ? styles.active : ''}`}
                onClick={() => setSaveFormat('jpg')}
              >
                <div className={styles.formatOptionIcon}>JPG</div>
              </button>
              
              <button
                className={`${styles.formatOptionCard} ${saveFormat === 'webp' ? styles.active : ''}`}
                onClick={() => setSaveFormat('webp')}
              >
                <div className={styles.formatOptionIcon}>WEBP</div>
              </button>
            </div>
            
            <div className={styles.formatModalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowFormatModal(false)}
                disabled={isSaving}
              >
                Отмена
              </button>
              <button
                className={styles.confirmButton}
                onClick={confirmSave}
                disabled={isSaving}
              >
                {isSaving ? 'Обработка...' : (saveAction === 'download' ? 'Скачать' : 'Сохранить')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default ImageEditor;