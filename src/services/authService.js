import { fetchDataWithFetch } from "./fetch/fetchBase";

export async function apiSignIn(data) {
  return fetchDataWithFetch('/api/login', {
    method: 'POST',
    data,
  });
}

export async function apiSignOut() {
  return fetchDataWithFetch('/api/logout', {
    method: 'POST',
  });
}
