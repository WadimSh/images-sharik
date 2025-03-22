import { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { ImageElement } from '../../components/ImageElement';
import { ShapeElement } from '../../components/ShapeElement';
import { TextElement } from '../../components/TextElement';

export const Generator = () => {
  const { id } = useParams();
  const captureRef = useRef(null);
  const [elements, setElements] = useState([]);
  const [selectedElementType, setSelectedElementType] = useState('');
  
  const fileInputRef = useRef(null);

  // Добавляем начальный текстовый элемент с ID
  useEffect(() => {
    if (id) {
      setElements([{
        id: Date.now(),
        type: 'text',
        position: { x: 50, y: 50 },
        text: id,
        image: null
      }]);
    }
  }, [id]);

  const handleAddElement = (type) => {
    if (type === 'image') {
      fileInputRef.current.click();
      setSelectedElementType('');
      return;
    }
    const newElement = {
      id: Date.now(),
      type,
      position: { x: 50, y: 50 },
      text: type === 'text' ? 'Новый текст' : '',
      image: null
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElementType('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Создаем элемент с изображением напрямую
        const newElement = {
          id: Date.now(),
          type: 'image',
          position: { x: 50, y: 50 },
          image: event.target.result // Сохраняем DataURL здесь
        };
        setElements(prev => [...prev, newElement]);
        setSelectedElementType('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (id, newPosition) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, position: newPosition } : el
    ));
  };

  const handleRemoveElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
  };

  const handleDownload = async () => {
    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const link = document.createElement('a');
      link.download = 'design.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Ошибка генерации:', error);
      alert('Ошибка при генерации изображения!');
    }
  };

  return (
    <div className="generator-container">
      <div className="header-section">
        <h2>Генератор изображений для маркетплейсов</h2>
        <p style={{
          fontSize: '16px',
          color: 'rgba(0,0,0,0.7)',
          marginBottom: '18px'
        }}>Обратите внимание, что перед тем, как изображение будет готово, у вас есть возможность<br />  
        самостоятельно внести изменения в финальный вариант.</p>
        
        <div className="controls-group">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="hidden-input"
          />

          <select 
            value={selectedElementType}
            onChange={(e) => {
              const type = e.target.value;
              setSelectedElementType(type);
              if (type) handleAddElement(type);
            }}
            className="element-selector"
          >
            <option value="" disabled hidden>Добавить элемент...</option>
            <option value="image">Изображение</option>
            <option value="text">Текст</option>
            <option value="shape">Квадрат</option>
          </select>
        </div>
      </div>

      <div ref={captureRef} className="design-container">
        {elements.map((element) => {
          switch (element.type) {
            case 'image':
              return (
                <ImageElement
                  key={element.id}
                  src={element.image} // Берем изображение из данных элемента
                  position={element.position}
                  onDrag={(pos) => handleDrag(element.id, pos)}
                  onRemove={() => handleRemoveElement(element.id)}
                  containerWidth={450}
                  containerHeight={600}
                />
              );
            case 'shape':
              return (
                <ShapeElement
                  key={element.id}
                  position={element.position}
                  onDrag={(pos) => handleDrag(element.id, pos)}
                  onRemove={() => handleRemoveElement(element.id)}
                  containerWidth={450}
                  containerHeight={600}
                />
              );
            case 'text':
              return (
                <TextElement
                  key={element.id}
                  text={element.text}
                  position={element.position}
                  onDrag={(pos) => handleDrag(element.id, pos)}
                  onRemove={() => handleRemoveElement(element.id)}
                  onTextChange={(newText) => {
                    setElements(prev => prev.map(el => 
                      el.id === element.id ? {...el, text: newText} : el
                    ));
                  }}
                  containerWidth={450}
                  containerHeight={600}
                />
              );
            default:
              return null;
          }
        })}
      </div>

      <button 
        onClick={handleDownload} 
        className="download-button"
      >
        Скачать дизайн
      </button>
    </div>
  );
};