import { fetchDataWithFetch } from "./fetch/fetchBase";

// Получение макетов дизайнов и коллажей
export async function apiGetAllDesigns() {
  return fetchDataWithFetch('/api/designs', {
    method: 'GET'
  });
}

export async function apiGetAllCollages() {
  return fetchDataWithFetch('/api/collages', {
    method: 'GET'
  });
}

// Создание макетов дизайнов и коллажей
export async function apiCreateDesign(data) {
  return fetchDataWithFetch('/api/designs', {
    method: 'POST',
    data,
    timeout: 60000,
  });
}

export async function apiCreateCollage(data) {
  return fetchDataWithFetch('/api/collages', {
    method: 'POST',
    data,
    timeout: 60000,
  });
}

// Обновление макетов дизайнов и коллажей
export async function apiUpdateDesign(id, data) {
  return fetchDataWithFetch(`/api/designs/${id}`, {
    method: 'PUT',
    data,
    timeout: 60000,
  });
}

export async function apiUpdateCollage(id, data) {
  return fetchDataWithFetch(`/api/collages/${id}`, {
    method: 'PUT',
    data,
    timeout: 60000,
  });
}

// Удаление (деактивация) макетов дизайнов и коллажей
export async function apiDeleteDesign(id) {
  return fetchDataWithFetch(`/api/designs/${id}`, {
    method: 'PATCH'
  });
}

export async function apiDeleteCollage(id) {
  return fetchDataWithFetch(`/api/collages/${id}`, {
    method: 'PATCH'
  })
}