import {
  fetchLatestChatMessages,
  getChatMessageId,
  mergeOlderMessages,
  MESSAGES_LIMIT,
  resolveLastMessagesPage,
  resolveLastMessagesPageFromTotal,
} from './useChatMessages';
import { apiGetChatMessages } from '../services/chatService';

jest.mock('../services/chatService', () => ({
  apiGetChatMessages: jest.fn(),
}));

describe('useChatMessages helpers', () => {
  test('resolveLastMessagesPage falls back to 1', () => {
    expect(resolveLastMessagesPage(undefined)).toBe(1);
    expect(resolveLastMessagesPage(0)).toBe(1);
    expect(resolveLastMessagesPage(3.8)).toBe(3);
  });

  test('resolveLastMessagesPageFromTotal uses message page size, not meta limit', () => {
    expect(resolveLastMessagesPageFromTotal(120, MESSAGES_LIMIT)).toBe(3);
    expect(resolveLastMessagesPageFromTotal(50, MESSAGES_LIMIT)).toBe(1);
    expect(resolveLastMessagesPageFromTotal(51, MESSAGES_LIMIT)).toBe(2);
  });

  test('mergeOlderMessages prepends unique older items', () => {
    const merged = mergeOlderMessages(
      [{ id: 'msg-1' }, { id: 'msg-2' }],
      [{ id: 'msg-2' }, { id: 'msg-3' }]
    );

    expect(merged.map(getChatMessageId)).toEqual(['msg-1', 'msg-2', 'msg-3']);
  });
});

describe('fetchLatestChatMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads last page when chat has multiple pages', async () => {
    apiGetChatMessages
      .mockResolvedValueOnce({
        data: [{ id: 'msg-1' }],
        pagination: { page: 1, limit: 50, total: 120, pages: 3, hasNext: true, hasPrev: false },
      })
      .mockResolvedValueOnce({
        data: [{ id: 'msg-101' }, { id: 'msg-120' }],
        pagination: { page: 3, limit: 50, total: 120, pages: 3, hasNext: false, hasPrev: true },
      });

    const result = await fetchLatestChatMessages('session-1', 'company-1');

    expect(apiGetChatMessages).toHaveBeenNthCalledWith(1, 'session-1', {
      companyId: 'company-1',
      page: 1,
      limit: MESSAGES_LIMIT,
    });
    expect(apiGetChatMessages).toHaveBeenNthCalledWith(2, 'session-1', {
      companyId: 'company-1',
      page: 3,
      limit: MESSAGES_LIMIT,
    });
    expect(result.loadedPage).toBe(3);
    expect(result.items).toEqual([{ id: 'msg-101' }, { id: 'msg-120' }]);
  });

  test('reuses first response when chat fits into one page', async () => {
    apiGetChatMessages.mockResolvedValueOnce({
      data: [{ id: 'msg-1' }, { id: 'msg-12' }],
      pagination: { page: 1, limit: 50, total: 12, pages: 1, hasNext: false, hasPrev: false },
    });

    const result = await fetchLatestChatMessages('session-1', 'company-1');

    expect(apiGetChatMessages).toHaveBeenCalledTimes(1);
    expect(result.loadedPage).toBe(1);
    expect(result.items).toHaveLength(2);
  });

  test('does not treat inflated pages from limit=1 meta as last page', async () => {
    apiGetChatMessages
      .mockResolvedValueOnce({
        data: [{ id: 'msg-1' }],
        pagination: { page: 1, limit: 50, total: 120, pages: 3, hasNext: true, hasPrev: false },
      })
      .mockResolvedValueOnce({
        data: [{ id: 'msg-101' }],
        pagination: { page: 3, limit: 50, total: 120, pages: 3, hasNext: false, hasPrev: true },
      });

    const inflatedMetaPages = resolveLastMessagesPage(120);
    const actualLastPage = resolveLastMessagesPageFromTotal(120, MESSAGES_LIMIT);

    expect(inflatedMetaPages).toBe(120);
    expect(actualLastPage).toBe(3);

    const result = await fetchLatestChatMessages('session-1', 'company-1');
    expect(result.loadedPage).toBe(3);
  });
});
