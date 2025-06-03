import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { replacePlaceholders } from '../utils/replacePlaceholders';
import { useMarketplace } from '../context/contextMarketplace';
import { getCode } from '../utils/getCodeProduct';
import { PreviewDesign } from './PreviewDesign';

const ItemsGrid = ({ items, onItemsUpdate, templates }) => {
  const navigate = useNavigate();
  const { marketplace } = useMarketplace();
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
    const wbCode = getCode(baseCode, "WB");
    const ozCode = getCode(baseCode, "OZ");
    return (
      <div className={`template-selector ${marketplace}`} >
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
        <div className="template-selector-controls">
          {(wbCode !== 'нет на WB' || ozCode !== 'нет на OZON') ? <span>ссылки на товар в:</span> : <span>товара нет на маркетплейсах</span>}
          {wbCode !== 'нет на WB' && <a 
            className="template-selector-control"
            href={`https://www.wildberries.ru/catalog/${wbCode}/detail.aspx`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="511" height="511" viewBox="0 0 511 511" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0_275_5)">
                <path d="M0 239.894C0 155.923 0 113.938 16.3419 81.8655C30.7165 53.6535 53.6535 30.7165 81.8655 16.3419C113.938 0 155.923 0 239.894 0H271.106C355.077 0 397.062 0 429.135 16.3419C457.346 30.7165 480.284 53.6535 494.659 81.8655C511 113.938 511 155.923 511 239.894V271.106C511 355.077 511 397.062 494.659 429.135C480.284 457.346 457.346 480.284 429.135 494.659C397.062 511 355.077 511 271.106 511H239.894C155.923 511 113.938 511 81.8655 494.659C53.6535 480.284 30.7165 457.346 16.3419 429.135C0 397.062 0 355.077 0 271.106V239.894Z" fill="url(#paint0_linear_275_5)"/>
                <path d="M386.626 180.313C368.325 180.313 351.797 185.847 337.686 195.32V108.862H298.648V268.31C298.648 316.821 338.115 355.859 386.411 355.859C434.708 355.859 474.623 317.054 474.623 267.862C474.623 218.669 435.584 180.313 386.626 180.313ZM209.461 279.576L173.736 186.511H146.391L110.45 279.576L74.5113 186.511H31.9255L94.781 350.149H122.126L159.839 252.679L197.767 350.149H225.111L287.753 186.511H245.4L209.461 279.576ZM386.43 316.84C359.963 316.84 337.686 295.674 337.686 268.096C337.686 240.517 358.638 219.585 386.645 219.585C414.652 219.585 435.604 241.413 435.604 268.096C435.604 294.778 413.327 316.84 386.43 316.84Z" fill="white"/>
              </g>
              <defs>
                <linearGradient id="paint0_linear_275_5" x1="171.882" y1="555.132" x2="485.45" y2="32.5182" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#6F01FB"/>
                  <stop offset="1" stop-color="#FF49D7"/>
                </linearGradient>
                <clipPath id="clip0_275_5">
                  <rect width="511" height="511" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </a>}
          {ozCode !== 'нет на OZON' && <a 
            className="template-selector-control"
            href={`https://www.ozon.ru/product/${ozCode}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="511" height="511" viewBox="0 0 511 511" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0_275_2)">
                <rect width="511" height="511" fill="white"/>
                <path d="M106.458 0H404.542C463.335 0 511 47.6649 511 106.458V404.542C511 463.335 463.335 511 404.542 511H106.458C47.6649 511 0 463.335 0 404.542V106.458C0 47.6649 47.6649 0 106.458 0Z" fill="#2962FF"/>
                <path d="M222.577 282.594H188.589L231.982 208.491C232.934 206.871 232.669 204.484 231.401 203.274C230.926 202.796 230.292 202.524 229.671 202.524H166.899C161.378 202.524 156.873 208.355 156.873 215.465C156.873 222.575 161.391 228.406 166.899 228.406H195.101L151.563 302.577C150.559 304.197 150.823 306.516 152.091 307.794C152.62 308.34 153.241 308.613 153.875 308.545H222.524C228.046 308.204 232.299 302.1 232.035 294.921C231.771 288.271 227.676 282.986 222.524 282.645V282.576L222.577 282.594ZM441.921 202.524C436.4 202.524 431.895 208.355 431.895 215.465V258.927L377.683 203.393C376.481 202.097 374.632 202.302 373.641 203.939C373.218 204.621 373.007 205.422 373.007 206.309V295.603C373.007 302.73 377.525 308.545 383.033 308.545C388.542 308.545 393.059 302.782 393.059 295.603V252.141L447.271 307.743C448.526 309.039 450.375 308.766 451.366 307.129C451.789 306.447 452 305.646 452 304.828V215.465C451.96 208.287 447.496 202.524 441.921 202.524ZM298.479 285.032C275.521 285.032 258.401 269.43 258.401 255.466C258.401 241.501 275.574 225.9 298.479 225.9C321.437 225.9 338.557 241.501 338.557 255.466C338.557 269.43 321.477 285.032 298.479 285.032ZM298.479 200C265.284 200 238.336 224.809 238.336 255.466C238.336 286.123 265.284 310.932 298.479 310.932C331.675 310.932 358.622 286.123 358.622 255.466C358.622 224.809 331.675 200 298.479 200ZM101.023 285.1C88.3687 285.1 78.0652 271.886 78.0652 255.534C78.0652 239.182 88.3026 225.9 100.971 225.9C113.638 225.9 123.929 239.114 123.929 255.466V255.534C123.929 271.818 113.691 285.032 101.023 285.1ZM101.023 200C77.2859 200 58.0528 224.809 58 255.466C58 286.106 77.2198 310.932 100.971 311C124.708 311 143.941 286.191 143.994 255.534V255.466C143.941 224.826 124.721 200 101.023 200Z" fill="white"/>
              </g>
              <defs>
                <clipPath id="clip0_275_2">
                  <rect width="511" height="511" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </a>}
        </div>
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