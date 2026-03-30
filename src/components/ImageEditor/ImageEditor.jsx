import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  FiRotateCw, FiCrop, FiThermometer, FiSun, FiDroplet,
  FiSliders, FiRotateCcw, FiCheck, FiZoomIn, FiZoomOut, FiMaximize,
  FiChevronDown, FiDownload, FiSave
} from 'react-icons/fi';
import { LuUndo2, LuRedo2, LuFlipHorizontal, LuFlipVertical } from "react-icons/lu";
import { IoContrastOutline } from "react-icons/io5";
import { RiScissorsCutLine } from "react-icons/ri";
import { PiMagicWand } from "react-icons/pi";

import { useAuth } from '../../contexts/AuthContext';
import { uploadGraphicFile } from '../../services/mediaService';
import ImageEditedUploadModal from '../ImageEditedUploadModal/ImageEditedUploadModal'; 
import styles from './ImageEditor.module.css';

// Константы для пропорций обрезки
const aspectRatios = [
  { id: 'original', label: 'Оригинал', ratio: null },
  { id: '1:1', label: '1:1 (Квадрат)', ratio: 1 },
  //{ id: '16:9', label: '16:9 (Широкий)', ratio: 16 / 9 },
  //{ id: '9:16', label: '9:16 (Вертикальный)', ratio: 9 / 16 },
  //{ id: '4:5', label: '4:5 (Портрет)', ratio: 4 / 5 },
  //{ id: '5:4', label: '5:4 (Ландшафт)', ratio: 5 / 4 },
  { id: '3:4', label: '3:4 (Карточка)', ratio: 3 / 4 },
  //{ id: '4:3', label: '4:3', ratio: 4 / 3 },
  //{ id: '2:3', label: '2:3', ratio: 2 / 3 },
  //{ id: '3:2', label: '3:2', ratio: 3 / 2 },
  //{ id: '5:7', label: '5:7', ratio: 5 / 7 },
  //{ id: '7:5', label: '7:5', ratio: 7 / 5 },
  //{ id: '1:2', label: '1:2', ratio: 1 / 2 },
  //{ id: '2:1', label: '2:1', ratio: 2 }
];

const showUploadNotification = () => {
  return {
    success: (data) => {
      console.log('✅ Загрузка успешна:', data);
      alert(`✅ ${data.message}`);
    },
    error: (data) => {
      console.log('❌ Ошибка загрузки:', data);
      alert(`❌ ${data.message}: ${data.error}`);
    }
  };
};

const ImageEditor = ({ 
  isOpen, 
  imageUrl, 
  imageData,
  onClose,
}) => {
  const { user } = useAuth();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  const apiKey = process.env.REACT_APP_API_KEY;
  
  const [saveFormat, setSaveFormat] = useState('png');
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [saveAction, setSaveAction] = useState('download');
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Состояние для модалки загрузки
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editedImageBlob, setEditedImageBlob] = useState(null);

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
  
  // Новые состояния для обрезки по пропорциям
  const [aspectCropMode, setAspectCropMode] = useState(false);
  const [aspectCropRect, setAspectCropRect] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('original');
  const [isDraggingAspect, setIsDraggingAspect] = useState(false);
  const [isResizingAspect, setIsResizingAspect] = useState(false);
  const [resizeCornerAspect, setResizeCornerAspect] = useState(null);
  const [dragStartAspect, setDragStartAspect] = useState({ x: 0, y: 0 });
  
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
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);

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
    setAspectCropMode(false);
    setAspectCropRect({ x: 0, y: 0, w: 0, h: 0 });
    setSelectedAspectRatio('original');
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
    if (!container) return;
    
    const canvasWidth = container.clientWidth;
    const canvasHeight = container.clientHeight;
    
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

  // ==================== ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ КООРДИНАТ В ОРИГИНАЛЬНОМ РАЗМЕРЕ ====================
  const getOriginalImageCoordinates = (rectOnCanvas) => {
    if (!image || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = image.width;
    const imgHeight = image.height;
    
    // Вычисляем масштаб отображения изображения
    const fitScale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
    const displayScale = fitScale * zoom;
    
    // Вычисляем смещение изображения на канвасе
    const baseOffsetX = (canvasWidth - imgWidth * displayScale) / 2;
    const baseOffsetY = (canvasHeight - imgHeight * displayScale) / 2;
    const offsetX = baseOffsetX + panOffset.x;
    const offsetY = baseOffsetY + panOffset.y;
    
    // Преобразуем координаты из канваса в координаты оригинального изображения
    let originalX = (rectOnCanvas.x - offsetX) / displayScale;
    let originalY = (rectOnCanvas.y - offsetY) / displayScale;
    let originalW = rectOnCanvas.w / displayScale;
    let originalH = rectOnCanvas.h / displayScale;
    
    // Применяем поворот
    if (rotation !== 0) {
      const centerX = imgWidth / 2;
      const centerY = imgHeight / 2;
      const angle = (rotation * Math.PI) / 180;
      
      const rotatePoint = (x, y, centerX, centerY, angle) => {
        const dx = x - centerX;
        const dy = y - centerY;
        const rotatedX = centerX + dx * Math.cos(angle) - dy * Math.sin(angle);
        const rotatedY = centerY + dx * Math.sin(angle) + dy * Math.cos(angle);
        return { x: rotatedX, y: rotatedY };
      };
      
      const corners = [
        { x: originalX, y: originalY },
        { x: originalX + originalW, y: originalY },
        { x: originalX, y: originalY + originalH },
        { x: originalX + originalW, y: originalY + originalH }
      ];
      
      const rotatedCorners = corners.map(corner => 
        rotatePoint(corner.x, corner.y, centerX, centerY, -angle)
      );
      
      const minX = Math.min(...rotatedCorners.map(c => c.x));
      const maxX = Math.max(...rotatedCorners.map(c => c.x));
      const minY = Math.min(...rotatedCorners.map(c => c.y));
      const maxY = Math.max(...rotatedCorners.map(c => c.y));
      
      originalX = minX;
      originalY = minY;
      originalW = maxX - minX;
      originalH = maxY - minY;
    }
    
    // Применяем отражение
    if (flipX) {
      originalX = imgWidth - originalX - originalW;
    }
    if (flipY) {
      originalY = imgHeight - originalY - originalH;
    }
    
    // Ограничиваем координаты границами изображения
    originalX = Math.max(0, Math.min(originalX, imgWidth));
    originalY = Math.max(0, Math.min(originalY, imgHeight));
    originalW = Math.min(originalW, imgWidth - originalX);
    originalH = Math.min(originalH, imgHeight - originalY);
    
    return {
      x: Math.round(originalX),
      y: Math.round(originalY),
      w: Math.max(1, Math.round(originalW)),
      h: Math.max(1, Math.round(originalH))
    };
  };

  // ==================== ФУНКЦИЯ ПРИМЕНЕНИЯ ОБРЕЗКИ С УЧЕТОМ ТРАНСФОРМАЦИЙ ====================
  const applyCropWithTransformations = (originalCrop) => {
    if (!image) return null;
    
    // Создаем временный канвас для применения трансформаций
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return null;
    
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    
    // Применяем поворот и отражение
    tempCtx.save();
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate((rotation * Math.PI) / 180);
    tempCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    tempCtx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);
    tempCtx.restore();
    
    // Обрезаем изображение
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = originalCrop.w;
    croppedCanvas.height = originalCrop.h;
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return null;
    
    croppedCtx.drawImage(
      tempCanvas,
      originalCrop.x, originalCrop.y, originalCrop.w, originalCrop.h,
      0, 0, originalCrop.w, originalCrop.h
    );
    
    return croppedCanvas;
  };

  // ==================== ФУНКЦИИ ОБРЕЗКИ (ОБНОВЛЕННЫЕ) ====================
  
  const getCorner = (x, y) => {
    const margin = 8;
    
    if (Math.abs(x - cropRect.x) < margin && Math.abs(y - cropRect.y) < margin) return 'tl';
    if (Math.abs(x - (cropRect.x + cropRect.w)) < margin && Math.abs(y - cropRect.y) < margin) return 'tr';
    if (Math.abs(x - cropRect.x) < margin && Math.abs(y - (cropRect.y + cropRect.h)) < margin) return 'bl';
    if (Math.abs(x - (cropRect.x + cropRect.w)) < margin && Math.abs(y - (cropRect.y + cropRect.h)) < margin) return 'br';
    
    if (cropRect.w > 0 && cropRect.h > 0) {
      if (Math.abs(x - (cropRect.x + cropRect.w/2)) < margin && Math.abs(y - cropRect.y) < margin) return 'tm';
      if (Math.abs(x - (cropRect.x + cropRect.w/2)) < margin && Math.abs(y - (cropRect.y + cropRect.h)) < margin) return 'bm';
      if (Math.abs(x - cropRect.x) < margin && Math.abs(y - (cropRect.y + cropRect.h/2)) < margin) return 'lm';
      if (Math.abs(x - (cropRect.x + cropRect.w)) < margin && Math.abs(y - (cropRect.y + cropRect.h/2)) < margin) return 'rm';
    }
    
    return null;
  };

  const handleCropMouseDown = (e) => {
    if (!cropMode) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (cropRect.w > 0 && cropRect.h > 0) {
      const corner = getCorner(x, y);
      if (corner) {
        setIsResizing(true);
        setResizeCorner(corner);
        setDragStart({ x, y });
        return;
      }
      
      if (x >= cropRect.x && x <= cropRect.x + cropRect.w && 
          y >= cropRect.y && y <= cropRect.y + cropRect.h) {
        setIsDragging(true);
        setDragStart({ x, y });
        return;
      }
    }
    
    setIsDragging(true);
    setDragStart({ x, y });
    setCropRect({ x, y, w: 0, h: 0 });
  };

  const handleCropMouseMove = (e) => {
    if (!cropMode) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (isResizing && resizeCorner) {
      let newRect = { ...cropRect };
      const minSize = 20;
      
      switch (resizeCorner) {
        case 'tl':
          newRect = {
            x: Math.min(x, cropRect.x + cropRect.w - minSize),
            y: Math.min(y, cropRect.y + cropRect.h - minSize),
            w: Math.max(minSize, Math.abs(cropRect.x + cropRect.w - x)),
            h: Math.max(minSize, Math.abs(cropRect.y + cropRect.h - y))
          };
          break;
        case 'tr':
          newRect = {
            x: cropRect.x,
            y: Math.min(y, cropRect.y + cropRect.h - minSize),
            w: Math.max(minSize, Math.abs(x - cropRect.x)),
            h: Math.max(minSize, Math.abs(cropRect.y + cropRect.h - y))
          };
          break;
        case 'bl':
          newRect = {
            x: Math.min(x, cropRect.x + cropRect.w - minSize),
            y: cropRect.y,
            w: Math.max(minSize, Math.abs(cropRect.x + cropRect.w - x)),
            h: Math.max(minSize, Math.abs(y - cropRect.y))
          };
          break;
        case 'br':
          newRect = {
            x: cropRect.x,
            y: cropRect.y,
            w: Math.max(minSize, Math.abs(x - cropRect.x)),
            h: Math.max(minSize, Math.abs(y - cropRect.y))
          };
          break;
        case 'tm':
          newRect = {
            x: cropRect.x,
            y: Math.min(y, cropRect.y + cropRect.h - minSize),
            w: cropRect.w,
            h: Math.max(minSize, Math.abs(cropRect.y + cropRect.h - y))
          };
          break;
        case 'bm':
          newRect = {
            x: cropRect.x,
            y: cropRect.y,
            w: cropRect.w,
            h: Math.max(minSize, Math.abs(y - cropRect.y))
          };
          break;
        case 'lm':
          newRect = {
            x: Math.min(x, cropRect.x + cropRect.w - minSize),
            y: cropRect.y,
            w: Math.max(minSize, Math.abs(cropRect.x + cropRect.w - x)),
            h: cropRect.h
          };
          break;
        case 'rm':
          newRect = {
            x: cropRect.x,
            y: cropRect.y,
            w: Math.max(minSize, Math.abs(x - cropRect.x)),
            h: cropRect.h
          };
          break;
        default:
          return;
      }
      
      newRect.x = Math.max(0, Math.min(newRect.x, canvas.width - minSize));
      newRect.y = Math.max(0, Math.min(newRect.y, canvas.height - minSize));
      newRect.w = Math.min(newRect.w, canvas.width - newRect.x);
      newRect.h = Math.min(newRect.h, canvas.height - newRect.y);
      
      if (newRect.w >= minSize && newRect.h >= minSize) {
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

const getImageTransformInfo = () => {
  if (!image || !canvasRef.current) return null;

  const canvas = canvasRef.current;
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  const scale = zoom;
  const imgDisplayWidth = image.width * scale;
  const imgDisplayHeight = image.height * scale;

  const imgX = (canvasWidth - imgDisplayWidth) / 2 + panOffset.x;
  const imgY = (canvasHeight - imgDisplayHeight) / 2 + panOffset.y;

  const canvasToOriginalScaleX = image.width / imgDisplayWidth;
  const canvasToOriginalScaleY = image.height / imgDisplayHeight;

  return {
    imgX,
    imgY,
    imgDisplayWidth,
    imgDisplayHeight,
    canvasToOriginalScaleX,
    canvasToOriginalScaleY,
  };
};

const applyCrop = () => {
  if (!image || cropRect.w === 0 || cropRect.h === 0) {
    setCropMode(false);
    return;
  }

  const transformInfo = getImageTransformInfo();
  if (!transformInfo) return;

  const { imgX, imgY, canvasToOriginalScaleX, canvasToOriginalScaleY } = transformInfo;

  let originalX = Math.round((cropRect.x - imgX) * canvasToOriginalScaleX);
  let originalY = Math.round((cropRect.y - imgY) * canvasToOriginalScaleY);
  let originalWidth = Math.round(cropRect.w * canvasToOriginalScaleX);
  let originalHeight = Math.round(cropRect.h * canvasToOriginalScaleY);

  originalX = Math.max(0, Math.min(originalX, image.width - 1));
  originalY = Math.max(0, Math.min(originalY, image.height - 1));

  if (originalX + originalWidth > image.width) {
    originalWidth = image.width - originalX;
  }
  if (originalY + originalHeight > image.height) {
    originalHeight = image.height - originalY;
  }

  originalWidth = Math.max(1, originalWidth);
  originalHeight = Math.max(1, originalHeight);

  console.log('Crop coordinates:', { 
    originalX, originalY, originalWidth, originalHeight,
    imageSize: `${image.width}x${image.height}`
  });

  if (rotation !== 0 || flipX || flipY) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCanvas.width = image.width;
    tempCanvas.height = image.height;

    tempCtx.save();
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate((rotation * Math.PI) / 180);
    tempCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    tempCtx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);
    tempCtx.restore();

    const rotatedCanvas = tempCanvas;
    const rotatedCtx = rotatedCanvas.getContext('2d');
    if (!rotatedCtx) return;

    const imageData = rotatedCtx.getImageData(
      originalX,
      originalY,
      originalWidth,
      originalHeight
    );

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = imageData.width;
    croppedCanvas.height = imageData.height;
    const croppedCtx = croppedCanvas.getContext('2d');
    if (croppedCtx) {
      croppedCtx.putImageData(imageData, 0, 0);
    }

    const croppedImage = new Image();
    croppedImage.onload = () => {
      setCropMode(false);
      setCropRect({ x: 0, y: 0, w: 0, h: 0 });
      setImage(croppedImage);
      setPanOffset({ x: 0, y: 0 });
      setRotation(0);
      setFlipX(false);
      setFlipY(false);

      const container = containerRef.current;
      if (container) {
        const fitZoom = calculateFitZoom(
          croppedImage.width, croppedImage.height,
          container.clientWidth, container.clientHeight
        );
        setBaseZoom(fitZoom);
        setZoom(fitZoom);

        setTimeout(() => {
          if (canvasRef.current && croppedImage) {
            drawImageBase(croppedImage);
            saveToHistory();
          }
        }, 0);
      }
    };
    croppedImage.src = croppedCanvas.toDataURL();

    return;
  }

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  tempCanvas.width = originalWidth;
  tempCanvas.height = originalHeight;

  tempCtx.drawImage(
    image,
    originalX, originalY, originalWidth, originalHeight,
    0, 0, originalWidth, originalHeight
  );

  const croppedImage = new Image();
  croppedImage.onload = () => {
    setCropMode(false);
    setCropRect({ x: 0, y: 0, w: 0, h: 0 });
    setImage(croppedImage);
    setPanOffset({ x: 0, y: 0 });
    setRotation(0);
    setFlipX(false);
    setFlipY(false);

    const container = containerRef.current;
    if (container) {
      const fitZoom = calculateFitZoom(
        croppedImage.width, croppedImage.height,
        container.clientWidth, container.clientHeight
      );
      setBaseZoom(fitZoom);
      setZoom(fitZoom);

      setTimeout(() => {
        if (canvasRef.current && croppedImage) {
          drawImageBase(croppedImage);
          saveToHistory();
        }
      }, 0);
    }
  };
  croppedImage.src = tempCanvas.toDataURL();
};

const applyAspectCrop = () => {
  if (!image || aspectCropRect.w === 0 || aspectCropRect.h === 0) {
    setAspectCropMode(false);
    return;
  }

  const transformInfo = getImageTransformInfo();
  if (!transformInfo) return;

  const { imgX, imgY, canvasToOriginalScaleX, canvasToOriginalScaleY } = transformInfo;

  let originalX = Math.round((aspectCropRect.x - imgX) * canvasToOriginalScaleX);
  let originalY = Math.round((aspectCropRect.y - imgY) * canvasToOriginalScaleY);
  let originalWidth = Math.round(aspectCropRect.w * canvasToOriginalScaleX);
  let originalHeight = Math.round(aspectCropRect.h * canvasToOriginalScaleY);

  originalX = Math.max(0, Math.min(originalX, image.width));
  originalY = Math.max(0, Math.min(originalY, image.height));

  if (originalX + originalWidth > image.width) {
    originalWidth = image.width - originalX;
  }
  if (originalY + originalHeight > image.height) {
    originalHeight = image.height - originalY;
  }

  originalWidth = Math.max(1, originalWidth);
  originalHeight = Math.max(1, originalHeight);

  console.log('Aspect crop coordinates:', { 
    originalX, originalY, originalWidth, originalHeight,
    imageSize: `${image.width}x${image.height}`
  });

  if (rotation !== 0 || flipX || flipY) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCanvas.width = image.width;
    tempCanvas.height = image.height;

    tempCtx.save();
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate((rotation * Math.PI) / 180);
    tempCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    tempCtx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);
    tempCtx.restore();

    const rotatedCtx = tempCanvas.getContext('2d');
    if (!rotatedCtx) return;

    const imageData = rotatedCtx.getImageData(
      originalX,
      originalY,
      originalWidth,
      originalHeight
    );

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = imageData.width;
    croppedCanvas.height = imageData.height;
    const croppedCtx = croppedCanvas.getContext('2d');
    if (croppedCtx) {
      croppedCtx.putImageData(imageData, 0, 0);
    }

    const croppedImage = new Image();
    croppedImage.onload = () => {
      setAspectCropMode(false);
      setAspectCropRect({ x: 0, y: 0, w: 0, h: 0 });
      setImage(croppedImage);
      setPanOffset({ x: 0, y: 0 });
      setRotation(0);
      setFlipX(false);
      setFlipY(false);

      const container = containerRef.current;
      if (container) {
        const fitZoom = calculateFitZoom(
          croppedImage.width, croppedImage.height,
          container.clientWidth, container.clientHeight
        );
        setBaseZoom(fitZoom);
        setZoom(fitZoom);

        setTimeout(() => {
          if (canvasRef.current && croppedImage) {
            drawImageBase(croppedImage);
            saveToHistory();
          }
        }, 0);
      }
    };
    croppedImage.src = croppedCanvas.toDataURL();

    return;
  }

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  tempCanvas.width = originalWidth;
  tempCanvas.height = originalHeight;

  tempCtx.drawImage(
    image,
    originalX, originalY, originalWidth, originalHeight,
    0, 0, originalWidth, originalHeight
  );

  const croppedImage = new Image();
  croppedImage.onload = () => {
    setAspectCropMode(false);
    setAspectCropRect({ x: 0, y: 0, w: 0, h: 0 });
    setImage(croppedImage);
    setPanOffset({ x: 0, y: 0 });
    setRotation(0);
    setFlipX(false);
    setFlipY(false);

    const container = containerRef.current;
    if (container) {
      const fitZoom = calculateFitZoom(
        croppedImage.width, croppedImage.height,
        container.clientWidth, container.clientHeight
      );
      setBaseZoom(fitZoom);
      setZoom(fitZoom);

      setTimeout(() => {
        if (canvasRef.current && croppedImage) {
          drawImageBase(croppedImage);
          saveToHistory();
        }
      }, 0);
    }
  };
  croppedImage.src = tempCanvas.toDataURL();
};

const drawCropOverlayOnly = () => {
  const canvas = canvasRef.current;
  if (!canvas || !cropMode || cropRect.w === 0 || cropRect.h === 0) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();

  const transformInfo = getImageTransformInfo();
  let realWidth = cropRect.w;
  let realHeight = cropRect.h;

  if (transformInfo) {
    realWidth = Math.round(cropRect.w * transformInfo.canvasToOriginalScaleX);
    realHeight = Math.round(cropRect.h * transformInfo.canvasToOriginalScaleY);
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';

  if (cropRect.y > 0) {
    ctx.fillRect(0, 0, canvas.width, cropRect.y);
  }
  if (cropRect.y + cropRect.h < canvas.height) {
    ctx.fillRect(0, cropRect.y + cropRect.h, canvas.width, canvas.height - (cropRect.y + cropRect.h));
  }
  if (cropRect.x > 0) {
    ctx.fillRect(0, cropRect.y, cropRect.x, cropRect.h);
  }
  if (cropRect.x + cropRect.w < canvas.width) {
    ctx.fillRect(cropRect.x + cropRect.w, cropRect.y, canvas.width - (cropRect.x + cropRect.w), cropRect.h);
  }

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

  if (cropRect.w > 30 && cropRect.h > 30) {
    ctx.fillRect(cropRect.x + cropRect.w/2 - markerSize/2, cropRect.y - markerSize/2, markerSize, markerSize);
    ctx.fillRect(cropRect.x + cropRect.w/2 - markerSize/2, cropRect.y + cropRect.h - markerSize/2, markerSize, markerSize);
    ctx.fillRect(cropRect.x - markerSize/2, cropRect.y + cropRect.h/2 - markerSize/2, markerSize, markerSize);
    ctx.fillRect(cropRect.x + cropRect.w - markerSize/2, cropRect.y + cropRect.h/2 - markerSize/2, markerSize, markerSize);
  }

  const sizeText = `${realWidth} × ${realHeight} px`;

  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';

  const textMetrics = ctx.measureText(sizeText);
  const textWidth = textMetrics.width;
  const textHeight = 30;
  const padding = 24;

  const textX = cropRect.x + cropRect.w / 2;
  const textY = cropRect.y + cropRect.h - 15;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(
    textX - textWidth / 2 - padding / 2,
    textY - textHeight + 10,
    textWidth + padding,
    textHeight
  );

  ctx.fillStyle = '#ffffff';
  ctx.fillText(sizeText, textX, textY);

  ctx.restore();
};

const drawAspectCropOverlay = () => {
  const canvas = canvasRef.current;
  if (!canvas || !aspectCropMode || aspectCropRect.w === 0 || aspectCropRect.h === 0) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();

  const transformInfo = getImageTransformInfo();
  let realWidth = aspectCropRect.w;
  let realHeight = aspectCropRect.h;

  if (transformInfo) {
    realWidth = Math.round(aspectCropRect.w * transformInfo.canvasToOriginalScaleX);
    realHeight = Math.round(aspectCropRect.h * transformInfo.canvasToOriginalScaleY);
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';

  if (aspectCropRect.y > 0) {
    ctx.fillRect(0, 0, canvas.width, aspectCropRect.y);
  }
  if (aspectCropRect.y + aspectCropRect.h < canvas.height) {
    ctx.fillRect(0, aspectCropRect.y + aspectCropRect.h, canvas.width, canvas.height - (aspectCropRect.y + aspectCropRect.h));
  }
  if (aspectCropRect.x > 0) {
    ctx.fillRect(0, aspectCropRect.y, aspectCropRect.x, aspectCropRect.h);
  }
  if (aspectCropRect.x + aspectCropRect.w < canvas.width) {
    ctx.fillRect(aspectCropRect.x + aspectCropRect.w, aspectCropRect.y, canvas.width - (aspectCropRect.x + aspectCropRect.w), aspectCropRect.h);
  }

  ctx.strokeStyle = '#0a84ff';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(aspectCropRect.x, aspectCropRect.y, aspectCropRect.w, aspectCropRect.h);

  ctx.fillStyle = '#0a84ff';
  const markerSize = 8;

  ctx.fillRect(aspectCropRect.x - markerSize/2, aspectCropRect.y - markerSize/2, markerSize, markerSize);
  ctx.fillRect(aspectCropRect.x + aspectCropRect.w - markerSize/2, aspectCropRect.y - markerSize/2, markerSize, markerSize);
  ctx.fillRect(aspectCropRect.x - markerSize/2, aspectCropRect.y + aspectCropRect.h - markerSize/2, markerSize, markerSize);
  ctx.fillRect(aspectCropRect.x + aspectCropRect.w - markerSize/2, aspectCropRect.y + aspectCropRect.h - markerSize/2, markerSize, markerSize);

  if (aspectCropRect.w > 30 && aspectCropRect.h > 30) {
    ctx.fillRect(aspectCropRect.x + aspectCropRect.w/2 - markerSize/2, aspectCropRect.y - markerSize/2, markerSize, markerSize);
    ctx.fillRect(aspectCropRect.x + aspectCropRect.w/2 - markerSize/2, aspectCropRect.y + aspectCropRect.h - markerSize/2, markerSize, markerSize);
    ctx.fillRect(aspectCropRect.x - markerSize/2, aspectCropRect.y + aspectCropRect.h/2 - markerSize/2, markerSize, markerSize);
    ctx.fillRect(aspectCropRect.x + aspectCropRect.w - markerSize/2, aspectCropRect.y + aspectCropRect.h/2 - markerSize/2, markerSize, markerSize);
  }

  const sizeText = `${realWidth} × ${realHeight} px`;

  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';

  const textMetrics = ctx.measureText(sizeText);
  const textWidth = textMetrics.width;
  const textHeight = 30;
  const padding = 24;

  const textX = aspectCropRect.x + aspectCropRect.w / 2;
  const textY = aspectCropRect.y + aspectCropRect.h - 15;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(
    textX - textWidth / 2 - padding / 2,
    textY - textHeight + 10,
    textWidth + padding,
    textHeight
  );

  ctx.fillStyle = '#ffffff';
  ctx.fillText(sizeText, textX, textY);

  ctx.restore();
};

// ==================== ФУНКЦИИ ОБРЕЗКИ ПО ПРОПОРЦИЯМ ====================
  
  const getImageDisplayInfo = () => {
    if (!image || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    const scale = zoom;
    const imgWidth = image.width * scale;
    const imgHeight = image.height * scale;
    
    const displayX = (canvasWidth - imgWidth) / 2 + panOffset.x;
    const displayY = (canvasHeight - imgHeight) / 2 + panOffset.y;
    
    return { displayX, displayY, displayWidth: imgWidth, displayHeight: imgHeight };
  };

  const calculateAspectCropRectByRatio = (ratio) => {
    if (!image || !canvasRef.current) return aspectCropRect;

    const canvas = canvasRef.current;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const imgDisplayInfo = getImageDisplayInfo();
    if (!imgDisplayInfo) return aspectCropRect;

    const maxWidth = Math.min(imgDisplayInfo.displayWidth, canvasWidth);
    const maxHeight = Math.min(imgDisplayInfo.displayHeight, canvasHeight);

    let targetWidth, targetHeight;

    if (ratio === null) {
      const imgRatio = image.width / image.height;
      if (imgRatio >= 1) {
        targetWidth = maxWidth;
        targetHeight = targetWidth / imgRatio;
        if (targetHeight > maxHeight) {
          targetHeight = maxHeight;
          targetWidth = targetHeight * imgRatio;
        }
      } else {
        targetHeight = maxHeight;
        targetWidth = targetHeight * imgRatio;
        if (targetWidth > maxWidth) {
          targetWidth = maxWidth;
          targetHeight = targetWidth / imgRatio;
        }
      }
    } else {
      if (ratio >= 1) {
        targetWidth = maxWidth;
        targetHeight = targetWidth / ratio;
        if (targetHeight > maxHeight) {
          targetHeight = maxHeight;
          targetWidth = targetHeight * ratio;
        }
      } else {
        targetHeight = maxHeight;
        targetWidth = targetHeight * ratio;
        if (targetWidth > maxWidth) {
          targetWidth = maxWidth;
          targetHeight = targetWidth / ratio;
        }
      }
    }

    const centerX = imgDisplayInfo.displayX + imgDisplayInfo.displayWidth / 2;
    const centerY = imgDisplayInfo.displayY + imgDisplayInfo.displayHeight / 2;

    return {
      x: centerX - targetWidth / 2,
      y: centerY - targetHeight / 2,
      w: targetWidth,
      h: targetHeight
    };
  };

  const getAspectCorner = (x, y) => {
    const margin = 12;
    
    if (Math.abs(x - aspectCropRect.x) < margin && Math.abs(y - aspectCropRect.y) < margin) return 'tl';
    if (Math.abs(x - (aspectCropRect.x + aspectCropRect.w)) < margin && Math.abs(y - aspectCropRect.y) < margin) return 'tr';
    if (Math.abs(x - aspectCropRect.x) < margin && Math.abs(y - (aspectCropRect.y + aspectCropRect.h)) < margin) return 'bl';
    if (Math.abs(x - (aspectCropRect.x + aspectCropRect.w)) < margin && Math.abs(y - (aspectCropRect.y + aspectCropRect.h)) < margin) return 'br';
    
    if (aspectCropRect.w > 0 && aspectCropRect.h > 0) {
      if (Math.abs(x - (aspectCropRect.x + aspectCropRect.w/2)) < margin && Math.abs(y - aspectCropRect.y) < margin) return 'tm';
      if (Math.abs(x - (aspectCropRect.x + aspectCropRect.w/2)) < margin && Math.abs(y - (aspectCropRect.y + aspectCropRect.h)) < margin) return 'bm';
      if (Math.abs(x - aspectCropRect.x) < margin && Math.abs(y - (aspectCropRect.y + aspectCropRect.h/2)) < margin) return 'lm';
      if (Math.abs(x - (aspectCropRect.x + aspectCropRect.w)) < margin && Math.abs(y - (aspectCropRect.y + aspectCropRect.h/2)) < margin) return 'rm';
    }
    
    return null;
  };

  const handleAspectCropMouseDown = (e) => {
    if (!aspectCropMode) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (aspectCropRect.w > 0 && aspectCropRect.h > 0) {
      const corner = getAspectCorner(x, y);
      if (corner) {
        setIsResizingAspect(true);
        setResizeCornerAspect(corner);
        setDragStartAspect({ x, y });
        return;
      }
      
      if (x >= aspectCropRect.x && x <= aspectCropRect.x + aspectCropRect.w && 
          y >= aspectCropRect.y && y <= aspectCropRect.y + aspectCropRect.h) {
        setIsDraggingAspect(true);
        setDragStartAspect({ x, y });
        return;
      }
    }
    
    const ratioOption = aspectRatios.find(r => r.id === selectedAspectRatio);
    if (ratioOption && ratioOption.ratio) {
      const aspectRatio = ratioOption.ratio;
      let w = 200;
      let h = w / aspectRatio;
      
      setAspectCropRect({
        x: x - w / 2,
        y: y - h / 2,
        w,
        h
      });
    } else {
      setAspectCropRect({
        x: x - 100,
        y: y - 100,
        w: 200,
        h: 200
      });
    }
  };

  const handleAspectCropMouseMove = (e) => {
    if (!aspectCropMode) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const ratioOption = aspectRatios.find(r => r.id === selectedAspectRatio);
    const targetRatio = ratioOption?.ratio;
    
    if (isResizingAspect && resizeCornerAspect && targetRatio) {
      let newRect = { ...aspectCropRect };
      const minSize = 30;
      
      switch (resizeCornerAspect) {
        case 'tl':
          const newWidthTL = aspectCropRect.w + (aspectCropRect.x - x);
          if (newWidthTL >= minSize) {
            newRect.w = newWidthTL;
            newRect.h = newRect.w / targetRatio;
            newRect.x = aspectCropRect.x - (newRect.w - aspectCropRect.w);
            newRect.y = aspectCropRect.y - (newRect.h - aspectCropRect.h);
          }
          break;
        case 'tr':
          const newWidthTR = x - aspectCropRect.x;
          if (newWidthTR >= minSize) {
            newRect.w = newWidthTR;
            newRect.h = newRect.w / targetRatio;
            newRect.y = aspectCropRect.y - (newRect.h - aspectCropRect.h);
          }
          break;
        case 'bl':
          const newWidthBL = aspectCropRect.w + (aspectCropRect.x - x);
          if (newWidthBL >= minSize) {
            newRect.w = newWidthBL;
            newRect.h = newRect.w / targetRatio;
            newRect.x = aspectCropRect.x - (newRect.w - aspectCropRect.w);
          }
          break;
        case 'br':
          const newWidthBR = x - aspectCropRect.x;
          if (newWidthBR >= minSize) {
            newRect.w = newWidthBR;
            newRect.h = newRect.w / targetRatio;
          }
          break;
        case 'tm':
          const newHeightTM = aspectCropRect.h - (y - aspectCropRect.y);
          if (newHeightTM >= minSize) {
            newRect.h = newHeightTM;
            newRect.w = newRect.h * targetRatio;
            newRect.y = y;
          }
          break;
        case 'bm':
          const newHeightBM = y - aspectCropRect.y;
          if (newHeightBM >= minSize) {
            newRect.h = newHeightBM;
            newRect.w = newRect.h * targetRatio;
          }
          break;
        case 'lm':
          const newWidthLM = aspectCropRect.w - (x - aspectCropRect.x);
          if (newWidthLM >= minSize) {
            newRect.w = newWidthLM;
            newRect.h = newRect.w / targetRatio;
            newRect.x = x;
          }
          break;
        case 'rm':
          const newWidthRM = x - aspectCropRect.x;
          if (newWidthRM >= minSize) {
            newRect.w = newWidthRM;
            newRect.h = newRect.w / targetRatio;
          }
          break;
        default:
          return;
      }
      
      const imgDisplayInfo = getImageDisplayInfo();
      if (imgDisplayInfo) {
        newRect.x = Math.max(imgDisplayInfo.displayX, Math.min(newRect.x, imgDisplayInfo.displayX + imgDisplayInfo.displayWidth - newRect.w));
        newRect.y = Math.max(imgDisplayInfo.displayY, Math.min(newRect.y, imgDisplayInfo.displayY + imgDisplayInfo.displayHeight - newRect.h));
      } else {
        newRect.x = Math.max(0, Math.min(newRect.x, canvas.width - minSize));
        newRect.y = Math.max(0, Math.min(newRect.y, canvas.height - minSize));
      }
      
      if (newRect.w >= minSize && newRect.h >= minSize) {
        setAspectCropRect(newRect);
      }
    } 
    else if (isDraggingAspect) {
      const deltaX = x - dragStartAspect.x;
      const deltaY = y - dragStartAspect.y;
      
      let newX = aspectCropRect.x + deltaX;
      let newY = aspectCropRect.y + deltaY;
      
      const imgDisplayInfo = getImageDisplayInfo();
      if (imgDisplayInfo) {
        newX = Math.max(imgDisplayInfo.displayX, Math.min(newX, imgDisplayInfo.displayX + imgDisplayInfo.displayWidth - aspectCropRect.w));
        newY = Math.max(imgDisplayInfo.displayY, Math.min(newY, imgDisplayInfo.displayY + imgDisplayInfo.displayHeight - aspectCropRect.h));
      } else {
        newX = Math.max(0, Math.min(newX, canvas.width - aspectCropRect.w));
        newY = Math.max(0, Math.min(newY, canvas.height - aspectCropRect.h));
      }
      
      setAspectCropRect({
        ...aspectCropRect,
        x: newX,
        y: newY
      });
      setDragStartAspect({ x, y });
    }
  };

  const handleAspectCropMouseUp = () => {
    setIsDraggingAspect(false);
    setIsResizingAspect(false);
    setResizeCornerAspect(null);
  };

  // ==================== ОБРАБОТЧИКИ МЫШИ (ОБНОВЛЕННЫЕ) ====================
  
  const handleCanvasMouseDown = (e) => {
    if (cropMode) {
      e.stopPropagation();
      handleCropMouseDown(e);
    } else if (aspectCropMode) {
      e.stopPropagation();
      handleAspectCropMouseDown(e);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (cropMode) {
      e.stopPropagation();
      handleCropMouseMove(e);
    } else if (aspectCropMode) {
      e.stopPropagation();
      handleAspectCropMouseMove(e);
    }
  };

  const handleCanvasMouseUp = (e) => {
    if (cropMode) {
      e.stopPropagation();
      handleCropMouseUp();
    } else if (aspectCropMode) {
      e.stopPropagation();
      handleAspectCropMouseUp();
    }
  };

  const handleContainerMouseDown = (e) => {
    if (cropMode || aspectCropMode) return;
    
    if (e.button === 0) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleContainerMouseMove = (e) => {
    if (cropMode || aspectCropMode) return;
    
    if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleContainerMouseUp = () => {
    setIsPanning(false);
  };

  // ==================== ОСТАЛЬНЫЕ ФУНКЦИИ ====================
  
  const handleRemoveBackground = async () => {
    if (!image || isRemovingBackground) return;
    
    setIsRemovingBackground(true);
    
    try {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('Cannot create canvas context');
      
      tempCanvas.width = image.width;
      tempCanvas.height = image.height;
      
      tempCtx.save();
      tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
      tempCtx.rotate((rotation * Math.PI) / 180);
      tempCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      tempCtx.filter = getFilters();
      tempCtx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);
      tempCtx.restore();
      
      let finalCanvas = tempCanvas;
      if (cropMode && cropRect.w > 0 && cropRect.h > 0) {
        const originalCrop = getOriginalImageCoordinates(cropRect);
        
        if (originalCrop && originalCrop.w > 0 && originalCrop.h > 0) {
          const croppedCanvas = document.createElement('canvas');
          const croppedCtx = croppedCanvas.getContext('2d');
          if (!croppedCtx) throw new Error('Cannot create cropped canvas');
          
          croppedCanvas.width = originalCrop.w;
          croppedCanvas.height = originalCrop.h;
          
          croppedCtx.drawImage(
            tempCanvas,
            originalCrop.x, originalCrop.y, originalCrop.w, originalCrop.h,
            0, 0, originalCrop.w, originalCrop.h
          );
          
          finalCanvas = croppedCanvas;
        }
      }
      
      const blob = await new Promise((resolve) => {
        finalCanvas.toBlob((blob) => resolve(blob), 'image/png');
      });
      
      const form = new FormData();
      form.append('image_file', blob, 'image.png');
      form.append('format', 'png');
      form.append('size', 'auto');
      form.append('despill', 'medium');
      
      const options = {
        method: 'POST',
        headers: {
          'x-api-key': apiKey
        },
        body: form
      };
      
      const apiResponse = await fetch('https://sdk.photoroom.com/v1/segment', options);
      
      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.status}`);
      }
      
      const processedBlob = await apiResponse.blob();
      const processedUrl = URL.createObjectURL(processedBlob);
      
      const processedImage = new Image();
      processedImage.onload = () => {
        setImage(processedImage);
        setRotation(0);
        setZoom(baseZoom);
        setFlipX(false);
        setFlipY(false);
        setCropMode(false);
        setAspectCropMode(false);
        setCropRect({ x: 0, y: 0, w: 0, h: 0 });
        setAspectCropRect({ x: 0, y: 0, w: 0, h: 0 });
        setPanOffset({ x: 0, y: 0 });
        
        const container = containerRef.current;
        if (container) {
          const fitZoom = calculateFitZoom(
            processedImage.width, processedImage.height,
            container.clientWidth, container.clientHeight
          );
          setBaseZoom(fitZoom);
          setZoom(fitZoom);
        }
        
        setTimeout(() => saveToHistory(), 50);
        URL.revokeObjectURL(processedUrl);
        setIsRemovingBackground(false);
      };
      
      processedImage.onerror = () => {
        throw new Error('Failed to load processed image');
      };
      
      processedImage.src = processedUrl;
      
    } catch (error) {
      console.error('Error removing background:', error);
      alert(`Ошибка при удалении фона: ${error.message}`);
      setIsRemovingBackground(false);
    }
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
    aspectCropRect: { ...aspectCropRect },
    aspectCropMode,
    selectedAspectRatio,
    panOffset: { ...panOffset },
  };

  // Проверяем, не совпадает ли новое состояние с последним
  const lastState = history[historyIndex];
  if (lastState && 
      lastState.rotation === newState.rotation &&
      lastState.zoom === newState.zoom &&
      lastState.flipX === newState.flipX &&
      lastState.flipY === newState.flipY &&
      lastState.activeFilter === newState.activeFilter &&
      JSON.stringify(lastState.adjustments) === JSON.stringify(newState.adjustments) &&
      JSON.stringify(lastState.cropRect) === JSON.stringify(newState.cropRect) &&
      lastState.cropMode === newState.cropMode &&
      JSON.stringify(lastState.aspectCropRect) === JSON.stringify(newState.aspectCropRect) &&
      lastState.aspectCropMode === newState.aspectCropMode &&
      lastState.selectedAspectRatio === newState.selectedAspectRatio) {
    return; // Состояние не изменилось, не сохраняем
  }

  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(newState);
  setHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
}, [history, historyIndex, rotation, zoom, flipX, flipY, activeFilter, adjustments, cropRect, cropMode, aspectCropRect, aspectCropMode, selectedAspectRatio, panOffset]);


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
  setAspectCropRect(state.aspectCropRect);
  setAspectCropMode(state.aspectCropMode);
  setSelectedAspectRatio(state.selectedAspectRatio);
  setPanOffset(state.panOffset || { x: 0, y: 0 });
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
  setAspectCropMode(false);
  setCropRect({ x: 0, y: 0, w: 0, h: 0 });
  setAspectCropRect({ x: 0, y: 0, w: 0, h: 0 });
  setSelectedAspectRatio('original');
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
    fetch(imageUrl)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          setImage(img);
          URL.revokeObjectURL(url);
          // После сброса очищаем историю и создаем новое начальное состояние
          setTimeout(() => {
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const initialState = {
                  imageData,
                  rotation: 0,
                  zoom: baseZoom,
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
                  aspectCropRect: { x: 0, y: 0, w: 0, h: 0 },
                  aspectCropMode: false,
                  selectedAspectRatio: 'original',
                  panOffset: { x: 0, y: 0 },
                };
                setHistory([initialState]);
                setHistoryIndex(0);
              }
            }
          }, 100);
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

  // Создание Blob для сохранения в исходном размере
  const createImageBlob = (format, quality) => {
    return new Promise((resolve) => {
      if (!image) return;
      
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;
      
      tempCanvas.width = image.width;
      tempCanvas.height = image.height;
      
      tempCtx.save();
      tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
      tempCtx.rotate((rotation * Math.PI) / 180);
      tempCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      tempCtx.filter = getFilters();
      tempCtx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);
      tempCtx.restore();
      
      let finalCanvas = tempCanvas;
      
      if (cropMode && cropRect.w > 0 && cropRect.h > 0) {
        const originalCrop = getOriginalImageCoordinates(cropRect);
        
        if (originalCrop && originalCrop.w > 0 && originalCrop.h > 0) {
          const croppedCanvas = document.createElement('canvas');
          const croppedCtx = croppedCanvas.getContext('2d');
          if (!croppedCtx) return;
          
          croppedCanvas.width = originalCrop.w;
          croppedCanvas.height = originalCrop.h;
          
          croppedCtx.drawImage(
            tempCanvas,
            originalCrop.x, originalCrop.y, originalCrop.w, originalCrop.h,
            0, 0, originalCrop.w, originalCrop.h
          );
          
          finalCanvas = croppedCanvas;
        }
      } else if (aspectCropMode && aspectCropRect.w > 0 && aspectCropRect.h > 0) {
        const originalCrop = getOriginalImageCoordinates(aspectCropRect);
        
        if (originalCrop && originalCrop.w > 0 && originalCrop.h > 0) {
          const croppedCanvas = document.createElement('canvas');
          const croppedCtx = croppedCanvas.getContext('2d');
          if (!croppedCtx) return;
          
          croppedCanvas.width = originalCrop.w;
          croppedCanvas.height = originalCrop.h;
          
          croppedCtx.drawImage(
            tempCanvas,
            originalCrop.x, originalCrop.y, originalCrop.w, originalCrop.h,
            0, 0, originalCrop.w, originalCrop.h
          );
          
          finalCanvas = croppedCanvas;
        }
      }
      
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
      
      finalCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, mimeType, quality);
    });
  };

  const handleDownloadClick = () => {
    setSaveAction('download');
    setShowFormatModal(true);
  };

  const handleSaveAsClick = async () => {
    const quality = saveFormat === 'png' ? undefined : 0.92;
    const blob = await createImageBlob(saveFormat, quality);
    setEditedImageBlob(blob);
    setShowUploadModal(true);
  };

  // Обработка выбора формата и открытие модалки загрузки
  const handleConfirmFormat = async () => {
    setIsSaving(true);
    
    try {
      const quality = saveFormat === 'png' ? undefined : 0.92;
      const blob = await createImageBlob(saveFormat, quality);
      
      if (saveAction === 'download') {
        const fileName = getSaveFileName();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setShowFormatModal(false);
      } else {
        setEditedImageBlob(blob);
        setShowFormatModal(false);
        setShowUploadModal(true);
      }
    } catch (err) {
      console.error('Operation failed:', err);
      alert(saveAction === 'download' ? 'Не удалось скачать изображение' : 'Не удалось подготовить изображение');
    } finally {
      setIsSaving(false);
    }
  };

  const convertToWebP = (blob) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((webpBlob) => {
          if (webpBlob) {
            resolve(webpBlob);
          } else {
            reject(new Error('Не удалось конвертировать в WEBP'));
          }
        }, 'image/webp', 0.92);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Не удалось загрузить изображение для конвертации'));
      };
      
      img.src = url;
    });
  };

  const handleUpload = async (finalFileName, allTags) => {
    if (!editedImageBlob) return;

    const uploadNotification = showUploadNotification();

    try {
      const shouldConvertToWebp = editedImageBlob.type.startsWith('image/') && 
                                 editedImageBlob.type !== 'image/webp';
      
      let fileToUpload;
      let finalFileNameWithExt = finalFileName;

      if (shouldConvertToWebp) {
        const webpBlob = await convertToWebP(editedImageBlob);
        
        if (!finalFileName.toLowerCase().endsWith('.webp')) {
          finalFileNameWithExt = finalFileName.replace(/\.[^/.]+$/, '') + '.webp';
        }
        
        fileToUpload = new File([webpBlob], finalFileNameWithExt, {
          type: 'image/webp',
          lastModified: Date.now()
        });
        
      } else {
        fileToUpload = new File(
          [editedImageBlob], 
          finalFileName, 
          {
            type: editedImageBlob.type,
            lastModified: Date.now()
          }
        );
      }

      const result = await uploadGraphicFile(
        user.company[0].id,
        fileToUpload,
        null, 
        allTags 
      );

      uploadNotification.success({
        title: `Файл ${finalFileNameWithExt}`,
        message: "Успешно загружен",
        error: null
      });

      setShowUploadModal(false);
      setEditedImageBlob(null);

    } catch (error) {
      uploadNotification.error({
        title: 'Ошибка',
        message: `Не удалось загрузить файл "${finalFileName}"`,
        error: error.message
      });
    }
  };

  useEffect(() => {
  if (historyIndex === -1) return;

  const timer = setTimeout(() => {
    saveToHistory();
  }, 100);

  return () => clearTimeout(timer);
}, [rotation, zoom, flipX, flipY, activeFilter, adjustments, cropRect, cropMode, aspectCropRect, aspectCropMode, selectedAspectRatio, panOffset, saveToHistory]);

  useEffect(() => {
    if (image) {
      drawImageBase(image);
      if (cropMode && cropRect.w > 0 && cropRect.h > 0) {
        drawCropOverlayOnly();
      }
      if (aspectCropMode && aspectCropRect.w > 0 && aspectCropRect.h > 0) {
        drawAspectCropOverlay();
      }
    }
  }, [image, rotation, zoom, flipX, flipY, activeFilter, adjustments, cropMode, cropRect, aspectCropMode, aspectCropRect, panOffset]);

  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
  }, [image, zoom, rotation, flipX, flipY, baseZoom]);

  useEffect(() => {
    if (image && containerRef.current) {
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      const fitZoom = calculateFitZoom(
        image.width, image.height,
        containerWidth, containerHeight
      );
      
      setBaseZoom(fitZoom);
      setZoom(fitZoom);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [image]);

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
              backgroundColor: value > 0 ? '#3b82f6' : '#3b82f6'
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

              <button
                className={`${styles.transformButton} ${isRemovingBackground ? styles.loading : ''}`}
                onClick={handleRemoveBackground}
                disabled={isRemovingBackground}
              >
                {isRemovingBackground ? (
                  <div className={styles.spinner} />
                ) : (
                  <PiMagicWand size={20} />
                )}
              </button>

              <div className={styles.transformDivider} />

              <div className={styles.cropWrapper}>
                <button
                  className={`${styles.transformButton} ${cropMode ? styles.active : ''}`}
                  onClick={() => {
                    setCropMode(!cropMode);
                    if (aspectCropMode) setAspectCropMode(false);
                  }}
                >
                  <RiScissorsCutLine size={20} />
                </button>
                {cropMode && cropRect.w > 0 && (
                  <button
                    className={styles.applyCropButton}
                    onClick={applyCrop}
                  >
                    Вырезать
                  </button>
                )}
              </div>

              <div className={styles.cropWrapper}>
                <button
                  className={`${styles.transformButton} ${aspectCropMode ? styles.active : ''}`}
                  onClick={() => {
                    setAspectCropMode(!aspectCropMode);
                    if (cropMode) setCropMode(false);
                    if (!aspectCropMode) {
                      const ratioOption = aspectRatios.find(r => r.id === selectedAspectRatio);
                      const newRect = calculateAspectCropRectByRatio(ratioOption?.ratio || null);
                      setAspectCropRect(newRect);
                    }
                  }}
                >
                  <FiCrop size={20} />
                </button>
                {aspectCropMode && aspectCropRect.w > 0 && (
                  <button
                    className={styles.applyCropButton}
                    onClick={applyAspectCrop}
                  >
                    Обрезать
                  </button>
                )}
              </div>
            </div>

            <div className={styles.editorHeaderRight}>
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
                  </div>
                )}
              </div>
              
              <button
                className={styles.cancelButton}
                onClick={onClose}
              >
                Закрыть
              </button>
            </div>
          </div>

          <div className={styles.editorContent}>
            <div 
              ref={containerRef} 
              className={styles.canvasContainer}
              onMouseDown={handleContainerMouseDown}
              onMouseMove={handleContainerMouseMove}
              onMouseUp={handleContainerMouseUp}
              onMouseLeave={handleContainerMouseUp}
              style={{ 
                cursor: cropMode || aspectCropMode ? 'crosshair' : (isPanning ? 'grabbing' : 'grab')
              }}
            >
              {loading ? (
                <div className={styles.loader}>Загрузка изображения...</div>
              ) : (
                <canvas
                  ref={canvasRef}
                  className={styles.canvas}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
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
                    
            <div className={styles.aspectRatiosBar}>
              {aspectCropMode && (<div className={styles.aspectRatiosContainer}>
                {aspectRatios.map(ratio => (
                  <button
                    key={ratio.id}
                    className={`${styles.aspectRatioButton} ${selectedAspectRatio === ratio.id ? styles.active : ''}`}
                    onClick={() => {
                      setSelectedAspectRatio(ratio.id);
                      const newRect = calculateAspectCropRectByRatio(ratio.ratio);
                      setAspectCropRect(newRect);
                    }}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>)}
            </div>
          
        </div>
      </div>

      {showFormatModal && (
        <div 
          className={styles.formatModalOverlay} 
          onClick={(e) => {
            e.stopPropagation(); 
            setShowFormatModal(false)
          }}
        >
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
                onClick={handleConfirmFormat}
                disabled={isSaving}
              >
                {isSaving ? 'Обработка...' : (saveAction === 'download' ? 'Скачать' : 'Далее')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка загрузки */}
      {showUploadModal && (
        <ImageEditedUploadModal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setEditedImageBlob(null);
          }}
          onUpload={handleUpload}
          user={user}
          selectedFile={editedImageBlob ? new File([editedImageBlob], 'image.png', { type: editedImageBlob.type }) : null}
          existingImageData={imageData}
        />
      )}
    </>,
    document.body
  );
};

export default ImageEditor;