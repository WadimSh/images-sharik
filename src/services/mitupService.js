import {
  buildStudioUrl,
  fetchStudioDataWithFetch,
  tokenUtils,
  refreshToken,
} from './fetch/fetchBase';

const PROVIDERS = '/providers';

/** @typedef {'submitted'|'processing'|'completed'|'error'|'timeout'} MitupStreamEventType */

/**
 * Ошибка SSE-события Mitup (event: error | timeout).
 * Используйте для fallback на apiMitupStatus.
 */
export class MitupStreamError extends Error {
  constructor(payload = {}) {
    super(payload.message || payload.code || 'Mitup stream error');
    this.name = 'MitupStreamError';
    this.code = payload.code || 'MITUP_STREAM_ERROR';
    this.payload = payload;
  }
}

/**
 * Поток SSE завершился без event: completed.
 * Используйте для fallback на apiMitupStatus.
 */
export class MitupStreamDisconnectedError extends Error {
  constructor(message = 'Mitup stream ended without completed event') {
    super(message);
    this.name = 'MitupStreamDisconnectedError';
    this.code = 'MITUP_STREAM_DISCONNECTED';
  }
}

const appendCompanyQuery = (path, companyId) => {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}companyId=${encodeURIComponent(companyId)}`;
};

/**
 * @param {string} companyId
 * @returns {Promise<{ models: Array<object|string> }>}
 */
export async function apiGetMitupModels(companyId) {
  return fetchStudioDataWithFetch(
    appendCompanyQuery(`${PROVIDERS}/models`, companyId),
    { method: 'GET', timeout: 30000 }
  );
}

/**
 * @param {string} companyId
 * @returns {Promise<{ limits: object, usage: { minute: number, day: number }, max: { minute: number, day: number } }>}
 */
export async function apiGetMitupLimits(companyId) {
  return fetchStudioDataWithFetch(
    appendCompanyQuery(`${PROVIDERS}/limits`, companyId),
    { method: 'GET', timeout: 30000 }
  );
}

/**
 * @param {string} companyId
 * @returns {Promise<{ balance: number|null, balanceBonus: number|null, balanceReferral: number|null, updatedAt: string|null, source: string }>}
 */
export async function apiGetMitupBalance(companyId) {
  return fetchStudioDataWithFetch(
    appendCompanyQuery(`${PROVIDERS}/balance`, companyId),
    { method: 'GET', timeout: 30000 }
  );
}

/**
 * @param {object} body — тело POST /providers/generate
 * @returns {Promise<{ taskId: string, message?: string }>}
 */
export async function apiMitupGenerate(body) {
  return fetchStudioDataWithFetch(`${PROVIDERS}/generate`, {
    method: 'POST',
    data: body,
    timeout: 60000,
  });
}

/**
 * @param {string} taskId
 * @param {string} companyId
 * @returns {Promise<object>}
 */
export async function apiMitupStatus(taskId, companyId) {
  return fetchStudioDataWithFetch(
    appendCompanyQuery(`${PROVIDERS}/status/${encodeURIComponent(taskId)}`, companyId),
    { method: 'GET', timeout: 30000 }
  );
}

/**
 * @param {string} chunk — блок SSE между \n\n
 * @returns {{ event: string, data: object } | null}
 */
export function parseMitupSseChunk(chunk) {
  if (!chunk?.trim()) return null;

  const lines = chunk.split('\n');
  const eventLine = lines.find((line) => line.startsWith('event: '));
  const dataLine = lines.find((line) => line.startsWith('data: '));

  if (!eventLine || !dataLine) return null;

  const event = eventLine.slice(7).trim();
  const rawData = dataLine.slice(6).trim();

  try {
    return { event, data: JSON.parse(rawData) };
  } catch {
    return null;
  }
}

/**
 * @param {object} parsed
 * @param {(info: { event: MitupStreamEventType, data: object }) => void} [onEvent]
 * @returns {object|null} — result при completed, иначе null или throw
 */
function handleMitupStreamEvent(parsed, onEvent) {
  const { event, data } = parsed;
  onEvent?.({ event, data });

  if (event === 'completed') {
    return data;
  }

  if (event === 'error' || event === 'timeout') {
    throw new MitupStreamError(data);
  }

  return null;
}

async function fetchMitupStreamResponse(taskId, companyId, accessToken, signal) {
  const url = buildStudioUrl(
    appendCompanyQuery(`${PROVIDERS}/stream/${encodeURIComponent(taskId)}`, companyId)
  );

  let response = await fetch(url, {
    method: 'GET',
    signal,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'text/event-stream',
    },
  });

  if (response.status === 401) {
    const newToken = await refreshToken();
    response = await fetch(url, {
      method: 'GET',
      signal,
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${newToken}`,
        Accept: 'text/event-stream',
      },
    });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
    error.httpStatus = response.status;
    error.code = errorData.code;
    error.data = errorData;
    throw error;
  }

  return response;
}

/**
 * SSE-ожидание результата Mitup.
 * @param {string} taskId
 * @param {string} companyId
 * @param {AbortSignal} [signal]
 * @param {(info: { event: MitupStreamEventType, data: object }) => void} [onEvent]
 * @returns {Promise<object>} — payload event: completed
 */
export async function streamMitupResult(taskId, companyId, signal, onEvent) {
  const accessToken = tokenUtils.getAccessToken();
  const response = await fetchMitupStreamResponse(taskId, companyId, accessToken, signal);

  if (!response.body) {
    throw new MitupStreamDisconnectedError('Mitup stream response has no body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() || '';

      for (const chunk of chunks) {
        const parsed = parseMitupSseChunk(chunk);
        if (!parsed) continue;

        const result = handleMitupStreamEvent(parsed, onEvent);
        if (result) return result;
      }
    }
  } catch (error) {
    if (error instanceof MitupStreamError || error instanceof MitupStreamDisconnectedError) {
      throw error;
    }
    if (error?.name === 'AbortError') {
      throw error;
    }
    throw new MitupStreamDisconnectedError(
      error instanceof Error ? error.message : 'Mitup stream read failed'
    );
  }

  throw new MitupStreamDisconnectedError();
}
