import { useEffect, useMemo, useRef } from 'react';
import AiLogRowMenu from './AiLogRowMenu';
import {
  buildLogSessionMap,
  formatDuration,
  formatLogDate,
  getLifecycleStatusLabel,
  getLogId,
  getLogOwner,
  getLogSourceLabel,
  getOperationLabel,
  getSectionLabel,
  getStatusBadgeClass,
} from './editorAiLogsHelpers';

const AiLogsTable = ({
  logs,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  onRowClick,
  onDelete,
}) => {
  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollRef.current;

    if (!sentinel || !root || !hasMore || loading || loadingMore) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { root, rootMargin: '120px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, onLoadMore, logs.length]);

  const sessionMap = useMemo(() => buildLogSessionMap(logs), [logs]);

  const renderSkeletonRows = () => (
    [...Array(6)].map((_, index) => (
      <tr key={`skeleton-${index}`} className="ai-log-skeleton-row">
        {[...Array(10)].map((__, cellIndex) => (
          <td key={cellIndex}><div className="ai-log-skeleton-cell" /></td>
        ))}
      </tr>
    ))
  );

  return (
    <div className="table-container ai-logs-table-container">
      <div ref={scrollRef} className="table-scroll-container ai-logs-table-scroll">
        <table className="employees-table ai-logs-table">
          <thead>
            <tr>
              <th className="ai-log-session-header" title="Сессия редактора" aria-label="Сессия" />
              <th>Пользователь</th>
              <th>Операция</th>
              <th>Раздел</th>
              <th>Статус</th>
              <th>Начало</th>
              <th>Завершение</th>
              <th>Длительность</th>
              <th>Источник</th>
              <th aria-label="Действия" />
            </tr>
          </thead>
          <tbody>
            {loading && logs.length === 0 && renderSkeletonRows()}

            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={10}>
                  <div className="no-data-message">
                    <div className="no-data-icon">📋</div>
                    <p>Логи не найдены</p>
                  </div>
                </td>
              </tr>
            )}

            {logs.map((log) => {
              const owner = getLogOwner(log);
              const session = sessionMap.get(getLogId(log));
              const rowClassName = [
                'employee-row',
                'ai-log-row',
                session?.hasSession ? 'ai-log-row-session' : '',
                session?.hasSession ? `ai-log-row-session-${session.groupPosition}` : '',
              ].filter(Boolean).join(' ');

              return (
                <tr
                  key={getLogId(log)}
                  className={rowClassName}
                  style={session?.hasSession ? {
                    '--ai-log-session-border': session.borderColor,
                  } : undefined}
                  onClick={() => onRowClick(log)}
                >
                  <td className="ai-log-session-cell">
                    {session?.isGrouped && (
                      <span
                        className="ai-log-session-badge"
                        title={`Сессия редактора: ${session.sessionId}`}
                      >
                        {session.sessionOrdinal}/{session.sessionTotal}
                      </span>
                    )}
                  </td>
                  <td className="employee-info">
                    <div className="employee-name">{owner.name}</div>
                  </td>
                  <td>{getOperationLabel(log)}</td>
                  <td>{getSectionLabel(log.section)}</td>
                  <td>
                    <span className={getStatusBadgeClass(log)}>
                      {getLifecycleStatusLabel(log)}
                    </span>
                  </td>
                  <td>{formatLogDate(log.startedAt)}</td>
                  <td>{formatLogDate(log.finishedAt)}</td>
                  <td>{formatDuration(log.durationMs)}</td>
                  <td>{getLogSourceLabel(log)}</td>
                  <td className="ai-log-actions-cell">
                    <AiLogRowMenu onDelete={() => onDelete(log)} />
                  </td>
                </tr>
              );
            })}

            {loadingMore && (
              <tr className="ai-log-loading-more-row">
                <td colSpan={10}>Загрузка...</td>
              </tr>
            )}

            <tr ref={sentinelRef} className="ai-log-sentinel-row">
              <td colSpan={10} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AiLogsTable;
