import Dexie from 'dexie';
import { verifyPassword } from './hashPassword';

export const db = new Dexie('SharikDatabase');

db.version(1).stores({
  designs: 'code', // Данные макетов дизайнов
  collage: 'code', // Данные макетов коллажей
  history: 'code', // Данные о созданных слайдах
  products: 'code', // Данные о товарах
  slides: 'code', // Данные слайдов
  users: '++id, login, email, passwordHash, createdAt, lastLogin, isActive' // Добавляем данные пользователя
});

db.version(2).stores({
  designs: 'code',
  collage: 'code', 
  history: 'code',
  products: 'code',
  slides: 'code',
  users: '++id, login, email, passwordHash, createdAt, lastLogin, isActive, synced' // добавляем synced
}).upgrade(tx => {
  // Добавляем поле synced = false для всех существующих пользователей
  return tx.table('users').toCollection().modify(user => {
    user.synced = false;
  });
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

// Методы для работы с таблицей users
export const usersDB = {
  async add(user) {
    try {
      return await db.users.add(user);
    } catch (error) {
      console.error('Error when adding user:', error);
      throw error;
    }
  },

  async getByLogin(login) {
    try {
      return await db.users.where('login').equals(login).first();
    } catch (error) {
      console.error('Error getting user by login:', error);
      throw error;
    }
  },

  async getByEmail(email) {
    try {
      return await db.users.where('email').equals(email).first();
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  },

  async verifyCredentials(login, password) {
    try {
      const user = await db.users.where('login').equals(login).first();
      if (!user) return false;
      
      const isValid = await verifyPassword(password, user.passwordHash);
      return isValid ? user : false;
    } catch (error) {
      console.error('Error verifying credentials:', error);
      throw error;
    }
  },

  async getAll() {
    try {
      return await db.users.toArray();
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  },

  async update(id, changes) {
    try {
      return await db.users.update(id, changes);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      return await db.users.delete(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  async updateLastLogin(userId) {
    try {
      return await db.users.update(userId, { lastLogin: new Date() });
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  },

  async deactivateUser(userId) {
    try {
      return await db.users.update(userId, { isActive: false });
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  },

  /**
   * Получить флаг синхронизации пользователя
   */
  async getSyncFlag(userId) {
    try {
      const user = await db.users.get(userId);
      return user?.synced || false;
    } catch (error) {
      console.error('Error getting sync flag:', error);
      return false;
    }
  },

  /**
   * Установить флаг синхронизации пользователя
   */
  async setSyncFlag(userId, synced) {
    try {
      await db.users.update(userId, { synced });
    } catch (error) {
      console.error('Error setting sync flag:', error);
    }
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

// Методы для работы с таблицей collage
export const collageDB = {
  // Добавление нового коллажа
  async add(collage) {
    try {
      return await db.collage.add(collage);
    } catch (error) {
      console.error('Error when adding an entry:', error);
      throw error;
    }
  },

  // Получение коллажа по коду
  async get(code) {
    try {
      return await db.collage.get(code);
    } catch (error) {
      console.error('Error receiving the record:', error);
      throw error;
    }
  },

  // Получение всех коллажей
  async getAll() {
    try {
      return await db.collage.toArray();
    } catch (error) {
      console.error('Error when receiving all records:', error);
      throw error;
    }
  },

  // Обновление коллажа
  async update(code, changes) {
    try {
      return await db.collage.update(code, changes);
    } catch (error) {
      console.error('Error updating the record:', error);
      throw error;
    }
  },

  // Удаление коллажа
  async delete(code) {
    try {
      return await db.collage.delete(code);
    } catch (error) {
      console.error('Error deleting an entry:', error);
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
      console.error('Error when adding an entry:', error);
      throw error;
    }
  },

  // Upsert-операция (создать или обновить)
  async put(record) {
    try {
      return await db.history.put(record);
    } catch (error) {
      console.error('Error updating/adding an entry:', error);
      throw error;
    }
  },

  // Получение записи по коду
  async get(code) {
    try {
      return await db.history.get(code);
    } catch (error) {
      console.error('Error receiving the record:', error);
      throw error;
    }
  },

  // Получение всей истории
  async getAll() {
    try {
      return await db.history.toArray();
    } catch (error) {
      console.error('Error when receiving all records:', error);
      throw error;
    }
  },

  // Обновление записи
  async update(code, changes) {
    try {
      return await db.history.update(code, changes);
    } catch (error) {
      console.error('Error updating the record:', error);
      throw error;
    }
  },

  // Удаление записи
  async delete(code) {
    try {
      return await db.history.delete(code);
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

