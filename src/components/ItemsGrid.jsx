import { useNavigate } from 'react-router-dom';

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


const ItemsGrid = ({ items, onItemsUpdate }) => {
  const navigate = useNavigate();
  
  if (!items || items.length === 0) return null;

  // Функция для создания нового дизайна
  //const handleCreateNewDesign = (baseCode) => {
  //  const existingNumbers = items
  //    .filter(item => item.startsWith(`${baseCode}_`))
  //    .map(item => parseInt(item.split('_')[1]))
  //    .filter(num => !isNaN(num));
  //  
  //  const newNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  //  const newDesignKey = `${baseCode}_${newNumber}`;
//
  //  const firstImageItem = items.find(item => item.startsWith(`${baseCode}_1`));
  //  const firstImageData = firstImageItem 
  //    ? JSON.parse(sessionStorage.getItem(`design-${firstImageItem}`))
  //    : null;
//
  //  const newDesign = {
  //    id: Date.now(),
  //    type: "image",
  //    position: { x: 19, y: 85 },
  //    image: firstImageData?.find(el => el.type === 'image')?.image || '',
  //    width: 415,
  //    height: 415,
  //    originalWidth: 400,
  //    originalHeight: 400
  //  };
//
  //  sessionStorage.setItem(`design-${newDesignKey}`, JSON.stringify([newDesign]));
  //  
  //  // Обновляем список items
  //  onItemsUpdate([...items, newDesignKey]);
  //  navigate(`/template/${newDesignKey}`);
  //};

  const handleCreateNewDesign = (baseCode) => {
    const existingNumbers = items
      .filter(item => item.startsWith(`${baseCode}_`))
      .map(item => parseInt(item.split('_')[1]))
      .filter(num => !isNaN(num));
    
    const newNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const newDesignKey = `${baseCode}_${newNumber}`;
  
    // Явно ищем элемент с суффиксом _1 для этого базового кода
    const firstImageKey = `${baseCode}_1`;
    const firstImageItem = items.includes(firstImageKey) 
      ? firstImageKey 
      : null;
  
    // Получаем данные для элемента _1
    const firstImageData = firstImageItem 
      ? JSON.parse(sessionStorage.getItem(`design-${firstImageItem}`))
      : null;
  
    // Ищем первое изображение с URL в элементах шаблона _1
    const firstImageUrl = firstImageData?.find(el => 
      el.type === 'image' && 
      el.image?.startsWith('http')
    )?.image || '';
  
    const newDesign = {
      id: Date.now(),
      type: "image",
      position: { x: 19, y: 85 },
      image: firstImageUrl,
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
    const baseCodes = items.map(item => {
      const parts = item.split('_');
      return parts.slice(0, -1).join('_');
    });
    return [...new Set(baseCodes)];
  };

  const uniqueBaseCodes = getUniqueBaseCodes();

  console.log(uniqueBaseCodes)
  const handleItemClick = (itemId) => {
    navigate(`/template/${itemId}`);
  };

  return (
    <div className="items-grid-container">
      {uniqueBaseCodes.map((baseCode) => {
        // Находим все элементы относящиеся к этому базовому коду
        const relatedItems = items.filter(item => item.startsWith(baseCode + '_'));
        
        return (
          <div key={baseCode}>
            <h2 className="item-title">{baseCode}</h2>
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