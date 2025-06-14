import Dexie from 'dexie';

export const db = new Dexie('SharikDatabase');

db.version(1).stores({
  designs: 'code', // Данные макетов дизайнов
  collage: 'code', // Данные макетов коллажей
  history: 'code' // Данные о созданных слайдах
});

// Методы для работы с таблицей designs
export const designsDB = {
  // Добавление нового дизайна
  async add(design) {
    try {
      return await db.designs.add(design);
    } catch (error) {
      console.error('Ошибка при добавлении шаблона дизайна:', error);
      throw error;
    }
  },

  // Получение дизайна по коду
  async get(code) {
    try {
      return await db.designs.get(code);
    } catch (error) {
      console.error('Ошибка при получении шаблона дизайна:', error);
      throw error;
    }
  },

  // Получение всех дизайнов
  async getAll() {
    try {
      return await db.designs.toArray();
    } catch (error) {
      console.error('Ошибка при получении всех шаблонов дизайнов:', error);
      throw error;
    }
  },

  // Обновление дизайна
  async update(code, changes) {
    try {
      return await db.designs.update(code, changes);
    } catch (error) {
      console.error('Ошибка при обновлении шаблона дизайна:', error);
      throw error;
    }
  },

  // Удаление дизайна
  async delete(code) {
    try {
      return await db.designs.delete(code);
    } catch (error) {
      console.error('Ошибка при удалении шаблона дизайна:', error);
      throw error;
    }
  }
};

// Методы для работы с таблицей collage
export const collageDB = {
  // Добавление нового коллажа
  async add(collage) {
    try {
      return await db.collage.add(collage);
    } catch (error) {
      console.error('Ошибка при добавлении шаблона коллажа:', error);
      throw error;
    }
  },

  // Получение коллажа по коду
  async get(code) {
    try {
      return await db.collage.get(code);
    } catch (error) {
      console.error('Ошибка при получении шаблона коллажа:', error);
      throw error;
    }
  },

  // Получение всех коллажей
  async getAll() {
    try {
      return await db.collage.toArray();
    } catch (error) {
      console.error('Ошибка при получении всех шаблонов коллажей:', error);
      throw error;
    }
  },

  // Обновление коллажа
  async update(code, changes) {
    try {
      return await db.collage.update(code, changes);
    } catch (error) {
      console.error('Ошибка при обновлении шаблона коллажа:', error);
      throw error;
    }
  },

  // Удаление коллажа
  async delete(code) {
    try {
      return await db.collage.delete(code);
    } catch (error) {
      console.error('Ошибка при удалении шаблона коллажа:', error);
      throw error;
    }
  }
};

// Методы для работы с таблицей history
export const historyDB = {
  // Добавление новой записи в историю
  async add(record) {
    try {
      return await db.history.add(record);
    } catch (error) {
      console.error('Ошибка при добавлении записи в историю:', error);
      throw error;
    }
  },

  // Получение записи по коду
  async get(code) {
    try {
      return await db.history.get(code);
    } catch (error) {
      console.error('Ошибка при получении записи из истории:', error);
      throw error;
    }
  },

  // Получение всей истории
  async getAll() {
    try {
      return await db.history.toArray();
    } catch (error) {
      console.error('Ошибка при получении всей истории:', error);
      throw error;
    }
  },

  // Обновление записи
  async update(code, changes) {
    try {
      return await db.history.update(code, changes);
    } catch (error) {
      console.error('Ошибка при обновлении записи в истории:', error);
      throw error;
    }
  },

  // Удаление записи
  async delete(code) {
    try {
      return await db.history.delete(code);
    } catch (error) {
      console.error('Ошибка при удалении записи из истории:', error);
      throw error;
    }
  }
};
