let designsCache = null;
let collagesCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

export const templatesCache = {
  // Очистка кэша
  clearCache() {
    designsCache = null;
    collagesCache = null;
    lastFetchTime = null;
  },

  // Проверка актуальности кэша
  isCacheValid() {
    if (!lastFetchTime) return false;
    return Date.now() - lastFetchTime < CACHE_DURATION;
  },

  // Получение кэшированных дизайнов
  getDesignsCache() {
    return designsCache;
  },

  // Получение кэшированных коллажей
  getCollagesCache() {
    return collagesCache;
  },

  // Установка кэша дизайнов
  setDesignsCache(designs) {
    designsCache = designs;
    lastFetchTime = Date.now();
  },

  // Установка кэша коллажей
  setCollagesCache(collages) {
    collagesCache = collages;
    lastFetchTime = Date.now();
  },

  // Поиск дизайна по имени в кэше
  findDesignByName(name) {
    if (!designsCache) return null;
    return designsCache.find(d => d.name === name) || null;
  },

  // Поиск коллажа по имени в кэше
  findCollageByName(name) {
    if (!collagesCache) return null;
    return collagesCache.find(c => c.name === name) || null;
  },

  // Обновление одного дизайна в кэше
  updateDesignInCache(design) {
    if (!designsCache) return;
    
    const index = designsCache.findIndex(d => d.id === design.id);
    if (index >= 0) {
      designsCache[index] = design;
    } else {
      designsCache.push(design);
    }
  },

  // Обновление одного коллажа в кэше
  updateCollageInCache(collage) {
    if (!collagesCache) return;
    
    const index = collagesCache.findIndex(c => c.id === collage.id);
    if (index >= 0) {
      collagesCache[index] = collage;
    } else {
      collagesCache.push(collage);
    }
  },

  // Удаление дизайна из кэша
  removeDesignFromCache(id) {
    if (!designsCache) return;
    designsCache = designsCache.filter(d => d.id !== id);
  },

  // Удаление коллажа из кэша
  removeCollageFromCache(id) {
    if (!collagesCache) return;
    collagesCache = collagesCache.filter(c => c.id !== id);
  }
};