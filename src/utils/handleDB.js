import Dexie from 'dexie';

export const db = new Dexie('SharikDatabase');

db.version(1).stores({
  designs: 'code', // Данные макетов дизайнов
  products: 'code', // Данные о товарах
  slides: 'code', // Данные слайдов
});

// Общий метод для очистки таблицы
const clearTable = async (table) => {
  try {
    await table.clear();
    return true;
  } catch (error) {
    console.error(`Error when clearing the table ${table.name}:`, error);
    throw error;
  }
};

// Методы для работы с таблицей designs
export const designsDB = {
  // Добавление нового дизайна
  async add(design) {
    try {
      return await db.designs.add(design);
    } catch (error) {
      console.error('Error when adding an entry:', error);
      throw error;
    }
  },

  // Получение дизайна по коду
  async get(code) {
    try {
      return await db.designs.get(code);
    } catch (error) {
      console.error('Error receiving the record:', error);
      throw error;
    }
  },

  // Получение всех дизайнов
  async getAll() {
    try {
      return await db.designs.toArray();
    } catch (error) {
      console.error('Error when receiving all records:', error);
      throw error;
    }
  },

  // Обновление дизайна
  async update(code, changes) {
    try {
      return await db.designs.update(code, changes);
    } catch (error) {
      console.error('Error updating the record:', error);
      throw error;
    }
  },

  // Удаление дизайна
  async delete(code) {
    try {
      return await db.designs.delete(code);
    } catch (error) {
      console.error('Error deleting an entry:', error);
      throw error;
    }
  }
};

// Методы для работы с таблицей products
export const productsDB = {
  // Добавление новой записи
  async add(record) {
    try {
      return await db.products.add(record);
    } catch (error) {
      console.error('Error when adding an entry:', error);
      throw error;
    }
  },

  // Получение записи по коду
  async get(code) {
    try {
      return await db.products.get(code);
    } catch (error) {
      console.error('Error receiving the record:', error);
      throw error;
    }
  },

  // Получение всех записей
  async getAll() {
    try {
      return await db.products.toArray();
    } catch (error) {
      console.error('Error when receiving all records:', error);
      throw error;
    }
  },

  // Upsert-операция (создать или обновить)
  async put(record) {
    try {
      return await db.products.put(record);
    } catch (error) {
      console.error('Error updating/adding an entry:', error);
      throw error;
    }
  },

  // Обновление записи
  async update(code, changes) {
    try {
      return await db.products.update(code, changes);
    } catch (error) {
      console.error('Error updating the record:', error);
      throw error;
    }
  },

  // Удаление записи
  async delete(code) {
    try {
      return await db.products.delete(code);
    } catch (error) {
      console.error('Error deleting an entry:', error);
      throw error;
    }
  },

  // Удаление всех записей
  async clearAll() {
    return await clearTable(db.products);
  }
};

// Методы для работы с таблицей slides
export const slidesDB = {
  // Добавление новой записи
  async add(record) {
    try {
      return await db.slides.add(record);
    } catch (error) {
      console.error('Error when adding an entry:', error);
      throw error;
    }
  },

  // Получение записи по коду
  async get(code) {
    try {
      return await db.slides.get(code);
    } catch (error) {
      console.error('Error receiving the record:', error);
      throw error;
    }
  },

  // Получение всех записей
  async getAll() {
    try {
      return await db.slides.toArray();
    } catch (error) {
      console.error('Error when receiving all records:', error);
      throw error;
    }
  },

  // Upsert-операция (создать или обновить)
  async put(record) {
    try {
      return await db.slides.put(record);
    } catch (error) {
      console.error('Error updating/adding an entry:', error);
      throw error;
    }
  },

  // Обновление записи
  async update(code, changes) {
    try {
      return await db.slides.update(code, changes);
    } catch (error) {
      console.error('Error updating the record:', error);
      throw error;
    }
  },

  // Удаление записи
  async delete(code) {
    try {
      return await db.slides.delete(code);
    } catch (error) {
      console.error('Error deleting an entry:', error);
      throw error;
    }
  },

  // Удаление всех записей
  async clearAll() {
    return await clearTable(db.slides);
  }
};

