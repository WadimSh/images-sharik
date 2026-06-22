import { fetchStudioDataWithFetch } from './fetch/fetchBase';

const CHATS = '/chats';
const FILES = '/files';

/**
 * @typedef {Object} ChatPagination
 * @property {number} page
 * @property {number} limit
 * @property {number} total
 * @property {number} pages
 * @property {boolean} hasNext
 * @property {boolean} hasPrev
 */

/**
 * @typedef {Object} AiChatSession
 * @property {string} id
 * @property {string} userId
 * @property {string} companyId
 * @property {string} title
 * @property {string} [defaultModel]
 * @property {number} [defaultTemperature]
 * @property {number} [defaultTopP]
 * @property {string} lastMessageAt
 * @property {boolean} isArchived
 * @property {{ source?: string }} [meta]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} AiChatMessageAttachment
 * @property {string} [fileId]
 * @property {string} [fileName]
 * @property {string} [url]
 * @property {string} [mimeType]
 */

/**
 * @typedef {Object} AiChatMessageGeneration
 * @property {'out_text'|'out_image'} [type]
 * @property {string} [model]
 * @property {number} [temperature]
 * @property {number} [topP]
 * @property {boolean} [thinking]
 * @property {boolean} [webSearch]
 * @property {string} [imageSize]
 * @property {string} [imageQuality]
 * @property {'url'|'b64_json'} [responseFormat]
 */

/**
 * @typedef {Object} AiChatMessage
 * @property {string} id
 * @property {string} sessionId
 * @property {'user'|'assistant'|'system'} role
 * @property {{ text?: string, attachments?: AiChatMessageAttachment[] }} [content]
 * @property {AiChatMessageGeneration} [generation]
 * @property {'pending'|'processing'|'completed'|'failed'|'cancelled'} [status]
 * @property {string} [providerTaskId]
 * @property {string} [editorAiLogId]
 * @property {{ text?: string, files?: Array<Record<string, unknown>>, cost?: { amount?: number, input?: number, output?: number } }} [result]
 * @property {{ code?: string, message?: string }} [error]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} StudioFileUrl
 * @property {string} fileId
 * @property {string} fileName
 * @property {string} mimeType
 * @property {number} size
 * @property {string} url
 */

const buildStudioQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });

  const qs = query.toString();
  return qs ? `?${qs}` : '';
};

const withCompanyQuery = (path, companyId, extraParams = {}) =>
  `${path}${buildStudioQuery({ companyId, ...extraParams })}`;

/**
 * @param {object} body — companyId, title?, defaultModel?, defaultTemperature?, defaultTopP?
 * @returns {Promise<AiChatSession>}
 */
export async function apiCreateChatSession(body) {
  return fetchStudioDataWithFetch(CHATS, {
    method: 'POST',
    data: body,
    timeout: 30000,
  });
}

/**
 * @param {{ companyId: string, page?: number, limit?: number }} params
 * @returns {Promise<{ data: AiChatSession[], pagination: ChatPagination }>}
 */
export async function apiGetChatSessions(params = {}) {
  const { companyId, ...rest } = params;

  return fetchStudioDataWithFetch(
    `${CHATS}${buildStudioQuery({ companyId, ...rest })}`,
    { method: 'GET', timeout: 30000 }
  );
}

/**
 * @param {string} sessionId
 * @param {string} companyId
 * @returns {Promise<AiChatSession>}
 */
export async function apiGetChatSession(sessionId, companyId) {
  return fetchStudioDataWithFetch(
    withCompanyQuery(`${CHATS}/${encodeURIComponent(sessionId)}`, companyId),
    { method: 'GET', timeout: 30000 }
  );
}

/**
 * @param {string} sessionId
 * @param {object} body — title?, defaultModel?, defaultTemperature?, defaultTopP?
 * @param {string} companyId
 * @returns {Promise<AiChatSession>}
 */
export async function apiPatchChatSession(sessionId, body, companyId) {
  return fetchStudioDataWithFetch(
    withCompanyQuery(`${CHATS}/${encodeURIComponent(sessionId)}`, companyId),
    {
      method: 'PATCH',
      data: body,
      timeout: 30000,
    }
  );
}

/**
 * @param {string} sessionId
 * @param {string} companyId
 * @returns {Promise<{ success: boolean }>}
 */
export async function apiArchiveChatSession(sessionId, companyId) {
  return fetchStudioDataWithFetch(
    withCompanyQuery(`${CHATS}/${encodeURIComponent(sessionId)}`, companyId),
    { method: 'DELETE', timeout: 30000 }
  );
}

/**
 * @param {string} sessionId
 * @param {{ companyId: string, page?: number, limit?: number }} params
 * @returns {Promise<{ data: AiChatMessage[], pagination: ChatPagination }>}
 */
export async function apiGetChatMessages(sessionId, params = {}) {
  const { companyId, ...rest } = params;

  return fetchStudioDataWithFetch(
    `${CHATS}/${encodeURIComponent(sessionId)}/messages${buildStudioQuery({ companyId, ...rest })}`,
    { method: 'GET', timeout: 30000 }
  );
}

/**
 * @param {string} sessionId
 * @param {object} body — role, content?, generation?, status?, providerTaskId?, editorAiLogId?
 * @param {string} companyId
 * @returns {Promise<AiChatMessage>}
 */
export async function apiPostChatMessage(sessionId, body, companyId) {
  return fetchStudioDataWithFetch(
    withCompanyQuery(`${CHATS}/${encodeURIComponent(sessionId)}/messages`, companyId),
    {
      method: 'POST',
      data: body,
      timeout: 30000,
    }
  );
}

/**
 * @param {string} sessionId
 * @param {string} messageId
 * @param {object} body — status?, providerTaskId?, editorAiLogId?, result?, error?, content?
 * @param {string} companyId
 * @returns {Promise<AiChatMessage>}
 */
export async function apiPatchChatMessage(sessionId, messageId, body, companyId) {
  return fetchStudioDataWithFetch(
    withCompanyQuery(
      `${CHATS}/${encodeURIComponent(sessionId)}/messages/${encodeURIComponent(messageId)}`,
      companyId
    ),
    {
      method: 'PATCH',
      data: body,
      timeout: 30000,
    }
  );
}

/**
 * @param {string} fileId
 * @param {string} companyId
 * @returns {Promise<StudioFileUrl>}
 */
export async function apiGetStudioFileUrl(fileId, companyId) {
  return fetchStudioDataWithFetch(
    withCompanyQuery(`${FILES}/${encodeURIComponent(fileId)}/url`, companyId),
    { method: 'GET', timeout: 30000 }
  );
}
