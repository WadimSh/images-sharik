import { useState, useContext } from "react";

import { LanguageContext } from "../contexts/contextLanguage";
import { CustomSelect } from "../ui/CustomSelect/CustomSelect";

export const DownloadModal = ({ isOpen, onClose, template }) => {
  const { t } = useContext(LanguageContext);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedView, setSelectedView] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
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

  const materialGroup = {
    size18_20Qualatex: "18\", 20\" Qualatex",
    size18_20CrystalAn: "18\",20\" кристалл an",
    size18_20CrystalQl: "18\",20\" кристалл ql",
    size18Agura: "18\" AGURA",
    size18Anagram: "18\" Anagram",
    size18Flexmetal: "18\" Flexmetal",
    size18GraboBetallic: "18\" GRABO, Betallic",
    size18PartyDeco: "18\" PartyDeco",
    size18ShineAn: "18\" блеск  an",
    size18China: "18\" Китай",
    size4An: "4\"  an",
    size4Fm: "4\" fm",
    size7: "7\"",
    size9An: "9\" an",
    size9Fm: "9\" fm",
    belbal105Belgium: "Belbal 105 (Бельгия)",
    belbal120Belgium: "Belbal 120 (Бельгия)",
    belbal150Belgium: "Belbal 150 (Бельгия)",
    belbal75Belgium: "Belbal 75 (Бельгия)",
    belbal85Belgium: "Belbal 85 (Бельгия)",
    everts12Malaysia: "Everts 12\" (Малайзия)",
    everts14Malaysia: "Everts 14\" (Малайзия)",
    everts24Malaysia: "Everts 24\" (Малайзия)",
    everts5Malaysia: "Everts 5\" (Малайзия)",
    gemar10Italy: "Gemar 10\" (Италия)",
    gemar12Italy: "Gemar 12\" (Италия)",
    gemar14Italy: "Gemar 14\" (Италия)",
    gemar18Italy: "Gemar 18\" (Италия)",
    gemar27Italy: "Gemar 27\" (Италия)",
    gemar5Italy: "Gemar 5\" (Италия)",
    latexOccidental12Mexico: "Latex Occidental 12\" (Мексика)",
    latexOccidental5Mexico: "Latex Occidental 5\" (Мексика)",
    latexOccidental9Mexico: "Latex Occidental 9\" (Мексика)",
    qualatex11USA: "Qualatex 11\" (США)",
    qualatex16USA: "Qualatex 16\" (США)",
    qualatex30_3ftUSA: "Qualatex 30\"-3' (США)",
    qualatex5USA: "Qualatex 5\" (США)",
    qualatex7USA: "Qualatex 7\" (США)",
    accessories: "Аксессуары",
    bakingAccessories: "Аксессуары для выпечки",
    costumeAccessories: "Аксессуары для костюмов",
    assortedRoundBalloons: "Ассорти из круглых шаров",
    bubl: "БАБЛ",
    bubl18_20: "БАБЛ, 18”, 20”",
    bublInsider: "БАБЛ Инсайдер",
    banners: "Баннеры",
    hangingBanners: "Баннеры подвесные",
    bows: "Банты",
    fireworksBatteries: "Батареи салютов",
    paperFoil: "Бумага, Пленка",
    inJars: "В банках",
    vdpCostumes: "ВДП Костюмы",
    vdpMiscRetail: "ВДП Разное розн",
    vdpNapkins: "ВДП Салфетки",
    vdpGlasses: "ВДП Стаканы",
    vdpGiftsOther: "ВДП Сувениры-Прочее",
    vdpTubes: "ВДП Трубочки",
    vdpPackagingBags: "ВДП Упаковка- Сумки",
    windmills: "Ветрячки",
    vinylBalloons: "Виниловые",
    gasEquipment: "Газовое оборудование",
    heliumCylinders: "Гелий, баллоны",
    garlands: "Гирлянды",
    garlands2: "Гирлянды.",
    letterGarlands: "Гирлянды-буквы",
    pennantGarlands: "Гирлянды-вымпелы",
    flagGarlands: "Гирлянды-флажки",
    hornsPipes: "Горны, дудочки",
    makeup: "Грим",
    weights: "Грузики",
    scenery: "Декорации",
    holders: "Держатели",
    jumbo: "Джамбо",
    jumboPack: "Джамбо в упак.",
    packagingBalloons: "Для упаковки",
    smoke: "Дымы",
    eut10China: "ЕУТ 10\" (Китай)",
    eut12China: "ЕУТ 12\" (Китай)",
    eut18China: "ЕУТ 18\" (Китай)",
    eut36China: "ЕУТ 36\" (Китай)",
    eut5China: "ЕУТ 5\" (Китай)",
    stars: "Звезды",
    toys2: "Игрушки.",
    toys: "Игрушки",
    games: "Игры",
    foamProducts: "Изделия из поролона",
    naturalLatex: "Из натурального латекса",
    syntheticLatex: "Из синтетического латекса",
    insiderJumbo: "Инсайдер джамбо",
    yoYo: "Йо-йо",
    carnivalCostumes: "Карнавальные костюмы",
    tableCards: "Карточки настольные",
    tableBells: "Колокольчики настольные",
    hangingBells: "Колокольчики подвесные",
    caps: "Колпаки",
    compressors: "Компрессоры",
    envelopes: "Конверты",
    confettiStreamers: "Конфетти, серпантин",
    paint: "Краска",
    circles: "Круги",
    tapeClamps: "Лента, зажимы",
    ribbonsBows: "Ленты, Банты",
    linkOLoonGemar: "Линколуны Gemar",
    linkOLoonSempertex: "Линколуны Sempertex",
    halfMasks: "Маски полумаски",
    microMiniOther: "Микро мини прочие",
    minifigureAn: "Минифигура an",
    minifigureFm: "Минифигура fm",
    minifigureLetter: "Минифигура буква",
    minifigureNumber: "Минифигура цифра",
    multicolored: "Многоцветные",
    soapBubble: "Мыльные пузыри",
    plushToys: "Мягкая игрушка",
    sets: "Наборы",
    packagedSets: "Наборы в упаковках",
    partySets: "Наборы для праздника",
    filler: "Наполнитель",
    floorStands: "Напольные",
    pumps: "Насосы",
    desktopStands: "Настольные",
    skyLanterns: "Небесные фонарики",
    equipment: "Оборудование",
    postcards: "Открытки",
    offsetPrint: "Офсет",
    sunglasses: "Очки",
    packages: "Пакеты",
    panoramic: "Панорамный",
    punchBall: "Панч-болл",
    printedProducts: "Печатная продукция",
    peaks: "Пики",
    pendants: "Подвески",
    hiFloat: "Полимерный гель Хай-Флоат",
    festiveRibbon: "Праздничные ленты",
    miscellaneous: "Разное",
    others: "Разное.",
    pyrotechnicRockets: "Ракеты",
    romanCandles: "Римские свечи",
    russianProduction: "Российское производство",
    napkins: "Салфетки",
    weddingProducts: "Свадебная продукция",
    glowProducts: "Светящаяся продукция",
    candles: "Свечи",
    hearts: "Сердца",
    tableHearts: "Сердца настольные",
    hangingHearts: "Сердца подвесные",
    printedHearts: "Сердца с рисунком",
    mylarHearts: "Сердца фольгированные",
    netsMatrix: "Сети, матрицы",
    tablewear: "Скатерти",
    specialFigures: "Специальные фигуры",
    sprays: "Спреи",
    glasses: "Стаканы",
    machineTools: "Станки и аксессуары",
    cutlery: "Столовые приборы",
    giftPackaging: "Сувениры, упаковка",
    dishes: "Тарелки",
    cocktailTubes: "Трубочки",
    headAccessories: "Украшения на голову",
    packingInBalloon: "Упаковка в шар",
    packingMaterials: "Упаковочн материалы",
    decoratingServices: "Услуги по оформлению",
    printingServices: "Услуги по печати",
    otherServices: "Услуги прочие",
    fants: "Фанты",
    figure13: "Фигура 13",
    figure2: "Фигура 2",
    figure3: "Фигура 3",
    figure5: "Фигура 5",
    figure7: "Фигура 7",
    figure8: "Фигура 8",
    figureAgura: "Фигура AGURA",
    figureAnagram: "Фигура Anagram",
    figureBC: "Фигура B, C",
    figureBCVendor: "Фигура B, C - vendor",
    figureBCPack: "Фигура B, C в упак.",
    figureDG: "Фигура D, G",
    figureDGPack: "Фигура D, G в упак.",
    figureGVendor: "Фигура G - vendor",
    figureHVendor: "Фигура H - vendor",
    figureHPack: "Фигура H в упак.",
    figureK: "Фигура K",
    figureKPack: "Фигура K в упак.",
    figureL: "Фигура L",
    figureNPack: "Фигура N в упак.",
    figurePartyDeco: "Фигура PartyDeco",
    figureQualatex: "Фигура Qualatex",
    figureRPack: "Фигура R в упак.",
    figureShake: "Фигура  SHAKE",
    figureLetter: "Фигура буква",
    figureChina: "Фигура Китай",
    figurePPack: "Фигура Р в упак.",
    figureDigit: "Фигура цифра",
    figureDigitStand: "Фигура цифра на подставке",
    figureBetallic: "Фигура Betallic",
    figureFlexmetal: "Фигура Flexmetal",
    figureGrabo: "Фигура GRABO",
    smallFigures: "Фигурки",
    shapedBalloons: "Фигурные шары",
    tableFigures: "Фигуры настольные",
    hangingFigures: "Фигуры подвесные",
    tableFlags: "Флажки настольные",
    hangingFlags: "Флажки подвесные",
    pyrotechnicFountains: "Фонтаны пиротехнические",
    confettiPopper: "Хлопушки",
    printedBalloon: "Шар с рисунком",
    _3dBalloons: "Шары 3D",
    paperBalls: "Шары бумажные",
    photoPrintingBalloons: "Шары для фотопечати",
    airBalloons: "Шары под воздух",
    heliumBalloons: "Шары под гелий",
    modellingEvertsMalaysia: "ШДМ Everts (Малайзия)",
    modellingGemarItaly: "ШДМ Gemar (Италия)",
    modellingLatexOccMexico: "ШДМ Latex Occidental (Мексика)",
    modellingQualatexUSA: "ШДМ Qualatex (США)",
    modellingSempertexColombia: "ШДМ Sempertex (Колумбия)",
    modellingEUTChina: "ШДМ ЕУТ (Китай)",
    silkscreenPrint: "Шелкография",
    hatsCaps: "Шляпы, шапочки",
    electronicMedia: "Электронные носители",
    clothingElements: "Элементы одежды",
    blowouts: "Языки"
  };

  const materialType = {
    size18_20WithPattern: "18\" 20\" с рисунком",
    size24_30WithPattern: "24\" 30\" с рисунком",
    d3: "3D",
    size4_7_9WithPattern: "4\" 7\" 9\" с рисунком",
    decoratingServices: "6услуги по оформлению",
    printingServices: "6услуги по печати",
    otherServices: "6услуги прочие",
    accessories: "Аксессуары",
    balloonAccessories: "Аксессуары для шаров",
    assortedWithoutPattern: "Ассорти без рисунка",
    banners: "Баннеры",
    bows: "Банты",
    withoutPattern: "Без рисунка",
    carnivalItems: "Все для пр.: карнавал",
    tablewareItems: "Все для пр.: сервировка",
    souvenirItems: "Все для пр.: сувениры",
    packagingItems: "Все для пр.: упаковка",
    heliumAndEquipment: "Гелий и оборудование",
    garlands: "Гирлянды",
    garlands2: "Гирлянды.",
    displays: "Дисплеи",
    gamesToys: "Игры, игрушки",
    carnivalAccessories: "Карнавал аксессуары",
    carnivalCostumes: "Карнавальные костюмы",
    cards: "Карточки",
    bells: "Колокольчики",
    compressorsAndPumps: "Компрессоры и насосы",
    roundWithoutPattern: "Круглые без рисунка",
    roundWithPattern: "Круглые с рисунком",
    bubble: "Мыльные пузыри",
    sets: "Наборы",
    sets2: "Наборы.",
    packagedBalloonSets: "Наборы шаров в упаковках",
    inflatableToys: "Надувные игрушки",
    decorationEquipment: "Оборудование для оформлений",
    printingEquipment: "Оборудование для печати",
    packagingEquipment: "Оборудование для упаковки",
    punchBall: "Панч-болл",
    pyrotechnics: "Пиротехника",
    giftWrap: "Подарочная упаковка",
    pendants: "Подвески",
    tableware: "Сервировка стола",
    hearts: "Сердца",
    balloonNetworks: "Сети, матрицы для шаров",
    specialBalloons: "Специальные",
    trainingAids: "Учебные пособия",
    fants: "Фанты",
    curlyBalloons: "Фигурные",
    heartShapedBalloons: "Фигурные - сердца",
    figures: "Фигуры",
    flags: "Флажки",
    walkingBalloons: "Ходячие шарики",
    balloonsInJars: "Шарики в банках",
    balls: "Шары",
    largeBalloons: "Шары большие",
    largeCurlyBalloons: "Шары фигурные большие",
    smallCurlyBalloons: "Шары фигурные малые",
    modelingBalloons: "Шдм"
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

      if (selectedView) {
        fileNameParts.push(selectedView);
      }
      
      if (selectedGroup) {
        fileNameParts.push(selectedGroup);
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
    setSelectedView("");
    setSelectedGroup("");
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
                <label className="form-label">
                  {t('modals.labelSelectedView')}
                </label>
                <CustomSelect
                  options={materialType}
                  value={selectedView}
                  onChange={setSelectedView}
                  className="form-select"
                />
              </div>
              
              <div className="form-row">
                <label className="form-label">
                  {t('modals.labelSelectedGroup')}
                </label>
                <CustomSelect
                  options={materialGroup}
                  value={selectedGroup}
                  onChange={setSelectedGroup}
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
                  {selectedCategory || selectedView || selectedGroup || selectedBrand ? (
                    <>
                      {selectedCategory || '...'}
                      {selectedView ? `-${selectedView}` : '-_'}
                      {selectedGroup ? `-${selectedGroup}` : '-_'}
                      {selectedBrand && `-${selectedBrand}`}
                      -template.json
                    </>
                  ) : (
                    "...-template.json"
                  )}
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