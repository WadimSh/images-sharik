# Документация проекта Images-Sharik

## Содержание
1. [Описание приложения](#1-описание-приложения)
2. [Структура проекта](#2-структура-проекта)
3. [Компоненты](#3-компоненты)
4. [Структура данных](#4-структура-данных)
5. [Этапы разработки](#5-этапы-разработки)

## 1. Описание приложения

### 1.1 Общее описание
Images-Sharik - это веб-приложение для создания и редактирования дизайнов инфографики для маркетплейсов. Приложение предоставляет пользователям инструменты для работы с изображениями, текстом и графическими элементами.

### 1.2 Основной функционал

#### 1.2.1 

#### 1.2.2 

#### 1.2.3 Работа с макетами

#### 1.2.4 

#### 1.2.5 

#### 1.2.6 Работа с коллажами

### 1.3 Инструкция по использованию

#### 1.3.1 

#### 1.3.2 Редактирование элементов

#### 1.3.3 

## 2. Структура проекта

### 2.1 Файловая система
```
📦 images-sharik
├── 📄 package.json                # Конфигурация проекта и зависимости
├── 📄 package-lock.json           # Фиксация версий зависимостей
├── 📄 README.md                   # Описание проекта
├── 📄 documentation.md            # Документация проекта
├── 📄 .gitignore                  # Настройки игнорирования файлов Git
│
├── 📂 public/                     # Публичные статические файлы
│
├── 📂 src/                        # Исходный код приложения
│   ├── 📄 index.js               # Точка входа приложения
│   ├── 📄 App.js                 # Корневой компонент приложения
│   ├── 📄 index.css              # Глобальные стили
│   │
│   ├── 📂 components/            # Переиспользуемые компоненты
│   │   ├── 📄 DraggableElementsList.jsx    # Обертка для списка с drag-n-drop
│   │   ├── 📄 ElementsList.jsx             # Список элементов дизайна
│   │   ├── 📄 FontControls.jsx            # Контролы для работы со шрифтами
│   │   ├── 📄 ImageElement.jsx            # Компонент изображения
│   │   ├── 📄 TextElement.jsx             # Текстовый компонент
│   │   ├── 📄 ShapeElement.jsx            # Компонент фигуры
│   │   ├── 📄 ElementsElement.jsx         # Компонент элемента
│   │   ├── 📄 HeaderSection.jsx           # Шапка приложения
│   │   ├── 📄 ProductModal.jsx            # Модальное окно товара
│   │   ├── 📄 ImageLibraryModal.jsx       # Модальное окно библиотеки изображений
│   │   ├── 📄 TemplateModal.jsx           # Модальное окно шаблонов
│   │   └── 📂 ElementToolbar/             # Компоненты панели инструментов
│   │
│   ├── 📂 views/                 # Компоненты страниц
│   │   ├── 📂 Generator/         # Страница генератора дизайнов
│   │   │   └── 📄 Generator.jsx  # Основной компонент генератора
│   │   ├── 📂 Gallery/           # Страница галереи
│   │   └── 📂 Home/              # Домашняя страница
│   │
│   ├── 📂 context/              # React контексты
│   │   └── 📄 contextMarketplace.js  # Контекст для работы с маркетплейсами
│   │
│   ├── 📂 assets/               # Статические ресурсы
│   │   ├── 📂 fonts/           # Шрифты приложения
│   │   │   ├── 📄 GemarFont.otf
│   │   │   ├── 📄 BelbalFont.otf
│   │   │   └── 📄 HeliosCond.ttf
│   │   ├── 📂 styles/          # Стили компонентов
│   │   │   └── 📄 app.css      # Основные стили приложения
│   │   └── 📄 data.js          # Данные приложения
│   │
│   ├── 📂 utils/               # Вспомогательные функции
│   │   ├── 📄 hexToRgba.js     # Конвертация цветов
│   │   └── 📄 getCodeProduct.js # Получение кода продукта
│   │
│   ├── 📂 constants/           # Константы приложения
│   │
│   ├── 📂 services/            # Сервисы для работы с API
│   │
│   ├── 📂 routes/              # Маршрутизация
│   │
│   └── 📂 ui/                  # UI компоненты
│
├── 📂 build/                    # Скомпилированные файлы
│
└── 📂 node_modules/            # Зависимости проекта
```

### 2.2 Описание основных директорий и файлов

#### Исходный код (src/)
- `components/` - переиспользуемые React компоненты
  - Компоненты для работы с элементами дизайна
  - Модальные окна
  - Панели инструментов
  - Элементы управления
- `views/` - компоненты страниц
  - Generator - основной редактор дизайнов
  - Gallery - галерея работ
  - Home - домашняя страница
- `context/` - React контексты для управления состоянием
- `assets/` - статические ресурсы
  - Шрифты
  - Стили
  - Данные приложения
- `utils/` - вспомогательные функции
- `services/` - сервисы для работы с API
- `routes/` - конфигурация маршрутизации
- `ui/` - базовые UI компоненты

#### Компоненты (components/)
Основные компоненты приложения:
- `DraggableElementsList.jsx` - список с поддержкой drag-n-drop
- `ElementsList.jsx` - отображение и управление элементами
- `FontControls.jsx` - управление шрифтами
- `ImageElement.jsx` - работа с изображениями
- `TextElement.jsx` - работа с текстом
- `ShapeElement.jsx` - работа с фигурами
- `ElementsElement.jsx` - базовый компонент элемента
- `HeaderSection.jsx` - верхняя панель приложения
- `ProductModal.jsx` - работа с товарами
- `TemplateModal.jsx` - работа с шаблонами

## 3. Компоненты

### 3.1 Основные компоненты

#### Generator.jsx
- **Назначение**: Основной компонент редактора дизайнов
- **Входные данные**:
  - id: string (идентификатор дизайна или режим коллажа)
- **Основной функционал**:
  - Управление элементами дизайна
  - Обработка drag-and-drop
  - Работа с шаблонами и макетами
  - Управление выделением элементов
  - Обработка горячих клавиш
  - Сохранение состояния дизайна

#### DraggableElementsList.jsx
- **Назначение**: Обертка для списка элементов с поддержкой drag-n-drop
- **Входные данные**:
  - elements: Array<Element>
  - moveElement: Function
  - selectedElementId: string
  - selectedElementIds: Array<string>
- **Основной функционал**:
  - Обеспечение drag-n-drop функциональности
  - Передача пропсов в ElementsList

#### ElementsList.jsx
- **Назначение**: Отображение и управление списком элементов дизайна
- **Входные данные**:
  - elements: Array<Element>
  - selectedElementId: string
  - selectedElementIds: Array<string>
  - setSelectedElementId: Function
  - setSelectedElementIds: Function
- **Основной функционал**:
  - Отображение списка элементов
  - Управление выделением элементов
  - Редактирование свойств элементов
  - Управление слоями

#### ImageElement.jsx
- **Назначение**: Компонент для работы с изображениями
- **Входные данные**:
  - element: ImageElement
  - position: {x: number, y: number}
  - width: number
  - height: number
  - isFlipped: boolean
- **Основной функционал**:
  - Отображение изображений
  - Изменение размеров
  - Поворот и отражение
  - Обработка выделения

#### TextElement.jsx
- **Назначение**: Компонент для работы с текстом
- **Входные данные**:
  - element: TextElement
  - position: {x: number, y: number}
  - isEditing: boolean
- **Основной функционал**:
  - Редактирование текста
  - Форматирование
  - Изменение шрифтов
  - Управление стилями

#### ShapeElement.jsx
- **Назначение**: Компонент для работы с фигурами
- **Входные данные**:
  - element: ShapeElement
  - position: {x: number, y: number}
  - color: string
- **Основной функционал**:
  - Отображение фигур
  - Изменение размеров
  - Управление цветом и градиентом
  - Настройка скругления углов

#### ElementsElement.jsx
- **Назначение**: Базовый компонент для элементов дизайна
- **Входные данные**:
  - element: Element
  - position: {x: number, y: number}
- **Основной функционал**:
  - Базовая функциональность элементов
  - Обработка позиционирования
  - Управление размерами
  - Обработка событий

#### HeaderSection.jsx
- **Назначение**: Верхняя панель управления приложением
- **Входные данные**:
  - captureRef: React.RefObject
  - templates: Object
  - selectedTemplate: string
- **Основной функционал**:
  - Управление шаблонами
  - Экспорт дизайна
  - Создание макетов
  - Навигация

#### ProductModal.jsx
- **Назначение**: Модальное окно для работы с товарами
- **Входные данные**:
  - isOpen: boolean
  - onClose: Function
  - onSelectImage: Function
- **Основной функционал**:
  - Поиск товаров
  - Выбор изображений
  - Получение информации о товаре
  - Добавление товара в дизайн

#### ImageLibraryModal.jsx
- **Назначение**: Модальное окно библиотеки изображений
- **Входные данные**:
  - isOpen: boolean
  - onClose: Function
  - onSelectImage: Function
- **Основной функционал**:
  - Просмотр библиотеки изображений
  - Выбор изображений
  - Фильтрация и поиск

#### TemplateModal.jsx
- **Назначение**: Модальное окно для работы с шаблонами
- **Входные данные**:
  - setIsTemplateModalOpen: Function
  - setTemplates: Function
  - setSelectedTemplate: Function
- **Основной функционал**:
  - Создание шаблонов
  - Сохранение шаблонов
  - Выбор шаблона
  - Предпросмотр

#### FontControls.jsx
- **Назначение**: Панель управления шрифтами
- **Входные данные**:
  - element: TextElement
  - onChange: Function
  - onChangeMulti: Function
- **Основной функционал**:
  - Выбор шрифта
  - Настройка размера
  - Управление стилями
  - Выбор цвета текста

#### ElementToolbar
- **Назначение**: Панель инструментов для добавления элементов
- **Входные данные**:
  - onAddElement: Function
- **Основной функционал**:
  - Добавление текста
  - Добавление изображений
  - Добавление фигур
  - Загрузка файлов

### 3.2 Вспомогательные компоненты

#### CollagePreview.jsx
- **Назначение**: Предпросмотр коллажей
- **Основной функционал**:
  - Отображение превью коллажа
  - Обработка выбора элементов

#### ProductMetaInfo.jsx
- **Назначение**: Отображение метаинформации о товаре
- **Основной функционал**:
  - Показ информации о товаре
  - Отображение артикула и характеристик

#### ProductImagesGrid.jsx
- **Назначение**: Сетка изображений товара
- **Основной функционал**:
  - Отображение всех изображений товара
  - Выбор активного изображения

### 3.3 Взаимодействие компонентов

1. **Основной поток данных**:
   

2. **Обработка событий**:
   

3. **Состояние приложения**:
   

4. **Обмен данными**:
   

## 4. Структура данных

### 4.1 Шаблоны
Шаблоны хранятся в формате JSON и представляют собой массив элементов. Каждый шаблон содержит набор элементов с их позициями и свойствами.

```javascript
[
  // Элемент изображения товара
  {
    "id": number,          // Уникальный идентификатор элемента
    "type": "image",       // Тип элемента: image, text, element, shape
    "position": {
      "x": number,         // Позиция по горизонтали
      "y": number          // Позиция по вертикали
    },
    "isFlipped": boolean,  // Флаг отражения
    "image": string,       // URL изображения или "{{ITEM_IMAGE}}" для товара
    "isProduct": boolean,  // Флаг основного изображения товара
    "width": number,       // Ширина элемента
    "height": number,      // Высота элемента
    "originalWidth": number,    // Оригинальная ширина изображения
    "originalHeight": number,   // Оригинальная высота изображения
    "rotation": number     // Угол поворота (опционально)
  },

  // Элемент графического элемента
  {
    "id": number,
    "type": "element",
    "position": {
      "x": number,
      "y": number
    },
    "isFlipped": boolean,
    "image": string,       // Путь к изображению элемента
    "width": number,
    "height": number,
    "rotation": number,
    "originalWidth": number,
    "originalHeight": number
  },

  // Текстовый элемент
  {
    "id": number,
    "type": "text",
    "position": {
      "x": number,
      "y": number
    },
    "text": string,        // Текст или "{{ITEM_CODE}}" для кода товара
    "fontSize": number,    // Размер шрифта
    "fontFamily": string,  // Семейство шрифта
    "color": string,       // Цвет текста
    "isProductCode": boolean  // Флаг кода товара
  },

  // Элемент фигуры
  {
    "id": number,
    "type": "shape",
    "position": {
      "x": number,
      "y": number
    },
    "width": number,
    "height": number,
    "color": string,      // Цвет фигуры
    "gradient": {         // Настройки градиента (опционально)
      "direction": string,
      "colors": string[],
      "opacity": number[]
    },
    "borderRadius": {     // Скругление углов (опционально)
      "topLeft": number,
      "topRight": number,
      "bottomLeft": number,
      "bottomRight": number
    }
  }
]
```

Шаблоны разделены на несколько категорий:
- `default-template.json` - базовый шаблон с основным изображением товара
- `main-template.json` - основной шаблон с дополнительными элементами
- `gemar-template.json` - специализированный шаблон для товаров Gemar
- `belbal-template.json` - специализированный шаблон для товаров Belbal

Каждый шаблон может содержать специальные плейсхолдеры:
- `{{ITEM_IMAGE}}` - заменяется на изображение товара
- `{{ITEM_CODE}}` - заменяется на код товара

### 4.2 Элементы
```javascript
// Базовые свойства для всех элементов
{
  id: number,          // Уникальный идентификатор элемента
  type: string,        // Тип элемента: 'text' | 'image' | 'shape' | 'element'
  position: {          // Позиция элемента на холсте
    x: number,         // Координата по горизонтали
    y: number          // Координата по вертикали
  },
  rotation: number,    // Угол поворота в градусах
  width?: number,      // Ширина элемента (для image, shape, element)
  height?: number,     // Высота элемента (для image, shape, element)
  isFlipped?: boolean, // Флаг отражения элемента
}

// Специфичные свойства для текстового элемента (type: 'text')
{
  ...базовые свойства,
  text: string,        // Текст элемента
  fontSize: number,    // Размер шрифта
  fontFamily: string,  // Семейство шрифта (например, 'HeliosCond')
  color: string,       // Цвет текста
  isProductCode?: boolean // Флаг, указывающий что это код товара
}

// Специфичные свойства для изображения (type: 'image')
{
  ...базовые свойства,
  image: string,       // URL изображения
  isProduct?: boolean, // Флаг, указывающий что это изображение товара
  originalWidth: number,  // Оригинальная ширина изображения
  originalHeight: number  // Оригинальная высота изображения
}

// Специфичные свойства для графического элемента (type: 'element')
{
  ...базовые свойства,
  image: string,       // Путь к изображению элемента
  originalWidth: number,  // Оригинальная ширина элемента
  originalHeight: number  // Оригинальная высота элемента
}

// Специфичные свойства для фигуры (type: 'shape')
{
  ...базовые свойства,
  color: string,       // Цвет фигуры в формате HEX
  gradient?: {         // Настройки градиента (опционально)
    direction: string, // Направление градиента
    colors: string[],  // Массив цветов в формате HEX
    opacity: number[], // Массив значений прозрачности
    start: number     // Начальная точка градиента в процентах
  },
  borderRadius?: {     // Скругление углов (опционально)
    topLeft: number,
    topRight: number,
    bottomLeft: number,
    bottomRight: number
  },
  opacity?: number     // Прозрачность фигуры
}
```

Каждый элемент сохраняется в sessionStorage как часть массива элементов дизайна. Ключи в sessionStorage:
- `design-${id}` - для дизайнов отдельных товаров
- `design-collage` - для коллажей
- `product-${code}` - для метаданных товаров

## 5. Этапы разработки

### 5.1 Веха 1: 

### 5.2 Веха 2: 

### 5.3 Веха 3: 

### 5.4 Веха 4: 

### 5.5 Веха 5: 
