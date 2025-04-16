import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { replacePlaceholders } from '../utils/replacePlaceholders';

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
              <span key={element.id} style={{
                ...style, 
                fontSize: `${(element.fontSize || 24) * 0.61}px`,
                fontFamily: element.fontFamily,
                color: element.color,
                whiteSpace: 'nowrap'
              }} className="preview-text">
                {element.text}
              </span>
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
  
    // Получаем метаданные продукта
    const productMeta = JSON.parse(
      sessionStorage.getItem(`product-${baseCode}`) || '{}'
    );
  
    // Базовые данные для шаблона
    const templateData = {
      code: newDesignKey,
      image: productMeta.images?.[0] || '',
      category: productMeta.properties?.find(p => p.name === 'Товарная номенклатура')?.value?.toLowerCase() || '',
      title: productMeta.properties?.find(p => p.name === 'Тип латексных шаров')?.value || '',
      multiplicity: productMeta.multiplicity,
      size: productMeta.properties?.find(p => p.name === 'Размер')?.value?.split("/")[0]?.trim() || '',
      brand: productMeta.originProperties?.find(p => p.name === 'Торговая марка')?.value || ''
    };
  
    // Генерируем дизайн из шаблона default
    const defaultTemplate = templates.default || [];
    const newDesign = replacePlaceholders(defaultTemplate, templateData);
  
    // Сохраняем в sessionStorage
    sessionStorage.setItem(`design-${newDesignKey}`, JSON.stringify(newDesign));
  
    // Обновляем состояние
    onItemsUpdate([...items, newDesignKey]);
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

  // Вспомогательные функции для свойств
  const getPropertyValue = (productMeta, propName) => 
    productMeta.properties?.find(p => p.name === propName)?.value || '';
  
  const getOriginPropertyValue = (productMeta, propName) => 
    productMeta.originProperties?.find(p => p.name === propName)?.value || '';

  
  // Обработчик изменения шаблона
  const handleTemplateChange = async (baseCode, templateKey) => {
    // Получаем метаданные товара для группы
    const productMeta = JSON.parse(
      sessionStorage.getItem(`product-${baseCode}`) || '{}'
    );
    const updatedMeta = {
      ...productMeta,
      templateType: templateKey
    };
    sessionStorage.setItem(`product-${baseCode}`, JSON.stringify(updatedMeta));

    const updatedItems = items.map(item => {
      if (item.startsWith(`${baseCode}_`)) {
        // Получаем текущий дизайн
        const currentDesign = JSON.parse(sessionStorage.getItem(`design-${item}`) || '[]');

        // Находим все изображения с реальными URL
        const validImages = currentDesign.filter(el => 
          el.type === 'image' && 
          el.image?.startsWith('https://')
        );

        // Берем последнее добавленное изображение или из метаданных
        const currentImage = validImages.length > 0 
          ? validImages[validImages.length - 1].image 
          : productMeta.images?.[0];

        // Извлекаем индекс изображения из кода
        const parts = item.split('_');
        const imageIndex = parseInt(parts[parts.length - 1]) - 1;

        const itemData = {
          ...productMeta,
          code: item,
          image: currentImage,
          category: getPropertyValue(productMeta, 'Товарная номенклатура').toLowerCase(),
          title: getPropertyValue(productMeta, 'Тип латексных шаров'),
          multiplicity: productMeta.multiplicity,
          size: getPropertyValue(productMeta, 'Размер').split("/")[0]?.trim() || '',
          brand: getOriginPropertyValue(productMeta, 'Торговая марка'),
          // Добавляем индекс изображения в данные
          imageIndex: imageIndex
        };

        // Выбираем подходящий шаблон
        let template;
        if (templateKey === 'gemar' && Array.isArray(templates.gemar)) {
          // Для Gemar выбираем шаблон по индексу изображения
          const templateIndex = Math.min(imageIndex, templates.gemar.length - 1);
          template = templates.gemar[templateIndex];
        } else {
          // Для остальных шаблонов используем обычный выбор
          template = templates[templateKey];
        }

        const newDesign = replacePlaceholders(template, itemData);
        sessionStorage.setItem(`design-${item}`, JSON.stringify(newDesign));
      }
      return item;
    });

    onItemsUpdate([...updatedItems]);
  };
  
  // Вспомогательная функция для получения метаданных
  const getProductMeta = (baseCode) => {
    return JSON.parse(
      sessionStorage.getItem(`product-${baseCode}`) || { templateType: 'default' }
    );
  };

  // Разделяем шаблоны на группы
  const mainTemplates = ['main', 'default'];
  const thematicTemplates = ['gemar', 'belbal']; // Добавляем нужные теги

  // Объект перевода названий шаблонов
  const templateLabels = {
    main: 'Базовый шаблон',
    default: 'Шаблон картинка',
    gemar: 'Шаблон Gemar',
    belbal: 'Шаблон Belbal'
  };

  // Вспомогательная функция для рендеринга контролов выбора шаблона
  const renderTemplateControls = (baseCode, currentTemplate) => {
    const isThematicSelected = thematicTemplates.includes(currentTemplate);
    const selectedThematic = isThematicSelected ? currentTemplate : '';

    return (
      <div className="template-selector">
        {/* Тематические шаблоны - выпадающий список */}
        <div className="thematic-select">
          <select
            value={selectedThematic}
            onChange={(e) => handleTemplateChange(baseCode, e.target.value)}
          >
            <option value="">Тематический шаблон</option>
            {thematicTemplates.map(templateKey => (
              <option key={templateKey} value={templateKey}>
                {templateLabels[templateKey]}
              </option>
            ))}
          </select>
        </div>

        {/* Основные шаблоны - радиокнопки */}
        {mainTemplates.map(templateKey => (
          <label key={templateKey}>
            <input
              type="radio"
              name={`template-${baseCode}`}
              value={templateKey}
              checked={!isThematicSelected && currentTemplate === templateKey}
              onChange={() => handleTemplateChange(baseCode, templateKey)}
            />
            <span>{templateLabels[templateKey]}</span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <div className="items-grid-container">
      {uniqueBaseCodes.map((baseCode) => {
        const productMeta = getProductMeta(baseCode);
        const currentTemplate = productMeta.templateType || 'default';
        // Находим все элементы относящиеся к этому базовому коду
        const relatedItems = items.filter(item => item.startsWith(baseCode + '_'));
        
        return (
          <div key={baseCode}>
            <h2 className="item-title">
              {baseCode}
              {productMeta.name && <span className="item-subtitle">  {productMeta.name}</span>}
            </h2>
            {renderTemplateControls(baseCode, currentTemplate)}
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