import { fetchDataWithFetch } from "./fetch/fetchBase";

export async function apiGetAllHistories(params = {}) {
  const queryParams = new URLSearchParams();
  
  // Добавляем параметры пагинации
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  
  // Добавляем параметры фильтрации
  if (params.mine !== undefined) queryParams.append('mine', params.mine);
  if (params.search) queryParams.append('articles', params.search);
  if (params.marketplace) queryParams.append('marketplace', params.marketplace);
  if (params.size) queryParams.append('size', params.size);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  
  const queryString = queryParams.toString();
  const url = queryString ? `/api/histories?${queryString}` : '/api/histories';
  
  return fetchDataWithFetch(url, {
    method: 'GET'
  });
}

export async function apiCreateHistoriy(data) {
  return fetchDataWithFetch('/api/histories', {
    method: 'POST',
    data,
    timeout: 60000,
  });
}

export async function apiDeleteHistoriy(id) {
  return fetchDataWithFetch(`/api/histories/${id}`, {
    method: 'PATCH'
  })
}

export async function apiToggleLikeHistoriy(id) {
  return fetchDataWithFetch(`/api/histories/${id}/likes`, {
    method: 'PUT'
  });
}

export async function apiBulkDeactivateHistories(ids) {
  return fetchDataWithFetch('/api/histories', {
    method: 'PATCH',
    body: JSON.stringify({ ids })
  });
}