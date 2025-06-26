import { useState, useContext } from "react";

import { LanguageContext } from "../contexts/contextLanguage";
import { CustomSelect } from "../ui/CustomSelect/CustomSelect";

export const DownloadModal = ({ isOpen, onClose, template }) => {
  const { t } = useContext(LanguageContext);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [status, setStatus] = useState(null); // 'success' | 'error' | null

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
    if (template.length === 0 || !selectedCategory) return;
    
    try {
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

      setStatus('success');
      setTimeout(() => {
        handleClose();
        setStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Export error:', error);
      setStatus('error');
      setTimeout(() => setStatus(null), 2000);
    }
  };

  const handleClose = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setStatus(null);
    onClose();
  };

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`} onClick={handleClose}>
      <div className="modal-content download-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="no-margin">{t('modals.titleTemplateDownload')}</h3>
          <button onClick={handleClose} className="close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {status === 'success' ? (
            <div className="status-message success">
              {t('modals.successMessageDownload')}
            </div>
          ) : status === 'error' ? (
            <div className="status-message error">
              {t('modals.errorMessageDownload')}
            </div>
          ) : (
            <>
              <div className="form-row">
                <label className="form-label">
                  {t('modals.labelSelectedCategory')}<span className="required-star">*</span>
                </label>
                <CustomSelect
                  options={productCategories}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  className="form-select"
                />
              </div>
              
              <div className="form-row">
                <label className="form-label">{t('modals.labelSelectedBrand')}</label>
                <CustomSelect
                  options={brands}
                  value={selectedBrand}
                  onChange={setSelectedBrand}
                  className="form-select"
                />
              </div>
              
              <div className="preview-filename">
                <small>{t('modals.labelPreviewFilename')}</small>
                <div>
                  {selectedCategory || "..."}
                  {selectedBrand && `-${selectedBrand}`}
                  -template.json
                </div>
              </div>
            </>
          )}
        </div>
        
        {!status && (
          <div className="modal-footer buttons-group">
            <button 
              onClick={handleClose}
              className="cancel-btn"
            >
              {t('modals.cancel')}
            </button>
            <button 
              onClick={handleExportTemplate} 
              disabled={!selectedCategory || template.length === 0}
              className="download-btn"
            >
              {t('modals.download')}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};