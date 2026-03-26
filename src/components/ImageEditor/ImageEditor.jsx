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

  // ==================== ФУНКЦИИ ОБРЕЗКИ ====================
  
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

  const drawCropOverlayOnly = () => {
    const canvas = canvasRef.current;
    if (!canvas || !cropMode || cropRect.w === 0 || cropRect.h === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    
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
    ctx.lineWidth = 2;
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
    
    ctx.restore();
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

    const croppedImage = new Image();
    croppedImage.onload = () => {
      setCropMode(false);
      setCropRect({ x: 0, y: 0, w: 0, h: 0 });
      setImage(croppedImage);
      
      setPanOffset({ x: 0, y: 0 });
      
      const container = containerRef.current;
      if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const fitZoom = calculateFitZoom(
          croppedImage.width, croppedImage.height,
          containerWidth, containerHeight
        );
        
        setBaseZoom(fitZoom);
        setZoom(fitZoom);
        
        setTimeout(() => {
          if (canvasRef.current && croppedImage) {
            drawImageBase(croppedImage);
          }
        }, 0);
      }
      
      saveToHistory();
    };
    croppedImage.src = tempCanvas.toDataURL();
  };

  // ==================== ОБРАБОТЧИКИ МЫШИ ====================
  
  const handleCanvasMouseDown = (e) => {
    if (cropMode) {
      e.stopPropagation();
      handleCropMouseDown(e);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (cropMode) {
      e.stopPropagation();
      handleCropMouseMove(e);
    }
  };

  const handleCanvasMouseUp = (e) => {
    if (cropMode) {
      e.stopPropagation();
      handleCropMouseUp();
    }
  };

  const handleContainerMouseDown = (e) => {
    if (cropMode) return;
    
    if (e.button === 0) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleContainerMouseMove = (e) => {
    if (cropMode) return;
    
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
    // Создаем временный canvas для получения текущего отредактированного изображения
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) throw new Error('Cannot create canvas context');
    
    // Устанавливаем размеры canvas как у оригинального изображения
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    
    // Применяем все текущие трансформации к изображению
    tempCtx.save();
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate((rotation * Math.PI) / 180);
    tempCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    tempCtx.filter = getFilters();
    tempCtx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);
    tempCtx.restore();
    
    // Если есть активная обрезка, применяем её
    let finalCanvas = tempCanvas;
    if (cropMode && cropRect.w > 0 && cropRect.h > 0) {
      const croppedCanvas = document.createElement('canvas');
      const croppedCtx = croppedCanvas.getContext('2d');
      if (!croppedCtx) throw new Error('Cannot create cropped canvas');
      
      croppedCanvas.width = cropRect.w;
      croppedCanvas.height = cropRect.h;
      
      croppedCtx.drawImage(
        tempCanvas,
        cropRect.x, cropRect.y, cropRect.w, cropRect.h,
        0, 0, cropRect.w, cropRect.h
      );
      
      finalCanvas = croppedCanvas;
    }
    
    // Конвертируем canvas в blob
    const blob = await new Promise((resolve) => {
      finalCanvas.toBlob((blob) => resolve(blob), 'image/png');
    });
    
    // Формируем запрос к API
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
    
    // Отправляем запрос
    const apiResponse = await fetch('https://sdk.photoroom.com/v1/segment', options);
    
    if (!apiResponse.ok) {
      throw new Error(`API error: ${apiResponse.status}`);
    }
    
    // Получаем обработанное изображение
    const processedBlob = await apiResponse.blob();
    
    // Создаем URL для обработанного изображения
    const processedUrl = URL.createObjectURL(processedBlob);
    
    // Загружаем обработанное изображение
    const processedImage = new Image();
    processedImage.onload = () => {
      // Обновляем изображение
      setImage(processedImage);
      
      // Сбрасываем трансформации
      setRotation(0);
      setZoom(baseZoom);
      setFlipX(false);
      setFlipY(false);
      setCropMode(false);
      setCropRect({ x: 0, y: 0, w: 0, h: 0 });
      setPanOffset({ x: 0, y: 0 });
      
      // Пересчитываем масштаб для нового изображения
      const container = containerRef.current;
      if (container) {
        const fitZoom = calculateFitZoom(
          processedImage.width, processedImage.height,
          container.clientWidth, container.clientHeight
        );
        setBaseZoom(fitZoom);
        setZoom(fitZoom);
      }
      
      // Сохраняем в историю
      setTimeout(() => saveToHistory(), 50);
      
      // Освобождаем URL
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
      fetch(imageUrl)
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
        const originalCrop = getCropRectForOriginalSize();
        
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

  const getCropRectForOriginalSize = () => {
    if (!image || !cropMode || cropRect.w === 0 || cropRect.h === 0) return null;
    
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = image.width;
    const imgHeight = image.height;
    
    const fitScale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
    const currentZoom = zoom;
    const displayScale = fitScale * currentZoom;
    
    const baseOffsetX = (canvasWidth - imgWidth * displayScale) / 2;
    const baseOffsetY = (canvasHeight - imgHeight * displayScale) / 2;
    const offsetX = baseOffsetX + panOffset.x;
    const offsetY = baseOffsetY + panOffset.y;
    
    let originalX = (cropRect.x - offsetX) / displayScale;
    let originalY = (cropRect.y - offsetY) / displayScale;
    let originalW = cropRect.w / displayScale;
    let originalH = cropRect.h / displayScale;
    
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
    
    if (flipX) {
      originalX = imgWidth - originalX - originalW;
    }
    if (flipY) {
      originalY = imgHeight - originalY - originalH;
    }
    
    return {
      x: Math.max(0, Math.min(originalX, imgWidth)),
      y: Math.max(0, Math.min(originalY, imgHeight)),
      w: Math.min(originalW, imgWidth - Math.max(0, originalX)),
      h: Math.min(originalH, imgHeight - Math.max(0, originalY))
    };
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
        // Скачивание
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
        // Сохранение на сервер - сохраняем blob и открываем модалку загрузки
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

  // Обработка загрузки на сервер
// Внутри компонента ImageEditor добавьте или замените функцию handleUpload:

const handleUpload = async (finalFileName, allTags) => {
  if (!editedImageBlob) return;

  const uploadNotification = showUploadNotification();

  try {
    // Определяем, нужно ли конвертировать в WEBP
    const shouldConvertToWebp = editedImageBlob.type.startsWith('image/') && 
                               editedImageBlob.type !== 'image/webp';
    
    let fileToUpload;
    let finalFileNameWithExt = finalFileName;

    if (shouldConvertToWebp) {
      // Конвертируем изображение в WEBP
      const webpBlob = await convertToWebP(editedImageBlob);
      
      // Меняем расширение файла на .webp если нужно
      if (!finalFileName.toLowerCase().endsWith('.webp')) {
        finalFileNameWithExt = finalFileName.replace(/\.[^/.]+$/, '') + '.webp';
      }
      
      fileToUpload = new File([webpBlob], finalFileNameWithExt, {
        type: 'image/webp',
        lastModified: Date.now()
      });
      
    } else {
      // Если это уже WEBP или не изображение, используем оригинал
      fileToUpload = new File(
        [editedImageBlob], 
        finalFileName, 
        {
          type: editedImageBlob.type,
          lastModified: Date.now()
        }
      );
    }

    // Загружаем файл
    const result = await uploadGraphicFile(
      user.company[0].id,
      fileToUpload,
      null, 
      allTags 
    );

    // Показываем успешное уведомление
    uploadNotification.success({
      title: `Файл ${finalFileNameWithExt}`,
      message: "Успешно загружен",
      error: null
    });

    // Закрываем все модалки после успешной загрузки
    setShowUploadModal(false);
    setEditedImageBlob(null);
    
    // Опционально: закрываем редактор
    // onClose();

  } catch (error) {
    // Показываем уведомление об ошибке
    uploadNotification.error({
      title: 'Ошибка',
      message: `Не удалось загрузить файл "${finalFileName}"`,
      error: error.message
    });
  }
};

// Функция конвертации в WEBP (добавьте вне компонента или внутри)
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

  useEffect(() => {
    if (image) {
      drawImageBase(image);
      if (cropMode && cropRect.w > 0 && cropRect.h > 0) {
        drawCropOverlayOnly();
      }
    }
  }, [image, rotation, zoom, flipX, flipY, activeFilter, adjustments, cropMode, cropRect, panOffset]);

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
                  onClick={() => setCropMode(!cropMode)}
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
                cursor: cropMode ? 'crosshair' : (isPanning ? 'grabbing' : 'grab')
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