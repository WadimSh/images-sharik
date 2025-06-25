import { useState } from "react";
import { CustomSelect } from "../ui/CustomSelect/CustomSelect";

export const DownloadModal = ({ isOpen, onClose, template }) => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");

  const brands = {
    agura: "Agura",
    amscan: "Amscan",
    anagram: "Anagram",
    belbal: "Belbal",
    betallic: "Betallic",
    conwin: "Conwin",
    dulсop: "Dulсop",
    eutFarEast: "Eut Far East",
    everts: "Everts",
    flexMetal: "Flex Metal",
    flyLuxe: "FlyLuxe",
    funfood: "Funfood",
    gemar: "Gemar",
    grabo: "Grabo",
    hiFloat: "Hi Float",
    koda: "KODA",
    nevity: "Nevity",
    paperFantasies: "Paper Fantasies",
    partyDeco: "PartyDeco",
    pioneerGlobos: "Pioneer/Globos",
    premiumBalloon: "Premium Balloon",
    procos: "Procos",
    qualatex: "Qualatex",
    sempertex: "Sempertex",
    worthingtonCylinder: "Worthington Cylinder",
    zibi: "Zibi",
    amurnayaZateya: "Амурная Затея",
    biley: "БиКей",
    bolshoyPrazdnik: "Большой Праздник",
    veselayaZateya: "Весёлая Затея",
    joker: "Джокер",
    zatevayYarko: "Затевай Ярко",
    latexOksidentl: "Латекс Оксидентл",
    legenda: "Легенда",
    maksem: "Максем",
    milend: "Миленд",
    olimpiyskiy: "Олимпийский",
    salutRossii: "Салют России",
    tkServis: "ТК Сервис",
    chasPotehi: "Час Потехи"
  };

  const productCategories = {
    bubble: "Bubble",
    banners: "Баннеры",
    barAccessories: "Барные аксессуары",
    bijouterie: "Бижутерия",
    boa: "Боа",
    packagingPaper: "Бумага упаковочная",
    hawaii: "Гавайи",
    gasEquipment: "Газовое оборудование",
    tie: "Галстук",
    heliumCylinders: "Гелий, баллоны",
    garlands: "Гирлянды",
    garlandsLetters: "Гирлянды-буквы",
    garlandsVertical: "Гирлянды вертикальные",
    garlandsPennants: "Гирлянды-вымпелы",
    hats: "Головные уборы",
    horn: "Горн",
    makeup: "Грим",
    weightsForBalloons: "Грузики для шаров",
    scenery: "Декорации",
    pendantDecorations: "Декорации подвески",
    holders: "Держатели",
    displays: "Дисплеи",
    pipe: "Дудочка",
    coloredSmoke: "Дым цветной",
    icon: "Значок",
    game: "Игра",
    toys: "Игрушки",
    carnivalCostume: "Карнавальный костюм",
    clownNose: "Клоунский нос",
    balloonCompressor: "Компрессор для шаров",
    confetti: "Конфетти",
    paintForBalls: "Краска для шаров",
    ribbon: "Лента",
    ribbonForBalloons: "Лента для шаров",
    masks: "Маски",
    medal: "Медаль",
    tinsel: "Мишура",
    soapBubbles: "Мыльные пузыри",
    packagedKits: "Наборы в упаковках",
    inflatableToy: "Надувная игрушка",
    stickers: "Наклейки",
    balloonPump: "Насос для шаров",
    sunglasses: "Очки",
    package: "Пакет",
    wig: "Парик",
    pinata: "Пиньята",
    pyrotechnics: "Пиротехника",
    packagingFilm: "Пленка упаковочная",
    hiFloat: "Полимерный гель для шаров",
    holidayAccessories: "Праздничные аксессуары",
    advertisingBalls: "Рекламные шары",
    napkins: "Салфетки",
    luminousSouvenirs: "Светящиеся сувениры",
    candlesForCake: "Свечи для торта",
    candlesDigit: "Свечи-цифры",
    serpentine: "Серпантин",
    net: "Сеть",
    tablecloth: "Скатерти",
    sweetTable: "Сладкий стол",
    specialEffects: "Спецэффекты",
    spirals: "Спирали",
    spray: "Спрей",
    glasses: "Стаканы",
    cutlery: "Столовые приборы",
    dishes: "Тарелки",
    tasselFringe: "Тассел, бахрома",
    headOrnaments: "Украшения на голову",
    packing: "Упаковочный",
    educationalMaterials: "Учебные материалы",
    fant: "Фант",
    cakeFigurine: "Фигурка на торт",
    photoProps: "Фотобутафория",
    partyPopper: "Хлопушка",
    latexBalls: "Шарики из латекса",
    foilBalls: "Шарики из фольги",
    blowouts: "Язычки"
  };
  
  const handleExportTemplate = () => {
    if (template.length === 0) return;
    
    // Формируем имя файла
    let fileNameParts = [];
    
    if (selectedCategory) {
      fileNameParts.push(selectedCategory);
    }
    
    if (selectedBrand) {
      fileNameParts.push(selectedBrand);
    }
    
    fileNameParts.push("template");
    const fileName = fileNameParts.join("-") + ".json";
    
    // Создаем JSON строку
    const json = JSON.stringify(template, null, 2);
    
    // Создаем Blob и ссылку для скачивания
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Очистка
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    handleClose();
  };

  const handleClose = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    onClose();
  };

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`} onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Скачать шаблон</h3>
          <button onClick={handleClose} className="close-btn">&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Категория продукта (обязательно)</label>
            <CustomSelect
              options={productCategories}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>
          
          <div className="form-group">
            <label>Бренд (необязательно)</label>
            <CustomSelect
              options={brands}
              value={selectedBrand}
              onChange={setSelectedBrand}
            />
          </div>
          
          <div className="preview-filename">
            <small>Имя файла:</small>
            <div>
              {selectedCategory || "не выбрано"}
              {selectedBrand && `-${selectedBrand}`}
              -template.json
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            onClick={handleExportTemplate} 
            disabled={!selectedCategory || template.length === 0}
            className="download-btn"
          >
            Скачать
          </button>
        </div>

      </div>
    </div>
  );
};