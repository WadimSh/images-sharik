import { fetchDataWithFetch } from "./fetch/fetchBase";

export async function apiGetAllImages(params = {}) {
  const queryParams = new URLSearchParams();
  
  // Добавляем параметры пагинации
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);

  // Фильтрация - теги как множественные параметры
  if (params.tags && Array.isArray(params.tags)) {
    params.tags
      .filter(tag => tag && typeof tag === 'string')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .forEach(tag => {
        queryParams.append('tags', tag);
      });
  }
  
  // Добавляем параметры фильтрации
  if (params.search) queryParams.append('search', params.search);
  if (params.mimeTypes) queryParams.append('mimeTypes', params.mimeTypes);
  if (params.minSize) queryParams.append('minSize', params.minSize);
  if (params.maxSize) queryParams.append('maxSize', params.maxSize);
  if (params.companyId) queryParams.append('companyId', params.companyId);

  // Даты
  if (params.startDate) {
    const date = params.startDate instanceof Date 
      ? params.startDate.toISOString() 
      : params.startDate;
    queryParams.append('startDate', date);
  }
  
  if (params.endDate) {
    const date = params.endDate instanceof Date 
      ? params.endDate.toISOString() 
      : params.endDate;
    queryParams.append('endDate', date);
  }

  // Сортировка
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  
  const queryString = queryParams.toString();
  const url = queryString ? `/api/files?${queryString}` : '/api/files';
  
  return fetchDataWithFetch(url, {
    method: 'GET'
  });
};

export async function apiGetImage(id) {
  return fetchDataWithFetch(`/api/files/${id}`, {
    method: 'GET'
  });
};
