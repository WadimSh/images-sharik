import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineChevronLeft } from "react-icons/hi2";

import { LanguageContext } from '../../contexts/contextLanguage';

export const Template = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);

  const handleBack = () => {
    navigate(-1);
  };

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

  return (
    <div>
      <div className='header-section' style={{ margin: '10px'}}>
        <button onClick={handleBack} className='button-back' style={{ color: '#333'}}>
          <HiOutlineChevronLeft /> {t('header.back')}
        </button>
        <h2 style={{ color: '#333'}}>{t('header.tempSubtitle')}</h2>
      </div>
      <div className="content-wrapper" style={{ alignItems: 'center', justifyContent: 'center' }}>
        Здесь будет интерфейс для создания шаблонов.
      </div>
    </div>
  )
} 