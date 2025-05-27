import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { replacePlaceholders } from '../utils/replacePlaceholders';
import { PreviewDesign } from './PreviewDesign';

const ItemsGrid = ({ items, onItemsUpdate, templates, isToggled }) => {
  const navigate = useNavigate();
  const [baseCodesOrder, setBaseCodesOrder] = useState([]);
  
  // Инициализируем порядок при первом рендере
  useEffect(() => {
    const initialOrder = [...new Set(items.map(item => item.split('_').slice(0, -1).join('_')))];
    setBaseCodesOrder(initialOrder);
  }, [items]);

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

  // Определяем текущий шаблон группы
  const templateKey = productMeta.templateType || 'default';
  let selectedTemplate = templates.default;

  // Выбираем подходящий шаблон в зависимости от типа
  if (templateKey === 'belbal' || templateKey === 'gemar') {
    const templateArray = templates[templateKey] || [];
    const imageIndex = newNumber - 1;
    const templateIndex = Math.min(imageIndex, templateArray.length - 1);
    selectedTemplate = templateArray[templateIndex] || [];
  } else if (templates[templateKey]) {
    selectedTemplate = templates[templateKey];
  }

  // Выбираем изображение по индексу или первое
  const imageIndex = newNumber - 1;
  const image = productMeta.images?.[imageIndex] || productMeta.images?.[0] || '';

  // Формируем данные для шаблона
  const templateData = {
    code: newDesignKey,
    image: image,
    category: productMeta.properties?.find(p => p.name === 'Тип латексных шаров')?.value || '',
    title: productMeta.properties?.find(p => p.name === 'Событие')?.value || '',
    multiplicity: productMeta.multiplicity,
    size: productMeta.properties?.find(p => p.name === 'Размер')?.value?.split("/")[0]?.trim() || '',
    brand: productMeta.originProperties?.find(p => p.name === 'Торговая марка')?.value || '',
    imageIndex: imageIndex
  };

  // Генерируем и сохраняем дизайн
  const newDesign = replacePlaceholders(selectedTemplate, templateData);
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
          category: getPropertyValue(productMeta, 'Тип латексных шаров'),
          title: getPropertyValue(productMeta, 'Событие'),
          multiplicity: productMeta.multiplicity,
          size: getPropertyValue(productMeta, 'Размер').split("/")[0]?.trim() || '',
          brand: getOriginPropertyValue(productMeta, 'Торговая марка'),
          // Добавляем индекс изображения в данные
          imageIndex: imageIndex
        };

        // Выбираем подходящий шаблон
        let template;
        if (
          (templateKey === 'gemar' || templateKey === 'belbal') && 
          Array.isArray(templates[templateKey])
        ) {
          // Для Gemar и Belbal выбираем шаблон по индексу изображения
          const templateArray = templates[templateKey];
          const templateIndex = Math.min(imageIndex, templateArray.length - 1);
          template = templateArray[templateIndex];
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
    try {
      const storedData = sessionStorage.getItem(`product-${baseCode}`);
      return storedData ? JSON.parse(storedData) : { templateType: 'default' };
    } catch (error) {
      console.error('Error parsing product meta:', error);
      return { templateType: 'default' };
    }
  };

  // Объект перевода названий шаблонов
  const templateOptions = {
    belbal: 'Шаблон Belbal (3 слайда)',
    gemar: 'Шаблон Gemar (3 слайда)',
    main: 'Базовый шаблон',
    default: 'Шаблон картинка',
  };

  // Вспомогательная функция для рендеринга контролов выбора шаблона
  const renderTemplateControls = (baseCode, currentTemplate) => {
    return (
      <div className="template-selector">
        <select
          value={currentTemplate}
          onChange={(e) => handleTemplateChange(baseCode, e.target.value)}
          className="template-select"
        >
          {Object.entries(templateOptions).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
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
                        <div className="loader-container">
                          <div className="loader"></div>
                        </div>
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