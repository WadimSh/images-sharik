import { useCallback, useEffect, useRef, useState } from 'react';

import { apiGetChatMessages } from '../services/chatService';

const MESSAGES_LIMIT = 50;

/**
 * @param {object|null|undefined} message
 * @returns {string}
 */
export function getChatMessageId(message) {
  return message?.id || message?._id || '';
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

  const pageRef = useRef(1);
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

  const loadMessages = useCallback(
    async (sessionId, { reset = true, page = 1 } = {}) => {
      if (!sessionId || !companyId) {
        if (reset) {
          setMessages([]);
          setPagination(null);
          setError(null);
        }
        return;
      }

      const setLoadingState = reset ? setLoading : setLoadingMore;

      try {
        setLoadingState(true);
        if (reset) {
          setError(null);
        }

        const response = await apiGetChatMessages(sessionId, {
          companyId,
          page,
          limit: MESSAGES_LIMIT,
        });

        const items = response?.data || [];
        pageRef.current = page;
        setPagination(response?.pagination || null);

        setMessages((prev) => (reset ? items : [...prev, ...items]));

        if (reset) {
          shouldScrollToBottomRef.current = items.length > 0;
        }
      } catch (err) {
        console.error('useChatMessages load error:', err);
        if (reset) {
          setMessages([]);
          setPagination(null);
          setError(err?.message || 'Ошибка загрузки сообщений');
        }
      } finally {
        setLoadingState(false);
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
      pageRef.current = 1;
      shouldScrollToBottomRef.current = false;

      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      return;
    }

    pageRef.current = 1;

    if (skipInitialLoadRef?.current) {
      skipInitialLoadRef.current = false;
      return;
    }

    loadMessages(activeSessionId, { reset: true, page: 1 });
  }, [activeSessionId, loadMessages, skipInitialLoadRef]);

  useEffect(() => {
    if (!shouldScrollToBottomRef.current || loading || messages.length === 0) {
      return;
    }

    shouldScrollToBottomRef.current = false;
    scrollToBottom('auto');
  }, [loading, messages, scrollToBottom]);

  const loadMore = useCallback(async () => {
    if (!activeSessionId || !pagination?.hasNext || loading || loadingMore) {
      return;
    }

    await loadMessages(activeSessionId, {
      reset: false,
      page: pageRef.current + 1,
    });
  }, [activeSessionId, pagination?.hasNext, loading, loadingMore, loadMessages]);

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

  return {
    messages,
    pagination,
    loading,
    loadingMore,
    error,
    hasMore: Boolean(pagination?.hasNext),
    isWelcomeState: !activeSessionId,
    loadMessages,
    loadMore,
    appendMessage,
    updateMessage,
    replaceMessages,
    scrollContainerRef,
    messagesEndRef,
    scrollToBottom,
  };
}
