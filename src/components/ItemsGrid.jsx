import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const PreviewDesign = ({ elements }) => {
  return (
    <div className="preview-container">
      {elements.map((element) => {
        const style = {
          left: `${(element.position.x / 450) * 100}%`,
          top: `${(element.position.y / 600) * 100}%`,
          width: `${(element.width / 450) * 100}%`,
          height: `${(element.height / 600) * 100}%`,
          transform: `rotate(${element.rotation}deg)`,
          position: 'absolute'
        };

        switch (element.type) {
          case 'image':
            return <img key={element.id} src={element.image} alt="preview" 
                     style={{
                      ...style,
                      objectFit: 'cover',
                    }} className="preview-element" />;
          case 'text':
            return (
              <div key={element.id} style={{
                ...style, 
                fontSize: `${(element.fontSize || 24) * 0.61}px`,
                fontFamily: element.fontFamily,
                color: element.color,
                whiteSpace: 'nowrap'
              }} className="preview-text">
                {element.text}
              </div>
            );
          case 'shape':
            return <div key={element.id} 
                     style={{...style, backgroundColor: element.color}} 
                     className="preview-shape" />;
          default:
            return null;
        }
      })}
    </div>
  );
};


const ItemsGrid = ({ items, onItemsUpdate, templates }) => {
  const navigate = useNavigate();
  const [baseCodesOrder, setBaseCodesOrder] = useState([]);
  const [selectedTemplates, setSelectedTemplates] = useState({});

  // Инициализируем порядок при первом рендере
  useEffect(() => {
    const initialOrder = [...new Set(items.map(item => item.split('_').slice(0, -1).join('_')))];
    setBaseCodesOrder(initialOrder);
  }, []);

  // Обновляем порядок при изменениях
  useEffect(() => {
    const newCodes = items.map(item => item.split('_').slice(0, -1).join('_'));
    const uniqueNewCodes = [...new Set(newCodes)];
    
    // Сохраняем исходный порядок, добавляя новые группы в конец
    setBaseCodesOrder(prev => {
      const preservedOrder = prev.filter(code => uniqueNewCodes.includes(code));
      const newGroups = uniqueNewCodes.filter(code => !prev.includes(code));
      return [...preservedOrder, ...newGroups];
    });
  }, [items]);

  // Функция для создания нового дизайна
  const handleCreateNewDesign = (baseCode) => {
    const existingNumbers = items
      .filter(item => item.startsWith(`${baseCode}_`))
      .map(item => parseInt(item.split('_')[1]))
      .filter(num => !isNaN(num));
    
    const newNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const newDesignKey = `${baseCode}_${newNumber}`;
  
    const productMeta = JSON.parse(
      sessionStorage.getItem(`product-${baseCode}`) || '{}'
    );
    
    const newDesign = {
      id: Date.now(),
      type: "image",
      position: { x: 19, y: 85 },
      image: productMeta.images[0],
      width: 415,
      height: 415,
      originalWidth: 400,
      originalHeight: 400
    };
  
    sessionStorage.setItem(`design-${newDesignKey}`, JSON.stringify([newDesign]));
    
    onItemsUpdate([...items, newDesignKey]);
    navigate(`/template/${newDesignKey}`);
  };
  
  // Функция для получения уникальных базовых артикулов
  const getUniqueBaseCodes = () => {
    return baseCodesOrder.filter(baseCode => 
      items.some(item => item.startsWith(`${baseCode}_`))
    );
  };

  const uniqueBaseCodes = getUniqueBaseCodes();

  const handleItemClick = (itemId) => {
    navigate(`/template/${itemId}`);
  };

  // Функция удаления элемента
  const handleDeleteItem = (itemId) => {
    // Удаляем из sessionStorage
    sessionStorage.removeItem(`design-${itemId}`);
    // Обновляем список элементов
    const updatedItems = items.filter(item => item !== itemId);
    onItemsUpdate(updatedItems);

    // Проверяем нужно ли удалять метаданные товара
    const productCode = itemId.split('_').slice(0, -1).join('_');
    const remaining = items.filter(item => item.startsWith(`${productCode}_`));
    console.log(remaining)
    if (remaining.length === 1) {
      sessionStorage.removeItem(`product-${productCode}`);
    }
  };

  const handleTemplateChange = (baseCode, templateKey) => {
    // Обновляем состояние выбранного шаблона
    setSelectedTemplates(prev => ({
      ...prev,
      [baseCode]: templateKey
    }));
  };

  return (
    <div className="items-grid-container">
      {uniqueBaseCodes.map((baseCode) => {
        const currentTemplate = selectedTemplates[baseCode] || 'default';
        // Находим все элементы относящиеся к этому базовому коду
        const relatedItems = items.filter(item => item.startsWith(baseCode + '_'));
        const productMeta = JSON.parse(
          sessionStorage.getItem(`product-${baseCode}`) || '{}'
        );
        return (
          <div key={baseCode}>
            <h2 className="item-title">
              {baseCode}
              {productMeta.name && <span className="item-subtitle">  {productMeta.name}</span>}
            </h2>
            <div className="template-selector">
              {Object.keys(templates).map(templateKey => (
                <label key={templateKey}>
                  <input
                    type="radio"
                    name={`template-${baseCode}`}
                    value={templateKey}
                    checked={currentTemplate === templateKey}
                    onChange={() => handleTemplateChange(baseCode, templateKey)}
                  />
                  {templateKey}
                </label>
              ))}
            </div>
            <div className="items-grid">
              {relatedItems.map((item, index) => {
                const designData = sessionStorage.getItem(`design-${item}`);
                const elements = designData ? JSON.parse(designData) : null;

                return (
                  <div 
                    key={item} 
                    className="item-card"
                    onClick={() => handleItemClick(item)}
                    role="button"
                    tabIndex={0}
                  >
                    {/* Кнопка удаления */}
                    <button
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item);
                      }}
                      title="Удалить дизайн"
                    >
                      ×
                    </button>
                    
                    <div className="item-content">
                      {elements ? (
                        <PreviewDesign elements={elements} />
                      ) : (
                        <span className="item-article">{item}</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Карточка для создания нового дизайна */}
              <div
                className="item-card new-design-card"
                onClick={() => handleCreateNewDesign(baseCode)}
                role="button"
                tabIndex={0}
              >
                <div className="item-content new-design-content">
                  <div className="plus-sign">+</div>
                  <div className="create-text">Создать новый слайдер</div>
                </div>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ItemsGrid;