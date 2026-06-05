import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFilter } from 'react-icons/fa';
import { HiOutlineChevronLeft } from 'react-icons/hi2';

import { DateRangePicker } from '../../ui/DateRangePicker/DateRangePicker';
import { LanguageContext } from '../../contexts/contextLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { apiDeleteEditorAiLog } from '../../services/editorAiLogService';
import AiLogDeleteModal from './AiLogDeleteModal';
import AiLogDetailModal from './AiLogDetailModal';
import AiLogsFiltersSidebar from './AiLogsFiltersSidebar';
import AiLogsTable from './AiLogsTable';
import AiUsageHeatmap from './AiUsageHeatmap';
import HeatmapFilter from './HeatmapFilter';
import {
  AI_OPERATION_OPTIONS,
  buildTableQueryParams,
  countActiveTableFilters,
  fetchAllEditorAiLogs,
  fetchEditorAiLogsPage,
  getDefaultDateRange,
  getDefaultTableFilters,
  getLogId,
  getLogOwner,
  getYearDateRange,
  toIsoDateEnd,
  toIsoDateStart,
} from './editorAiLogsHelpers';
import './EditorAiLogs.css';

export const EditorAiLogs = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const { user } = useAuth();

  const [heatmapLogs, setHeatmapLogs] = useState([]);
  const [heatmapLoading, setHeatmapLoading] = useState(true);
  const [heatmapError, setHeatmapError] = useState(null);
  const [initialDateRange, setInitialDateRange] = useState(getDefaultDateRange);
  const [selectedOperations, setSelectedOperations] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [tableLogs, setTableLogs] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableLoadingMore, setTableLoadingMore] = useState(false);
  const [tableError, setTableError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(null);
  const [tableFilters, setTableFilters] = useState(getDefaultTableFilters);
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    logId: null,
    fallbackLog: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    log: null,
  });
  const [showTableFilters, setShowTableFilters] = useState(false);

  const tablePageRef = useRef(0);
  const activeTableFiltersCount = useMemo(
    () => countActiveTableFilters(tableFilters),
    [tableFilters]
  );
  const companyId = user?.company?.[0]?.id;
  const heatmapDateRange = useMemo(() => getYearDateRange(), []);

  const loadHeatmapLogs = useCallback(async () => {
    if (!companyId) {
      return;
    }

    const { startDate, endDate } = heatmapDateRange;

    try {
      setHeatmapLoading(true);
      setHeatmapError(null);

      const data = await fetchAllEditorAiLogs({
        company: companyId,
        dateFrom: toIsoDateStart(startDate),
        dateTo: toIsoDateEnd(endDate),
      });

      setHeatmapLogs(data);
    } catch (err) {
      console.error('Ошибка загрузки логов AI для тепловой карты:', err);
      setHeatmapError(err.message || 'Ошибка загрузки логов AI');
      setHeatmapLogs([]);
    } finally {
      setHeatmapLoading(false);
    }
  }, [companyId, heatmapDateRange]);

  const fetchTablePage = useCallback(async ({ reset, page }) => {
    if (!companyId || !initialDateRange.startDate || !initialDateRange.endDate) {
      return;
    }

    const setLoadingState = reset ? setTableLoading : setTableLoadingMore;

    try {
      setLoadingState(true);
      if (reset) {
        setTableError(null);
      }

      const response = await fetchEditorAiLogsPage(
        buildTableQueryParams({
          companyId,
          dateRange: initialDateRange,
          filters: tableFilters,
          page,
        })
      );

      const items = response?.data || [];
      const totalPages = response?.pagination?.pages || 1;

      setTableLogs((prev) => (reset ? items : [...prev, ...items]));
      tablePageRef.current = page;
      setHasMore(page < totalPages);
      setTotalCount(response?.pagination?.total ?? items.length);
    } catch (err) {
      console.error('Ошибка загрузки таблицы логов AI:', err);
      if (reset) {
        setTableError(err.message || 'Ошибка загрузки логов');
        setTableLogs([]);
      }
    } finally {
      setLoadingState(false);
    }
  }, [companyId, initialDateRange, tableFilters]);

  useEffect(() => {
    if (!companyId) {
      setHeatmapError('Не удалось определить ID компании');
      setHeatmapLoading(false);
      return;
    }

    loadHeatmapLogs();
  }, [companyId, loadHeatmapLogs]);

  useEffect(() => {
    if (!companyId || !initialDateRange.startDate || !initialDateRange.endDate) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fetchTablePage({ reset: true, page: 1 });
    }, 350);

    return () => clearTimeout(timer);
  }, [companyId, initialDateRange, tableFilters, fetchTablePage]);

  const handleBack = () => {
    navigate('/');
  };

  const handleDateRangeChange = (startDate, endDate) => {
    setInitialDateRange({ startDate, endDate });
  };

  const handleLoadMore = useCallback(() => {
    if (!hasMore || tableLoading || tableLoadingMore) {
      return;
    }

    fetchTablePage({ reset: false, page: tablePageRef.current + 1 });
  }, [fetchTablePage, hasMore, tableLoading, tableLoadingMore]);

  const handleRowClick = (log) => {
    setDetailModal({
      isOpen: true,
      logId: getLogId(log),
      fallbackLog: log,
    });
  };

  const handleDeleteRequest = (log) => {
    setDeleteModal({ isOpen: true, log });
  };

  const handleDeleteConfirm = async () => {
    const log = deleteModal.log;
    if (!log) return;

    try {
      await apiDeleteEditorAiLog(getLogId(log));
      const deletedId = getLogId(log);
      setTableLogs((prev) => prev.filter((item) => getLogId(item) !== deletedId));
      setTotalCount((prev) => (prev == null ? prev : Math.max(0, prev - 1)));
      setDeleteModal({ isOpen: false, log: null });

      if (detailModal.logId === deletedId) {
        setDetailModal({ isOpen: false, logId: null, fallbackLog: null });
      }
    } catch (err) {
      console.error('Ошибка удаления лога:', err);
      alert(err.message || 'Не удалось удалить лог');
    }
  };

  const userOptions = useMemo(() => {
    const usersMap = new Map();

    heatmapLogs.forEach((log) => {
      const owner = getLogOwner(log);
      if (!usersMap.has(owner.id)) {
        usersMap.set(owner.id, owner.name);
      }
    });

    return Array.from(usersMap.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ru'));
  }, [heatmapLogs]);

  const filteredHeatmapLogs = useMemo(() => {
    return heatmapLogs.filter((log) => {
      if (selectedOperations.length > 0 && !selectedOperations.includes(log.operationId)) {
        return false;
      }

      if (selectedUsers.length > 0) {
        const ownerId = getLogOwner(log).id;
        if (!selectedUsers.includes(ownerId)) {
          return false;
        }
      }

      return true;
    });
  }, [heatmapLogs, selectedOperations, selectedUsers]);

  return (
    <div className="ai-logs-page">
      <div className="header-section ai-logs-page-header">
        <button onClick={handleBack} className="button-back" style={{ color: '#333' }}>
          <HiOutlineChevronLeft /> {t('header.back')}
        </button>
        <h2 style={{ color: '#333' }}>{t('header.aiLogs')}</h2>

        <div className="date-picker-container" style={{ marginLeft: 'auto' }}>
          <DateRangePicker
            initialStartDate={initialDateRange.startDate}
            initialEndDate={initialDateRange.endDate}
            onDateRangeChange={handleDateRangeChange}
            placeholder="Выберите период"
          />
        </div>
      </div>

      <div className="ai-logs-content">
        {heatmapError && <div className="error-message">Ошибка: {heatmapError}</div>}

        <div className="ai-logs-layout">
          <div className="ai-logs-heatmap-card">
            <div className="ai-logs-heatmap-header">
              <h3 className="ai-logs-heatmap-title">
                {`Активность AI-операций за ${heatmapDateRange.year} год`}
              </h3>

              {!heatmapLoading && (
                <div className="ai-logs-heatmap-filters">
                  <HeatmapFilter
                    label="AI-функции"
                    options={AI_OPERATION_OPTIONS}
                    selected={selectedOperations}
                    onChange={setSelectedOperations}
                  />
                  <HeatmapFilter
                    label="Пользователи"
                    options={userOptions}
                    selected={selectedUsers}
                    onChange={setSelectedUsers}
                  />
                </div>
              )}
            </div>

            {heatmapLoading ? (
              <div className="ai-logs-skeleton-card" />
            ) : (
              <AiUsageHeatmap
                logs={filteredHeatmapLogs}
                startDate={heatmapDateRange.startDate}
                endDate={heatmapDateRange.endDate}
              />
            )}
          </div>
        </div>

        <div className="ai-logs-table-section">
          <div className="ai-logs-table-section-header">
            <div className="ai-logs-table-section-title">
              <h3>Журнал операций</h3>
              <span className="ai-logs-table-section-hint">
                Период — календарь в шапке. У каждой сессии свой цвет полоски; бейдж 1/2 — несколько операций в сессии
              </span>
            </div>

            <div className="ai-logs-table-toolbar">
              {totalCount != null && (
                <span className="ai-logs-table-total-inline">
                  Найдено: <strong>{totalCount}</strong>
                </span>
              )}
              <button
                type="button"
                className="ai-logs-filter-trigger"
                onClick={() => setShowTableFilters(true)}
              >
                <FaFilter />
                <span>Фильтры</span>
                {activeTableFiltersCount > 0 && (
                  <span className="ai-logs-filter-badge">{activeTableFiltersCount}</span>
                )}
              </button>
            </div>
          </div>

          {tableError && <div className="error-message">Ошибка: {tableError}</div>}

          <AiLogsTable
            logs={tableLogs}
            loading={tableLoading}
            loadingMore={tableLoadingMore}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onRowClick={handleRowClick}
            onDelete={handleDeleteRequest}
          />
        </div>
      </div>

      <AiLogDetailModal
        isOpen={detailModal.isOpen}
        logId={detailModal.logId}
        fallbackLog={detailModal.fallbackLog}
        onClose={() => setDetailModal({ isOpen: false, logId: null, fallbackLog: null })}
      />

      <AiLogDeleteModal
        isOpen={deleteModal.isOpen}
        operationLabel={deleteModal.log?.operationLabel}
        onClose={() => setDeleteModal({ isOpen: false, log: null })}
        onConfirm={handleDeleteConfirm}
      />

      <AiLogsFiltersSidebar
        isOpen={showTableFilters}
        onClose={() => setShowTableFilters(false)}
        filters={tableFilters}
        onApply={setTableFilters}
        onReset={setTableFilters}
        totalCount={totalCount}
      />
    </div>
  );
};
