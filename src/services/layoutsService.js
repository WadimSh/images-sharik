import { fetchDataWithFetch } from "./fetch/fetchBase";

export async function apiGetAllLayouts() {
  return fetchDataWithFetch('/api/templates', {
    method: 'GET'
  });
}

export async function apiCreateLayout(data) {
  return fetchDataWithFetch('/api/templates', {
    method: 'POST',
    data
  });
}