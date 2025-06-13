import Dexie from 'dexie';

export const db = new Dexie('SharikDatabase');

db.version(1).stores({
  designs: 'code', // Код дизайна
  collage: 'code', // Данные коллажа
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
