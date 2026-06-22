import { fetchDataWithFetch } from './fetch/fetchBase';

const BASE = '/api/editor-ai-logs';

/** Этап 1: перед вызовом AI */
export async function apiStartEditorAiLog(data) {
  return fetchDataWithFetch(BASE, {
    method: 'POST',
    data,
    timeout: 15000,
  });
}

/** Этап 2: после получения taskId (Mitup async) — `{ providerTaskId }` */
export async function apiProcessingEditorAiLog(logId, data) {
  return fetchDataWithFetch(`${BASE}/${logId}/processing`, {
    method: 'PATCH',
    data,
    timeout: 15000,
  });
}

/** Этап 3: после ответа AI (success или error) */
export async function apiCompleteEditorAiLog(logId, data) {
  return fetchDataWithFetch(`${BASE}/${logId}/complete`, {
    method: 'PATCH',
    data,
    timeout: 15000,
  });
}

/** Admin UI: список */
export async function apiGetEditorAiLogs(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const qs = query.toString();
  return fetchDataWithFetch(qs ? `${BASE}?${qs}` : BASE, { method: 'GET' });
}

/** Admin UI: один лог */
export async function apiGetEditorAiLog(id, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const qs = query.toString();
  return fetchDataWithFetch(qs ? `${BASE}/${id}?${qs}` : `${BASE}/${id}`, { method: 'GET' });
}

/** Admin: удалить один */
export async function apiDeleteEditorAiLog(id) {
  return fetchDataWithFetch(`${BASE}/${id}`, { method: 'DELETE' });
}

/** SuperAdmin: массовое удаление */
export async function apiBulkDeleteEditorAiLogs(ids) {
  return fetchDataWithFetch(BASE, {
    method: 'DELETE',
    data: { ids },
  });
}
