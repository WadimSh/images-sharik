import { fetchDataWithFetch } from "./fetch/fetchBase";

export async function apiGetAllHistories() {
  return fetchDataWithFetch('/api/histories', {
    method: 'GET'
  })
}

export async function apiGetHistoryById(id) {
  return fetchDataWithFetch(`/api/histories/${id}`, {
    method: 'GET'
  })
}

export async function apiCreateHistoriy(data) {
  return fetchDataWithFetch('/api/histories', {
    method: 'POST',
    data,
  });
}

export async function apiDeleteHistoriy(id) {
  return fetchDataWithFetch(`/api/histories/${id}`, {
    method: 'PATCH'
  })
}