import { fetchDataWithFetch } from "./fetch/fetchBase";
import { templatesCache } from "./cache/templatesCache";

// ---- дизайны ----

// Получение всех макетов дизайнов с кэшированием
export async function apiGetAllDesigns(forceRefresh = false) {
  // Проверяем кэш
  if (!forceRefresh && templatesCache.isCacheValid() && templatesCache.getDesignsCache()) {
    console.log('Returning designs from cache');
    return templatesCache.getDesignsCache();
  }

  // Запрашиваем с сервера
  const response = await fetchDataWithFetch('/api/designs', {
    method: 'GET'
  });

  // Сохраняем в кэш
  templatesCache.setDesignsCache(response);
  
  return response;
}

// Создание макета
export async function apiCreateDesign(data) {
  const response = await fetchDataWithFetch('/api/designs', {
    method: 'POST',
    data,
    timeout: 60000,
  });

  // Обновляем кэш
  templatesCache.updateDesignInCache(response);
  
  return response;
}

// Обновление макета
export async function apiUpdateDesign(id, data) {
  const response = await fetchDataWithFetch(`/api/designs/${id}`, {
    method: 'PUT',
    data,
    timeout: 60000,
  });

  // Обновляем кэш
  templatesCache.updateDesignInCache(response);
  
  return response;
}

// Удаление (деактивация) макета
export async function apiDeleteDesign(id) {
  await fetchDataWithFetch(`/api/designs/${id}`, {
    method: 'PATCH'
  });

  // Удаляем из кэша
  templatesCache.removeDesignFromCache(id);
  
  return true;
}

// Получение макета по имени
export async function apiGetDesignByName(name) {
  // Используем кэшированные данные
  const designs = await apiGetAllDesigns();
  return templatesCache.findDesignByName(name);
}

// Инвалидация кэша дизайнов
export function invalidateDesignsCache() {
  templatesCache.clearCache();
}

// ---- коллажи ----

// Получение всех коллажей с кэшированием
export async function apiGetAllCollages(forceRefresh = false) {
  // Проверяем кэш
  if (!forceRefresh && templatesCache.isCacheValid() && templatesCache.getCollagesCache()) {
    console.log('Returning collages from cache');
    return templatesCache.getCollagesCache();
  }

  // Запрашиваем с сервера
  const response = await fetchDataWithFetch('/api/collages', {
    method: 'GET'
  });

  // Сохраняем в кэш
  templatesCache.setCollagesCache(response);
  
  return response;
}

// Создание коллажа
export async function apiCreateCollage(data) {
  const response = await fetchDataWithFetch('/api/collages', {
    method: 'POST',
    data,
    timeout: 60000,
  });

  // Обновляем кэш
  templatesCache.updateCollageInCache(response);
  
  return response;
}

// Обновление коллажа
export async function apiUpdateCollage(id, data) {
  const response = await fetchDataWithFetch(`/api/collages/${id}`, {
    method: 'PUT',
    data,
    timeout: 60000,
  });

  // Обновляем кэш
  templatesCache.updateCollageInCache(response);
  
  return response;
}

// Удаление (деактивация) коллажа
export async function apiDeleteCollage(id) {
  await fetchDataWithFetch(`/api/collages/${id}`, {
    method: 'PATCH'
  });

  // Удаляем из кэша
  templatesCache.removeCollageFromCache(id);
  
  return true;
}

// Получение коллажа по имени
export async function apiGetCollageByName(name) {
  // Используем кэшированные данные
  const collages = await apiGetAllCollages();
  return templatesCache.findCollageByName(name);
}

// Инвалидация кэша коллажей
export function invalidateCollagesCache() {
  templatesCache.clearCache();
}