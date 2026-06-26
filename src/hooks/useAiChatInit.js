import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { apiGetChatSessions } from '../services/chatService';
import { getSessionId } from '../utils/chatSession';
import { fetchDataWithFetch } from '../services/fetch/fetchBase';
import {
  apiGetMitupBalance,
  apiGetMitupLimits,
  apiGetMitupModels,
} from '../services/mitupService';

const SESSIONS_PAGE = 1;
const SESSIONS_LIMIT = 20;

async function apiGetCompanyMitup(companyId) {
  return fetchDataWithFetch(`/api/companies/${companyId}/mitup`, {
    method: 'GET',
    timeout: 15000,
  });
}

function isMitupConfigured(status) {
  return Boolean(status?.isEnabled && status?.hasKey);
}

/**
 * @param {{ balance?: number|null }|null|undefined} balanceData
 * @returns {string}
 */
export function formatMitupBalance(balanceData) {
  if (balanceData?.balance == null) return '—';
  return `${balanceData.balance} ₽`;
}

export function useAiChatInit() {
  const { user } = useAuth();
  const companyId = user?.company?.[0]?.id;

  const [models, setModels] = useState([]);
  const [limits, setLimits] = useState(null);
  const [balance, setBalance] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsPagination, setSessionsPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mitupConfigured, setMitupConfigured] = useState(true);

  const load = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      setError('Не удалось определить ID компании');
      setMitupConfigured(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        mitupStatusResult,
        modelsResult,
        limitsResult,
        balanceResult,
        sessionsResult,
      ] = await Promise.all([
        apiGetCompanyMitup(companyId).catch(() => null),
        apiGetMitupModels(companyId).catch((err) => ({ error: err })),
        apiGetMitupLimits(companyId).catch((err) => ({ error: err })),
        apiGetMitupBalance(companyId).catch((err) => ({ error: err })),
        apiGetChatSessions({ companyId, page: SESSIONS_PAGE, limit: SESSIONS_LIMIT }).catch(
          (err) => ({ error: err })
        ),
      ]);

      const configured = mitupStatusResult
        ? isMitupConfigured(mitupStatusResult)
        : !modelsResult?.error;

      setMitupConfigured(configured);

      if (!modelsResult?.error) {
        setModels(modelsResult?.models || []);
      } else {
        setModels([]);
      }

      if (!limitsResult?.error) {
        setLimits(limitsResult);
      } else {
        setLimits(null);
      }

      if (!balanceResult?.error) {
        setBalance(balanceResult);
      } else {
        setBalance(null);
      }

      if (!sessionsResult?.error) {
        setSessions(sessionsResult?.data || []);
        setSessionsPagination(sessionsResult?.pagination || null);
      } else {
        setSessions([]);
        setSessionsPagination(null);
      }

      const errors = [
        modelsResult?.error,
        limitsResult?.error,
        balanceResult?.error,
        sessionsResult?.error,
      ].filter(Boolean);

      if (errors.length > 0 && configured) {
        setError(errors[0]?.message || 'Ошибка загрузки данных AI-чата');
      }
    } catch (err) {
      console.error('useAiChatInit load error:', err);
      setError(err?.message || 'Ошибка загрузки AI-чата');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const prependSession = useCallback((session) => {
    if (!session) return;

    const sessionId = session.id || session._id;
    if (!sessionId) return;

    setSessions((prev) => {
      if (prev.some((item) => (item.id || item._id) === sessionId)) {
        return prev;
      }
      return [session, ...prev];
    });
  }, []);

  const updateBalance = useCallback((balanceData) => {
    if (balanceData && typeof balanceData === 'object') {
      setBalance(balanceData);
    }
  }, []);

  const updateLimitsFromResult = useCallback((resultLimits) => {
    if (!resultLimits || typeof resultLimits !== 'object') {
      return;
    }

    setLimits((prev) => ({
      ...(prev || {}),
      usage: {
        ...(prev?.usage || {}),
        ...(resultLimits.minute != null ? { minute: resultLimits.minute } : {}),
        ...(resultLimits.day != null ? { day: resultLimits.day } : {}),
      },
    }));
  }, []);

  const updateSession = useCallback((sessionId, patch) => {
    if (!sessionId || !patch) {
      return;
    }

    setSessions((prev) =>
      prev.map((session) => {
        const id = session.id || session._id;
        return id === sessionId ? { ...session, ...patch } : session;
      })
    );
  }, []);

  const removeSession = useCallback((sessionId) => {
    if (!sessionId) {
      return;
    }

    setSessions((prev) => prev.filter((session) => getSessionId(session) !== sessionId));
  }, []);

  return {
    companyId,
    models,
    limits,
    balance,
    sessions,
    sessionsPagination,
    loading,
    error,
    mitupConfigured,
    reload: load,
    prependSession,
    updateSession,
    removeSession,
    updateBalance,
    updateLimitsFromResult,
    formatBalance: formatMitupBalance,
  };
}
