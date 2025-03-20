import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';

import DraggableElement from '../../components/DraggableElement';

export const Generator = () => {
  const { id } = useParams();
  const captureRef = useRef(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  // Логика перемещения элемента
  const handleDrag = (newPosition) => {
    setPosition(newPosition);
  };

  // Логика скачивания изображения
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
    <div style={{ padding: '20px', fontFamily: 'Arial', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ 
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        textAlign: 'center',
        marginBottom: '24px'
      }}>
        <h2>Генератор изображений для маркетплейсов</h2>
        <p style={{
          fontSize: '16px',
          color: 'rgba(0,0,0,0.7)',
          marginBottom: '34px'
        }}>
          Обратите внимание, что перед тем, как изображение будет готово, у вас есть возможность<br />  
          самостоятельно внести изменения в финальный вариант.
        </p>
      </div>

      <div 
        ref={captureRef}
        style={{
          position: 'relative',
          width: '450px',
          height: '600px',
          borderRadius: '0px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          backgroundImage: `
            radial-gradient(
              circle at 5px 5px, #e0e0e0 1px, transparent 1px
            )
          `,
          backgroundSize: '10px 10px',
          boxShadow: '0 0 20px rgba(0,0,0,0.1)'
        }}
      >
        <DraggableElement
          position={position}
          onDrag={handleDrag}
          containerWidth={450}
          containerHeight={600}
        >
          <div style={{ 
            color: '#333333',
            fontSize: '24px',
            fontFamily: 'Arial',
            backgroundColor: 'transparent'
          }}>
            {id}
          </div>
        </DraggableElement>
        
      </div>

        <button 
          onClick={handleDownload}
          className='search-button'
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '264px',
            margin: '24px auto'
          }}
        >
          Скачать дизайн
      </button>
    </div>
  );
};
