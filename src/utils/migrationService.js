// services/migrationService.js
import { designsDB, collageDB } from '../utils/handleDB';
import { apiCreateDesign, apiCreateCollage } from '../services/templatesService';

export const migrationService = {
  /**
   * Проверяет, нужна ли миграция для пользователя
   * Используем localStorage с привязкой к email/username
   */
  async needsMigration(user) {
    try {
      if (!user) return false;
      
      // Создаем уникальный ключ для пользователя
      const userKey = this.getUserMigrationKey(user);
      
      // Проверяем флаг в localStorage
      const migrationFlag = localStorage.getItem(userKey);
      return migrationFlag !== 'migrated';
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  },

  /**
   * Получает уникальный ключ для хранения флага миграции
   */
  getUserMigrationKey(user) {
    // Используем email или username для создания ключа
    const identifier = user.email || user.username || 'anonymous';
    return `migration_${identifier}_completed`;
  },

  /**
   * Выполняет миграцию макетов из IndexedDB на бэкенд
   */
  async migrateDesigns(companyId) {
    try {
      console.log('Starting designs migration...');
      
      // Получаем все макеты из IndexedDB
      const designsFromDB = await designsDB.getAll();
      let migratedCount = 0;
      let failedCount = 0;

      // Мигрируем каждый макет
      for (const design of designsFromDB) {
        try {
          // Проверяем, не является ли макет пустым
          if (!design.code || !design.data || design.data.length === 0) {
            console.log(`Skipping empty design: ${design.code}`);
            continue;
          }

          // Подготавливаем данные для API
          const designData = {
            name: design.code,
            data: design.data,
            size: design.size || '900x1200',
            company: companyId
          };

          // Отправляем на сервер
          await apiCreateDesign(designData);
          migratedCount++;
          
          console.log(`Migrated design: ${design.code}`);
          
          // Небольшая задержка, чтобы не перегружать сервер
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (designError) {
          // Проверяем, не существует ли уже на сервере
          if (designError.response?.status === 409 || 
              designError.message?.includes('уже существует') || 
              designError.message?.includes('already exists')) {
            console.log(`Design "${design.code}" already exists on server`);
          } else {
            console.error(`Failed to migrate design ${design.code}:`, designError);
            failedCount++;
          }
        }
      }

      console.log(`Designs migration completed. Success: ${migratedCount}, Failed: ${failedCount}`);
      return { migratedCount, failedCount, total: designsFromDB.length };
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  /**
   * Выполняет миграцию коллажей из IndexedDB на бэкенд
   */
  async migrateCollages(companyId) {
    try {
      console.log('Starting collages migration...');
      
      // Получаем все коллажи из IndexedDB
      const collagesFromDB = await collageDB.getAll();
      let migratedCount = 0;
      let failedCount = 0;

      // Мигрируем каждый коллаж
      for (const collage of collagesFromDB) {
        try {
          // Проверяем, не является ли коллаж пустым
          if (!collage.code || !collage.elements || collage.elements.length === 0) {
            console.log(`Skipping empty collage: ${collage.code}`);
            continue;
          }

          // Подготавливаем данные для API
          const collageData = {
            name: collage.code,
            data: collage.elements, // Обратите внимание на поле elements
            size: collage.size || '900x1200',
            company: companyId
          };

          // Отправляем на сервер
          await apiCreateCollage(collageData);
          migratedCount++;
          
          console.log(`Migrated collage: ${collage.code}`);
          
          // Небольшая задержка, чтобы не перегружать сервер
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (collageError) {
          // Проверяем, не существует ли уже на сервере
          if (collageError.response?.status === 409 || 
              collageError.message?.includes('уже существует') || 
              collageError.message?.includes('already exists')) {
            console.log(`Collage "${collage.code}" already exists on server`);
          } else {
            console.error(`Failed to migrate collage ${collage.code}:`, collageError);
            failedCount++;
          }
        }
      }

      console.log(`Collages migration completed. Success: ${migratedCount}, Failed: ${failedCount}`);
      return { migratedCount, failedCount, total: collagesFromDB.length };
    } catch (error) {
      console.error('Collage migration error:', error);
      throw error;
    }
  },

  /**
   * Полная миграция всех данных
   */
  async migrateAllData(user, companyId) {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Starting full data migration...');
      
      const designsResult = await this.migrateDesigns(companyId);
      const collagesResult = await this.migrateCollages(companyId);

      // Устанавливаем флаг миграции в localStorage
      const userKey = this.getUserMigrationKey(user);
      localStorage.setItem(userKey, 'migrated');

      // Очищаем локальные данные после успешной миграции
      if (designsResult.migratedCount > 0 || designsResult.total > 0) {
        try {
          const designs = await designsDB.getAll();
          for (const design of designs) {
            await designsDB.delete(design.code);
          }
          console.log('Cleared local designs storage');
        } catch (clearError) {
          console.error('Error clearing designs:', clearError);
        }
      }

      if (collagesResult.migratedCount > 0 || collagesResult.total > 0) {
        try {
          const collages = await collageDB.getAll();
          for (const collage of collages) {
            await collageDB.delete(collage.code);
          }
          console.log('Cleared local collages storage');
        } catch (clearError) {
          console.error('Error clearing collages:', clearError);
        }
      }

      const totalMigrated = designsResult.migratedCount + collagesResult.migratedCount;
      const totalFailed = designsResult.failedCount + collagesResult.failedCount;

      console.log(`Full migration completed. Total migrated: ${totalMigrated}, Total failed: ${totalFailed}`);
      
      return {
        designs: designsResult,
        collages: collagesResult,
        totalMigrated,
        totalFailed
      };
    } catch (error) {
      console.error('Full migration error:', error);
      throw error;
    }
  },

  /**
   * Проверяет и выполняет миграцию при необходимости
   */
  async checkAndMigrate(user, companyId) {
    try {
      const needsMigration = await this.needsMigration(user);
      
      if (!needsMigration) {
        console.log('Migration already completed for user');
        return { needsMigration: false, result: null };
      }

      console.log('Migration needed for user');
      const result = await this.migrateAllData(user, companyId);
      
      return { needsMigration: true, result };
    } catch (error) {
      console.error('Check and migrate error:', error);
      return { needsMigration: false, error };
    }
  },

  /**
   * Принудительно сбросить флаг миграции (для тестирования)
   */
  resetMigrationFlag(user) {
    if (!user) return;
    
    const userKey = this.getUserMigrationKey(user);
    localStorage.removeItem(userKey);
    console.log('Migration flag reset for:', userKey);
  }
};