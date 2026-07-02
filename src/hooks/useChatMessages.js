import { useCallback, useEffect, useRef, useState } from 'react';

import { apiGetChatMessages } from '../services/chatService';

export const MESSAGES_LIMIT = 50;

/**
 * @param {object|null|undefined} message
 * @returns {string}
 */
export function getChatMessageId(message) {
  return message?.id || message?._id || '';
}

/**
 * @param {Array<object>} olderItems
 * @param {Array<object>} currentMessages
 * @returns {Array<object>}
 */
export function mergeOlderMessages(olderItems, currentMessages) {
  if (!Array.isArray(olderItems) || olderItems.length === 0) {
    return currentMessages;
  }

  const seen = new Set(
    currentMessages
      .map((message) => getChatMessageId(message))
      .filter(Boolean)
  );

  const uniqueOlder = olderItems.filter((message) => {
    const messageId = getChatMessageId(message);
    return !messageId || !seen.has(messageId);
  });

  return [...uniqueOlder, ...currentMessages];
}

/**
 * @param {number|null|undefined} pages
 * @returns {number}
 */
export function resolveLastMessagesPage(pages) {
  const parsed = Number(pages);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

/**
 * @param {number|null|undefined} total
 * @param {number} [limit=MESSAGES_LIMIT]
 * @returns {number}
 */
export function resolveLastMessagesPageFromTotal(total, limit = MESSAGES_LIMIT) {
  const parsedTotal = Number(total);
  if (!Number.isFinite(parsedTotal) || parsedTotal <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(parsedTotal / limit));
}

/**
 * @param {string} sessionId
 * @param {string} companyId
 * @returns {Promise<{ items: Array<object>, pagination: object|null, loadedPage: number }>}
 */
export async function fetchLatestChatMessages(sessionId, companyId) {
  const firstResponse = await apiGetChatMessages(sessionId, {
    companyId,
    page: 1,
    limit: MESSAGES_LIMIT,
  });

  const total = firstResponse?.pagination?.total ?? 0;
  const lastPage = resolveLastMessagesPageFromTotal(total, MESSAGES_LIMIT);

  if (lastPage <= 1) {
    return {
      items: firstResponse?.data || [],
      pagination: firstResponse?.pagination || null,
      loadedPage: 1,
    };
  }

  const lastResponse = await apiGetChatMessages(sessionId, {
    companyId,
    page: lastPage,
    limit: MESSAGES_LIMIT,
  });

  return {
    items: lastResponse?.data || [],
    pagination: lastResponse?.pagination || null,
    loadedPage: lastPage,
  };
}

/**
 * @param {object} params
 * @param {string|null|undefined} params.companyId
 * @param {string|null|undefined} params.activeSessionId
 * @param {import('react').MutableRefObject<boolean>} [params.skipInitialLoadRef]
 */
export function useChatMessages({ companyId, activeSessionId, skipInitialLoadRef }) {
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [oldestLoadedPage, setOldestLoadedPage] = useState(1);

  const oldestLoadedPageRef = useRef(1);
  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const shouldScrollToBottomRef = useRef(false);

  const scrollToBottom = useCallback((behavior = 'auto') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      const top = container.scrollHeight;

      if (typeof container.scrollTo === 'function') {
        container.scrollTo({ top, behavior });
        return;
      }

      container.scrollTop = top;
    });
  }, []);

  const preserveScrollPosition = useCallback((previousScrollHeight, previousScrollTop) => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    requestAnimationFrame(() => {
      container.scrollTop = previousScrollTop + (container.scrollHeight - previousScrollHeight);
    });
  }, []);

  const loadInitialMessages = useCallback(
    async (sessionId) => {
      if (!sessionId || !companyId) {
        setMessages([]);
        setPagination(null);
        setError(null);
        oldestLoadedPageRef.current = 1;
        setOldestLoadedPage(1);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { items, pagination: nextPagination, loadedPage } = await fetchLatestChatMessages(
          sessionId,
          companyId
        );

        oldestLoadedPageRef.current = loadedPage;
        setOldestLoadedPage(loadedPage);
        setPagination(nextPagination || null);
        setMessages(items);
        shouldScrollToBottomRef.current = items.length > 0;
      } catch (err) {
        console.error('useChatMessages load error:', err);
        setMessages([]);
        setPagination(null);
        setError(err?.message || 'Ошибка загрузки сообщений');
        oldestLoadedPageRef.current = 1;
        setOldestLoadedPage(1);
      } finally {
        setLoading(false);
      }
    },
    [companyId]
  );

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      setPagination(null);
      setError(null);
      setLoading(false);
      setLoadingMore(false);
      oldestLoadedPageRef.current = 1;
      setOldestLoadedPage(1);
      shouldScrollToBottomRef.current = false;

      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      return;
    }

    oldestLoadedPageRef.current = 1;
    setOldestLoadedPage(1);

    if (skipInitialLoadRef?.current) {
      skipInitialLoadRef.current = false;
      return;
    }

    loadInitialMessages(activeSessionId);
  }, [activeSessionId, loadInitialMessages, skipInitialLoadRef]);

  useEffect(() => {
    if (!shouldScrollToBottomRef.current || loading || messages.length === 0) {
      return;
    }

    shouldScrollToBottomRef.current = false;
    scrollToBottom('auto');
  }, [loading, messages, scrollToBottom]);

  const loadMore = useCallback(async () => {
    if (!activeSessionId || !companyId || loading || loadingMore) {
      return;
    }

    if (oldestLoadedPageRef.current <= 1) {
      return;
    }

    const container = scrollContainerRef.current;
    const previousScrollHeight = container?.scrollHeight ?? 0;
    const previousScrollTop = container?.scrollTop ?? 0;
    const nextPage = oldestLoadedPageRef.current - 1;

    try {
      setLoadingMore(true);

      const response = await apiGetChatMessages(activeSessionId, {
        companyId,
        page: nextPage,
        limit: MESSAGES_LIMIT,
      });

      const items = response?.data || [];
      oldestLoadedPageRef.current = nextPage;
      setOldestLoadedPage(nextPage);
      setPagination(response?.pagination || null);
      setMessages((prev) => mergeOlderMessages(items, prev));
      preserveScrollPosition(previousScrollHeight, previousScrollTop);
    } catch (err) {
      console.error('useChatMessages load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [activeSessionId, companyId, loading, loadingMore, preserveScrollPosition]);

  const appendMessage = useCallback(
    (message) => {
      if (!message) return;

      setMessages((prev) => {
        const messageId = getChatMessageId(message);
        if (messageId && prev.some((item) => getChatMessageId(item) === messageId)) {
          return prev;
        }
        return [...prev, message];
      });

      if (message.role === 'user') {
        requestAnimationFrame(() => scrollToBottom('smooth'));
      }
    },
    [scrollToBottom]
  );

  const updateMessage = useCallback((messageId, patch) => {
    if (!messageId) return;

    setMessages((prev) =>
      prev.map((message) =>
        getChatMessageId(message) === messageId ? { ...message, ...patch } : message
      )
    );
  }, []);

  const replaceMessages = useCallback((nextMessages) => {
    setMessages(Array.isArray(nextMessages) ? nextMessages : []);
  }, []);

  const hasMore = oldestLoadedPage > 1;

  return {
    messages,
    pagination,
    loading,
    loadingMore,
    error,
    hasMore,
    isWelcomeState: !activeSessionId,
    loadInitialMessages,
    loadMore,
    appendMessage,
    updateMessage,
    replaceMessages,
    scrollContainerRef,
    messagesEndRef,
    scrollToBottom,
  };
}
