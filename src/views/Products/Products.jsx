import { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { LanguageContext } from '../../contexts/contextLanguage';
import { useGetCode } from '../../hooks/useGetCode';
import { apiGetAllImages } from '../../services/mediaService';
import { ImageSliderModal } from '../../components/ImageSliderModal';

const ifo = {
  "measure_units_properties": [
    [
      "Размер",
      [
        "24.0x23.5x0.1 см",
        "24.0x23.5x9.929 см"
      ]
    ],
    [
      "Вес брутто",
      [
        "28.0 Г",
        "2810.0 Г(брутто)"
      ]
    ],
    [
      "Объем",
      [
        "0.056 дм3",
        "5.6 дм3"
      ]
    ],
    [
      "Баз. ед.",
      [
        "1 шт",
        "100 шт"
      ]
    ],
    [
      "Штрих код. ед.",
      [
        "4690390246445",
        "4690390246452"
      ]
    ]
  ],
  "rating": 0,
  "code": "1207-3040",
  "units_counts": [
    [
      "кор",
      "100 шт"
    ]
  ],
  "seo_header": "",
  "updated_at": "2026-03-18T04:11:34.790202",
  "rest": 4769,
  "in_favorite": false,
  "product_files": [],
  "category_detail": [
    {
      "meta_description": "Оптовая продажа фольгированных фигурных шаров в Москве. Покупайте фольгированные фигурные шары оптом с доставкой у проверенного поставщика!",
      "meta_title": "",
      "code": "SHARIK_RU_2_6//01",
      "name": "Шары фигурные, букеты",
      "image": "/media/cache/4f/b7/4fb7e477fd7ea317011d2a44df1d60a0.jpg",
      "seo_header": "",
      "slug": "shary-figurnye-bukety",
      "meta_keywords": "",
      "seo_caption": "",
      "seo_text": "Ассортимент больших фигурных фольгированных шаров отличается огромным разнообразием простых и сложных форм. Предлагаются фольгированные шары в форме предметов, животных, сказочных героев, персонажей мультфильмов и т.д. Их тематика подойдет к любому событию и на каждый день ребенку и взрослому. Кроме того, есть наборы фольгированных шаров (так называемые «букеты»),  которые включают 5 шаров различным форм и размеров, выполненные в  одном дизайне: без затрат времени на поиски можно получить готовую композицию.  ",
      "id": 8685,
      "extra_info": ""
    },
    {
      "meta_description": "",
      "meta_title": "",
      "code": "SHARIK_RU_C1_14_4//01",
      "name": "9 мая",
      "image": null,
      "seo_header": "",
      "slug": "9-maia",
      "meta_keywords": "",
      "seo_caption": "",
      "seo_text": "",
      "id": 9562,
      "extra_info": ""
    },
    {
      "meta_description": "",
      "meta_title": "",
      "code": "SHARIK_RU_C1_14_2//01",
      "name": "23 февраля",
      "image": null,
      "seo_header": "",
      "slug": "23-fevralia",
      "meta_keywords": "",
      "seo_caption": "",
      "seo_text": "",
      "id": 9571,
      "extra_info": ""
    }
  ],
  "images": [
    {
      "image": "/media/products/77653/8c047e04-59c4-47bb-aa28-c1c58a1e1f4b.jpg",
      "thumb": {
        "product_small": "/media/cache/89/36/8936024a82740a346433a020b6bddd12.jpg",
        "zoom_medium": "/media/cache/ec/c5/ecc54d4d73e3db9a7d677bc6d5e3d4e7.jpg",
        "zoom_large": "/media/cache/12/f4/12f4185ed83f9b38b447e2bbfd8962f8.jpg",
        "medium": "/media/cache/56/54/565427cc0a36484540aaaa99e391bbcf.jpg"
      },
      "id": 105551,
      "is_base": true
    }
  ],
  "document_images": [],
  "stickers": [
    13
  ],
  "id": 98907,
  "extra_info": "",
  "category": 8685,
  "slug": "tank-special-eut-2-1207-3040",
  "seo_text": "",
  "meta_keywords": "",
  "seo_caption": "",
  "measure_units_names": [
    "Штука",
    "Коробка"
  ],
  "meta_description": "",
  "meta_title": "",
  "description": "Сложная, объемная фигура указанной формы. При надувании используется только гелий. Имеет встроенный клапан - что упрощает надувание. Тонкая миларовая (фольга на полиэтиленовой основе) пленка позволяет шарам не сдуваться от недели до одного месяца.",
  "measure_unit": {
    "name": "шт",
    "weight": 28,
    "height": 0.1,
    "volume": 0.056,
    "width": 23.5,
    "length": 24,
    "common": {
      "name": "шт",
      "full_name": "Штука"
    },
    "full_name": "Штука",
    "id": 256418
  },
  "properties": [
    {
      "name": "Индивидуальная упаковка",
      "image": "https://new.sharik.ru/static/images/nophoto_white_square.png",
      "value": "Нет",
      "unimportant": false,
      "value_id": 50187,
      "id": 24029843
    },
    {
      "name": "Наличие клапана",
      "image": "https://new.sharik.ru/static/images/nophoto_white_square.png",
      "value": "Да",
      "unimportant": false,
      "value_id": 70956,
      "id": 24029847
    },
    {
      "name": "Вид материала",
      "image": "https://new.sharik.ru/static/images/nophoto_white_square.png",
      "value": "Шары фигурные большие",
      "unimportant": true,
      "value_id": 28367,
      "id": 24020647
    },
    {
      "name": "Группа материала",
      "image": "https://new.sharik.ru/static/images/nophoto_white_square.png",
      "value": "Фигура Flexmetal",
      "unimportant": true,
      "value_id": 28053,
      "id": 24020648
    },
    {
      "name": "Код ТНВЭД",
      "image": "https://new.sharik.ru/static/images/nophoto_white_square.png",
      "value": "9503 00 9909",
      "unimportant": true,
      "value_id": 29485,
      "id": 24020644
    },
    {
      "name": "Количество порций гелия",
      "image": "https://new.sharik.ru/static/images/nophoto_white_square.png",
      "value": "10",
      "unimportant": false,
      "value_id": 69533,
      "id": 24029846
    },
    {
      "name": "Коллекция",
      "image": "/media/property_value/%D0%A0%D0%BE%D1%81%D1%81%D0%B8%D1%8F_%D0%92%D0%BF%D0%B5%D1%80%D0%B5%D0%B4.png",
      "value": "Россия, вперед!",
      "unimportant": false,
      "value_id": 27231,
      "id": 24029835
    },
    {
      "name": "Наличие рисунка",
      "image": "https://new.sharik.ru/static/images/nophoto_white_square.png",
      "value": "Шар с рисунком",
      "unimportant": false,
      "value_id": 27796,
      "id": 24029838
    },
    {
      "name": "Наш дизайн",
      "image": "/media/property_value/%D0%BD%D0%B0%D1%88.png",
      "value": "Наш дизайн",
      "unimportant": false,
      "value_id": 27750,
      "id": 24029840
    },
    {
      "name": "Отрасль",
      "image": "https://new.sharik.ru/static/images/nophoto_white_square.png",
      "value": "2Шары фольгированные",
      "unimportant": true,
      "value_id": 28414,
      "id": 24020649
    },
    {
      "name": "Признак продажи надутым",
      "image": "https://new.sharik.ru/static/images/nophoto_white_square.png",
      "value": "Надуть гелием (10 порций)",
      "unimportant": false,
      "value_id": 70610,
      "id": 24029845
    },
    {
      "name": "Размер",
      "image": "https://new.sharik.ru/static/images/nophoto_white_square.png",
      "value": "70см/28\" - 100см/40\"",
      "unimportant": false,
      "value_id": 27774,
      "id": 24029839
    },
    {
      "name": "Размер фольга",
      "image": "/media/property_value/32.png",
      "value": "32\"",
      "unimportant": false,
      "value_id": 28260,
      "id": 24029828
    },
    {
      "name": "Размеры\\Габариты",
      "image": "https://new.sharik.ru/static/images/nophoto_white_square.png",
      "value": "80CM.H*75CM.H",
      "unimportant": false,
      "value_id": 34024,
      "id": 24020645
    },
    {
      "name": "Событие",
      "image": "/media/property_value/%D0%9D%D0%9821_%D0%94%D0%B5%D0%BD%D1%8C_%D0%9F%D0%BE%D0%B1%D0%B5%D0%B4%D1%8B.png",
      "value": "День Победы",
      "unimportant": false,
      "value_id": 28434,
      "id": 24029831
    },
    {
      "name": "Способ выкладки",
      "image": "/media/property_value/%D0%BF%D0%BE%D0%BB%D0%BA%D0%B0.png",
      "value": "Полка",
      "unimportant": false,
      "value_id": 64567,
      "id": 24029844
    },
    {
      "name": "Статус мелкий опт",
      "image": "https://new.sharik.ru/static/images/nophoto_white_square.png",
      "value": "Базовый ассортимент",
      "unimportant": false,
      "value_id": 27733,
      "id": 24029841
    },
    {
      "name": "Статус товара",
      "image": "https://new.sharik.ru/static/images/nophoto_white_square.png",
      "value": "Базовый ассортимент",
      "unimportant": false,
      "value_id": 28422,
      "id": 24029832
    },
    {
      "name": "Статус Франшиза",
      "image": "https://new.sharik.ru/static/images/nophoto_white_square.png",
      "value": "Базовый ассортимент",
      "unimportant": true,
      "value_id": 27724,
      "id": 24029842
    },
    {
      "name": "Товарная номенклатура",
      "image": "/media/property_value/%D0%A8._%D0%B8%D0%B7_%D1%84%D0%BE%D0%BB%D1%8C%D0%B3%D0%B8.png",
      "value": "Шарики из фольги",
      "unimportant": false,
      "value_id": 51733,
      "id": 24029837
    },
    {
      "name": "Форма фольга",
      "image": "/media/property_value/%D0%A4%D0%A4_%D1%84%D0%B8%D0%B3%D1%83%D1%80%D0%B0_60.png",
      "value": "Фигура",
      "unimportant": false,
      "value_id": 29144,
      "id": 24029830
    },
    {
      "name": "Цвет фольга",
      "image": "/media/property_value/%D0%97%D0%B5%D0%BB%D0%B5%D0%BD%D1%8B%D0%B9.png",
      "value": "Зеленый/Green",
      "unimportant": true,
      "value_id": 29242,
      "id": 24029829
    }
  ],
  "promotions": [],
  "name": "Ф ФИГУРА РУС Танк",
  "rests": [
    {
      "warehouse": {
        "city": 1,
        "name": "Садовод-Салют, склад-магазин",
        "is_visible": true,
        "country": 1,
        "coordinates": "",
        "address": "ул. Верхние Поля, 56, стр. 11, Садовод, ТЦ “Салют” Вход №1, 3 этаж, павильон № 20",
        "id": 24
      },
      "date_of_new_arrival": null,
      "new_arrival": null,
      "id": 126560,
      "rest": 14
    },
    {
      "warehouse": {
        "city": 1,
        "name": "РЦ, Зеленоград",
        "is_visible": true,
        "country": 1,
        "coordinates": "",
        "address": "Зеленоград, ул.Заводская, д.18, стр.9",
        "id": 25
      },
      "date_of_new_arrival": null,
      "new_arrival": 5278,
      "id": 126539,
      "rest": 4523
    },
    {
      "warehouse": {
        "city": 1,
        "name": "Фуд Сити, склад-магазин",
        "is_visible": true,
        "country": 1,
        "coordinates": "",
        "address": "Москва, п. Сосненское, 22-й км Калужского шоссе, здание №10",
        "id": 27
      },
      "date_of_new_arrival": null,
      "new_arrival": null,
      "id": 183835,
      "rest": 40
    },
    {
      "warehouse": {
        "city": 1,
        "name": "Сокол, склад-магазин",
        "is_visible": true,
        "country": 1,
        "coordinates": "",
        "address": "ул.Дубосековская, д 4 (МАИ ГУП)",
        "id": 22
      },
      "date_of_new_arrival": null,
      "new_arrival": 100,
      "id": 126546,
      "rest": 115
    },
    {
      "warehouse": {
        "city": 1,
        "name": "Нагорный, склад-магазин",
        "is_visible": true,
        "country": 1,
        "coordinates": "",
        "address": "Нагорный проезд, дом 7, Институт вакуумной техники имени С. А. Векшинского, м.Нагатинская",
        "id": 21
      },
      "date_of_new_arrival": null,
      "new_arrival": null,
      "id": 126553,
      "rest": 77
    }
  ],
  "multiplicity": 1,
  "default_price": {
    "is_rrc": false,
    "is_visible": false,
    "price_type": "PR00//ALL//1000",
    "currency_price": 147,
    "is_default": false,
    "currency": "RUB",
    "original_currency_price": 147,
    "position": 1
  },
  "popularity": 689,
  "multiplicity_measure_unit": "шт",
  "icons_property_value": [
    {
      "value__image": "/media/property_value/32.png",
      "value__property__name": "Размер фольга",
      "value__name": "32\"",
      "value__property__value_icon_position": 4
    },
    {
      "value__image": "/media/property_value/spain_glossy_wave_icon_60.png",
      "value__property__name": "Страна",
      "value__name": "Испания",
      "value__property__value_icon_position": 1
    },
    {
      "value__image": "/media/property_value/%D0%BD%D0%B0%D1%88.png",
      "value__property__name": "Наш дизайн",
      "value__name": "Наш дизайн",
      "value__property__value_icon_position": 0
    }
  ],
  "dist_markets": "",
  "origin_properties": [
    {
      "name": "Артикул производителя",
      "image": "https://new.sharik.ru/static/images/nophoto_white_square.png",
      "value": "P911506",
      "unimportant": false,
      "value_id": 48680,
      "id": 24020646
    },
    {
      "name": "Торговая марка",
      "image": "/media/property_value/FLEXMETAL.png",
      "value": "Flex Metal",
      "unimportant": false,
      "value_id": 27920,
      "id": 24020650
    },
    {
      "name": "Страна",
      "image": "/media/property_value/spain_glossy_wave_icon_60.png",
      "value": "Испания",
      "unimportant": false,
      "value_id": 27858,
      "id": 24029836
    }
  ],
  "measure_prices": [
    {
      "measure_unit": {
        "name": "шт",
        "weight": 28,
        "height": 0.1,
        "volume": 0.056,
        "width": 23.5,
        "length": 24,
        "common": {
          "name": "шт",
          "full_name": "Штука"
        },
        "full_name": "Штука",
        "id": 256418
      },
      "price": {
        "is_rrc": false,
        "is_visible": false,
        "price_type": "PR00//ALL//1000",
        "currency_price": 147,
        "is_default": false,
        "currency": "RUB",
        "original_currency_price": 147,
        "position": 1
      }
    },
    {
      "measure_unit": {
        "name": "кор",
        "weight": 2810,
        "height": 9.929,
        "volume": 5.6,
        "width": 23.5,
        "length": 24,
        "common": {
          "name": "кор",
          "full_name": "Коробка"
        },
        "full_name": "Коробка",
        "id": 256419
      },
      "price": {
        "is_rrc": false,
        "is_visible": false,
        "price_type": "PR00//ALL//1000",
        "currency_price": 14700,
        "is_default": false,
        "currency": "RUB",
        "original_currency_price": 14700,
        "position": 1
      }
    }
  ]
}

// Функция преобразования артикула в тег
const articleToTag = (article) => {
  if (!article) return null;
  return article.trim();
};

export const Products = () => {  
  const { t } = useContext(LanguageContext);
  const { article } = useParams();
  const getCode = useGetCode();
  
  const [productInfo, setProductInfo] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [storageImages, setStorageImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    portal: null,
    storage: null
  });

  const [activeTab, setActiveTab] = useState('characteristics');

  // Состояния для слайдера
  const [sliderConfig, setSliderConfig] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
    source: null // 'portal' или 'storage'
  });

  // Функция открытия слайдера для портала
  const openPortalSlider = (index) => {
    setSliderConfig({
      isOpen: true,
      images: productImages,
      currentIndex: index,
      source: 'portal'
    });
  };

  // Функция открытия слайдера для хранилища
  const openStorageSlider = (index) => {
    setSliderConfig({
      isOpen: true,
      images: storageImages,
      currentIndex: index,
      source: 'storage'
    });
  };

  // Функция закрытия слайдера
  const closeSlider = () => {
    setSliderConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Функция изменения индекса в слайдере
  const handleSliderIndexChange = (newIndex) => {
    setSliderConfig(prev => ({ ...prev, currentIndex: newIndex }));
  };

  useEffect(() => {
    const fetchProductData = async () => {
      if (!article) {
        console.log('Артикул не указан');
        return;
      }

      setLoading(true);
      setErrors({ portal: null, storage: null });

      // Сбрасываем состояния перед новой загрузкой
      setProductInfo(null);
      setProductImages([]);
      setStorageImages([]);

      try {
        // 1. Запрос на портал - оборачиваем в try/catch отдельно
        try {
          const searchQuery = encodeURIComponent(article);
          const searchResponse = await fetch(`https://new.sharik.ru/api/rest/v1/products_lite/?page_size=100&search=${searchQuery}&ordering=relevance&supplier_category__isnull=False`);
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log('Результаты поиска товара:', searchData);

            if (searchData.results && searchData.results.length > 0) {
              // Берем первый найденный товар
              const productId = searchData.results[0].id;
                            
              try {
                // 2. Запрос детальной информации по ID товара
                const detailedResponse = await fetch(`https://new.sharik.ru/api/rest/v1/products_detailed/${productId}/`);
                
                if (detailedResponse.ok) {
                  const detailedData = await detailedResponse.json();
                  
                  console.log('Детальная информация о товаре:', detailedData);
                  setProductInfo(detailedData);

                  // Формируем массив ссылок на изображения из портала
                  if (detailedData.images && Array.isArray(detailedData.images)) {
                    const portalImages = detailedData.images.map(img => 
                      `https://new.sharik.ru${img.image}`
                    );
                    console.log('Изображения с портала:', portalImages);
                    setProductImages(portalImages);
                  }
                } else {
                  console.warn('Не удалось получить детальную информацию о товаре');
                  setErrors(prev => ({ ...prev, portal: 'Детальная информация не загрузилась' }));
                }
              } catch (detailError) {
                console.warn('Ошибка при запросе детальной информации:', detailError);
                setErrors(prev => ({ ...prev, portal: 'Ошибка загрузки детальной информации' }));
              }
            } else {
              console.log('Товар с артикулом', article, 'не найден на портале');
              setErrors(prev => ({ ...prev, portal: 'Товар не найден на портале' }));
            }
          } else {
            console.warn('Ошибка при поиске товара:', searchResponse.status);
            setErrors(prev => ({ ...prev, portal: `Ошибка поиска: ${searchResponse.status}` }));
          }
        } catch (portalError) {
          setProductInfo(ifo)
          console.warn('Ошибка при запросе к порталу:', portalError);
          setErrors(prev => ({ ...prev, portal: 'Не удалось подключиться к порталу' }));
        }

        // 3. Запрос в хранилище по артикулу с использованием специфичной логики
        try {
          // Преобразуем артикул в тег
          const articleTag = articleToTag(article);
          
          if (articleTag) {
            // Формируем params как в loadImagesFromBackend
            const params = {
              page: 1,
              limit: 100,
              sortBy: 'uploadDate',
              sortOrder: 'desc'
            };

            // Подготовка тегов с дублированием для бэкенда
            if (articleTag) {
              params.tags = [articleTag, articleTag];
            }

            // Очищаем пустые параметры
            Object.keys(params).forEach(key => {
              if (params[key] === '' || params[key] === undefined || 
                  (Array.isArray(params[key]) && params[key].length === 0)) {
                delete params[key];
              }
            });

            console.log('Параметры запроса к хранилищу:', params);

            // Выбираем нужный API метод в зависимости от прав
            const storageResponse = await apiGetAllImages(params);

            console.log('Ответ от хранилища:', storageResponse);

            if (storageResponse && storageResponse.files && Array.isArray(storageResponse.files)) {
              const storageImageUrls = storageResponse.files.map(file => 
                `https://mp.sharik.ru${file.thumbnailUrl}`
              );
              console.log('Изображения из хранилища:', storageImageUrls);
              setStorageImages(storageImageUrls);
            } else {
              console.warn('Хранилище вернуло пустой ответ или неверный формат');
              setErrors(prev => ({ ...prev, storage: 'Нет изображений в хранилище' }));
            }
          } else {
            console.warn('Не удалось преобразовать артикул в тег');
            setErrors(prev => ({ ...prev, storage: 'Неверный формат артикула' }));
          }
        } catch (storageError) {
          console.warn('Ошибка при запросе к хранилищу:', storageError);
          setErrors(prev => ({ ...prev, storage: 'Не удалось подключиться к хранилищу' }));
          setStorageImages([]);
        }

      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [article]);

  // Выводим в консоль при изменении состояний
  useEffect(() => {
    if (productInfo) {
      console.log('Стейт productInfo обновлен:', productInfo);
    }
  }, [productInfo]);

  useEffect(() => {
    if (productImages.length > 0) {
      console.log('Стейт productImages обновлен:', productImages);
    }
  }, [productImages]);

  useEffect(() => {
    if (storageImages.length > 0) {
      console.log('Стейт storageImages обновлен:', storageImages);
    }
  }, [storageImages]);

  // Получаем коды для маркетплейсов
  const wbCode = article ? getCode(article, "WB") : null;
  const ozCode = article ? getCode(article, "OZ") : null;
  
  // Проверяем, есть ли товар на какой-либо площадке
  const hasMarketplace = (wbCode !== article) || (ozCode !== article);

  return (
    <div className="products-container">
      {/* Шапка */}
      <div className='header-section' style={{ margin: '10px 10px 0px'}}>
        <h2 style={{ color: '#333'}}>
          {article ? article : 'Неизвестный товар'}
          {productInfo?.name && <span style={{ marginLeft: '10px', fontWeight: '400', fontSize: '18px', color: '#666' }}>{productInfo.name}</span>}
        </h2>
        
        {/* Блок с информацией о маркетплейсах */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginLeft: 'auto'
        }}>
          {hasMarketplace ? (
            <>
              <span style={{ color: '#666', fontSize: '14px' }}>
                {t('grid.linkTo')}
              </span>
              {wbCode !== article && (
                <a 
                  className="marketplace-link"
                  href={`https://www.wildberries.ru/catalog/${wbCode}/detail.aspx`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none'
                  }}
                >
                  <svg width="30" height="30" viewBox="0 0 511 511" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_275_5)">
                      <path d="M0 239.894C0 155.923 0 113.938 16.3419 81.8655C30.7165 53.6535 53.6535 30.7165 81.8655 16.3419C113.938 0 155.923 0 239.894 0H271.106C355.077 0 397.062 0 429.135 16.3419C457.346 30.7165 480.284 53.6535 494.659 81.8655C511 113.938 511 155.923 511 239.894V271.106C511 355.077 511 397.062 494.659 429.135C480.284 457.346 457.346 480.284 429.135 494.659C397.062 511 355.077 511 271.106 511H239.894C155.923 511 113.938 511 81.8655 494.659C53.6535 480.284 30.7165 457.346 16.3419 429.135C0 397.062 0 355.077 0 271.106V239.894Z" fill="url(#paint0_linear_275_5)"/>
                      <path d="M386.626 180.313C368.325 180.313 351.797 185.847 337.686 195.32V108.862H298.648V268.31C298.648 316.821 338.115 355.859 386.411 355.859C434.708 355.859 474.623 317.054 474.623 267.862C474.623 218.669 435.584 180.313 386.626 180.313ZM209.461 279.576L173.736 186.511H146.391L110.45 279.576L74.5113 186.511H31.9255L94.781 350.149H122.126L159.839 252.679L197.767 350.149H225.111L287.753 186.511H245.4L209.461 279.576ZM386.43 316.84C359.963 316.84 337.686 295.674 337.686 268.096C337.686 240.517 358.638 219.585 386.645 219.585C414.652 219.585 435.604 241.413 435.604 268.096C435.604 294.778 413.327 316.84 386.43 316.84Z" fill="white"/>
                    </g>
                    <defs>
                      <linearGradient id="paint0_linear_275_5" x1="171.882" y1="555.132" x2="485.45" y2="32.5182" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6F01FB"/>
                        <stop offset="1" stopColor="#FF49D7"/>
                      </linearGradient>
                      <clipPath id="clip0_275_5">
                        <rect width="511" height="511" fill="white"/>
                      </clipPath>
                    </defs>
                  </svg>
                </a>
              )}
              {ozCode !== article && (
                <a 
                  className="marketplace-link"
                  href={`https://www.ozon.ru/product/${ozCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none'
                  }}
                >
                  <svg width="30" height="30" viewBox="0 0 511 511" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_275_2)">
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
                </a>
              )}
            </>
          ) : (
            <span style={{ color: '#999', fontSize: '14px', fontStyle: 'italic' }}>
              {t('grid.linkNo')}
            </span>
          )}
        </div>
      </div>

      {/* Контейнер с панелью слева и контентом */}
      <div className="contents-wrapper">

{/* Левая панель с информацией о товаре */}
<div className="empty-sidebar">
  
  {/* Табы */}
  <div style={{ 
    display: 'flex', 
    borderBottom: '1px solid #d4e6fb',
    background: '#f0f6fd',
    width: '100%'
  }}>
    <div 
      style={{ 
        flex: 1,
        padding: '12px 16px',
        cursor: 'pointer',
        textAlign: 'center',
        borderBottom: activeTab === 'characteristics' ? '2px solid #1a5a9c' : 'none',
        color: activeTab === 'characteristics' ? '#1a5a9c' : '#666',
        fontWeight: activeTab === 'characteristics' ? '600' : '400',
        transition: 'all 0.2s ease'
      }}
      onClick={() => setActiveTab('characteristics')}
    >
      Характеристики
    </div>
    <div 
      style={{ 
        flex: 1,
        padding: '12px 16px',
        cursor: 'pointer',
        textAlign: 'center',
        borderBottom: activeTab === 'availability' ? '2px solid #1a5a9c' : 'none',
        color: activeTab === 'availability' ? '#1a5a9c' : '#666',
        fontWeight: activeTab === 'availability' ? '600' : '400',
        transition: 'all 0.2s ease'
      }}
      onClick={() => setActiveTab('availability')}
    >
      Наличие
    </div>
  </div>

  {/* Контент табов */}
  <div style={{ padding: '10px 10px 5px 10px' }}>
    {/* Таб Характеристики */}
    {activeTab === 'characteristics' && (
      <>
               
        {loading && (
          <div style={{ textAlign: 'center', padding: '10px', color: '#666' }}>
            Загрузка свойств...
          </div>
        )}
        
        {productInfo?.properties && productInfo.properties.length > 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '4px',
            maxHeight: 'calc(100vh - 180px)',
            overflowY: 'auto',
            paddingRight: '10px', 
            marginRight: '-10px',
          }}>

            {/* Цена товара */}
            {productInfo.default_price && (
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 6px 4px 6px',
                  fontSize: '14px',
                  marginBottom: '4px',
                }}
              >
                <span style={{ 
                  color: '#1a5a9c',
                  fontWeight: '700',
                  maxWidth: '50%'
                }}>
                  Цена
                </span>
                <span style={{ 
                  color: '#1a3a5c',
                  fontWeight: '700',
                  textAlign: 'right',
                  maxWidth: '50%',
                  fontSize: '16px'
                }}>
                  {productInfo.default_price.currency_price} ₽
                </span>
              </div>
            )}

        {/* Минимальная партия поставки */}
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 6px 4px 6px',
            fontSize: '13px',
            marginBottom: '4px'
          }}
        >
          <span style={{ 
            color: '#1a5a9c',
            fontWeight: '600',
            maxWidth: '50%'
          }}>
            Минимальная партия поставки
          </span>
          <span style={{ 
            color: '#1a3a5c',
            fontWeight: '600',
            textAlign: 'right',
            maxWidth: '50%'
          }}>
            {productInfo.multiplicity || '0'} {productInfo.multiplicity_measure_unit || 'шт'}
          </span>
        </div>

            {/* Торговая марка из origin_properties */}
            {productInfo.origin_properties?.map(prop => {
              if (prop.name === 'Торговая марка') {
                return (
                  <div 
                    key={prop.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 6px 4px 6px',
                      fontSize: '13px',
                    }}
                  >
                    <span style={{ 
                      color: '#1a5a9c',
                      fontWeight: '600',
                      maxWidth: '50%'
                    }}>
                      {prop.name}
                    </span>
                    <span style={{ 
                      color: '#1a3a5c',
                      fontWeight: '500',
                      textAlign: 'right',
                      maxWidth: '50%'
                    }}>
                      {prop.value}
                    </span>
                  </div>
                );
              }
              return null;
            })}

            {/* Страна из origin_properties */}
            {productInfo.origin_properties?.map(prop => {
              if (prop.name === 'Страна') {
                return (
                  <div 
                    key={prop.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 6px 24px 6px',
                      fontSize: '13px',
                    }}
                  >
                    <span style={{ 
                      color: '#1a5a9c',
                      fontWeight: '600',
                      maxWidth: '50%'
                    }}>
                      {prop.name}
                    </span>
                    <span style={{ 
                      color: '#1a3a5c',
                      fontWeight: '500',
                      textAlign: 'right',
                      maxWidth: '50%'
                    }}>
                      {prop.value}
                    </span>
                  </div>
                );
              }
              return null;
            })}

            <h4 style={{ margin: '0 0 10px 0', color: '#1a5a9c' }}>Информация о товаре:</h4>

            {productInfo.properties.map((prop, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0px 6px 6px 6px',
                  fontSize: '13px'
                }}
              >
                <span style={{ 
                  color: '#2c5f9a',
                  fontWeight: '500',
                  whiteSpace: 'wrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '50%'
                }}>
                  {prop.name}
                </span>
                <span style={{ 
                  color: '#1a3a5c',
                  fontWeight: '400',
                  textAlign: 'right',
                  whiteSpace: 'wrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '50%'
                }}>
                  {prop.value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#999',
              fontStyle: 'italic'
            }}>
              Нет данных о свойствах товара
            </div>
          )
        )}
      </>
    )}

    {/* Таб Наличие */}
    {activeTab === 'availability' && (
      <>
                
        {loading && (
          <div style={{ textAlign: 'center', padding: '10px', color: '#666' }}>
            Загрузка информации о наличии...
          </div>
        )}
        
        {productInfo?.rests && productInfo.rests.length > 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '4px',
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            paddingRight: '5px'
          }}>
            {productInfo.rests.map((rest, index) => (
              <div 
                key={index}
                style={{
                  padding: '8px',
                  borderBottom: '1px dashed #d4e6fb'
                }}
              >
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                  fontSize: '14px'
                }}>
                  <span style={{ 
                    color: '#2c5f9a',
                    fontWeight: '600',
                  }}>
                    {rest.warehouse.name}
                  </span>
                  <span style={{ 
                    color: '#1a3a5c',
                    fontWeight: '400',
                  }}>
                    {rest.rest} {productInfo.multiplicity_measure_unit || 'шт'}
                  </span>
                </div>
                <div style={{ 
          fontSize: '11px',
          minHeight: '18px', 
          color: rest.new_arrival ? '#8a8a8a' : 'transparent', // Прозрачный текст если нет данных
          marginTop: '2px',
          visibility: rest.new_arrival ? 'visible' : 'hidden' 
        }}>
          {rest.new_arrival ? `Ожидается поступление: ${rest.new_arrival} ${productInfo.multiplicity_measure_unit || 'шт'}` : ' '} {/* Неразрывный пробел для сохранения высоты */}
        </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#999',
              fontStyle: 'italic'
            }}>
              Нет информации о наличии
            </div>
          )
        )}
      </>
    )}
  </div>
</div>
        
        {/* Основной контент */}
        <div className="main-content" style={{ 
          height: 'calc(80vh - 120px)', // Фиксированная высота с учетом шапки
          overflowX: 'hidden', 
          overflowY: 'auto', // Скролл только для правой части
          paddingRight: '5px'
        }}>
          {loading && <div style={{ padding: '20px' }}>Загрузка...</div>}
          
          {/* Отображаем ошибки, но не блокируем отображение других данных */}
          {errors.portal && (
            <div style={{ padding: '10px 20px', color: '#ff6b6b', background: '#fff5f5', borderLeft: '2px solid #ffa1a1', borderRadius: '4px' }}>
              Ошибка портала: {errors.portal}
            </div>
          )}

          {errors.storage && (
            <div style={{ padding: '10px 20px', color: '#ff6b6b', background: '#fff5f5', borderLeft: '2px solid #ffa1a1', borderRadius: '4px' }}>
              Ошибка хранилища: {errors.storage}
            </div>
          )}

          {/* Секция с изображениями с портала */}
          {productImages.length > 0 && (
            <div style={{ 
              padding: '20px', 
              borderBottom: '1px solid #eee', 
              boxShadow: '0 4px 6px -4px rgba(0, 0, 0, 0.1)', 
              marginBottom: '2px', backgroundColor: 'white' 
            }}>
              <h3  style={{ margin: '0' }}>Изображения с портала ({productImages.length}):</h3>
              <div className="image-grids">
                {productImages.map((img, index) => (
                  <div 
                    key={index} 
                    className="images_card"
                    onClick={() => openPortalSlider(index)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="images-container">
                      <img src={img} alt={`portal-${index}`} className="image-thumbnail" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )} 

          {/* Секция с изображениями из хранилища */}
          {storageImages.length > 0 && (
            <div style={{ padding: '20px' }}>
              <h3  style={{ margin: '0' }}>Изображения из хранилища ({storageImages.length}):</h3>
              <div className="image-grids">
                {storageImages.map((img, index) => (
                  <div 
                    key={index} 
                    className="images_card"
                    onClick={() => openStorageSlider(index)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="images-container">
                      <img src={img} alt={`storage-${index}`} className="image-thumbnail" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Модалка слайдера */}
          {sliderConfig.isOpen && (
            <ImageSliderModal
              baseCode={sliderConfig.source === 'portal' ? `${article} (портал)` : `${article} (хранилище)`}
              images={sliderConfig.images}
              currentIndex={sliderConfig.currentIndex}
              onClose={closeSlider}
              onIndexChange={handleSliderIndexChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};