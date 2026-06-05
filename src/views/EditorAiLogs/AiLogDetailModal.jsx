import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import { apiGetEditorAiLog } from '../../services/editorAiLogService';
import {
  formatDuration,
  formatLogDate,
  getCompanyId,
  getCompanyName,
  getLifecycleStatusLabel,
  getLogId,
  getLogOwner,
  getLogSourceLabel,
  formatUserAgent,
  getOperationLabel,
  getSectionLabel,
  getStatusBadgeClass,
} from './editorAiLogsHelpers';

const DetailRow = ({ label, value }) => (
  <div className="ai-log-detail-row">
    <span className="ai-log-detail-row-label">{label}</span>
    <span className="ai-log-detail-row-value">{value ?? '—'}</span>
  </div>
);

const DetailSection = ({ title, children }) => (
  <section className="ai-log-detail-section">
    <h4>{title}</h4>
    <div className="ai-log-detail-rows">{children}</div>
  </section>
);

const JsonBlock = ({ data }) => (
  <pre className="ai-log-detail-json">
    {JSON.stringify(data, null, 2)}
  </pre>
);

const AiLogDetailModal = ({ isOpen, logId, fallbackLog, onClose }) => {
  const [log, setLog] = useState(fallbackLog || null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    setLog(fallbackLog || null);

    if (!logId || !fallbackLog) {
      return undefined;
    }

    let isCancelled = false;
    const companyId = getCompanyId(fallbackLog);

    const refreshLog = async () => {
      try {
        setIsRefreshing(true);
        const data = await apiGetEditorAiLog(logId, companyId ? { company: companyId } : {});
        if (!isCancelled) {
          setLog(data?.data || data);
        }
      } catch (err) {
        console.warn('[EditorAiLog] detail refresh failed, using list item:', err);
      } finally {
        if (!isCancelled) {
          setIsRefreshing(false);
        }
      }
    };

    refreshLog();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, logId, fallbackLog]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const owner = log ? getLogOwner(log) : null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content ai-log-detail-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ai-log-detail-header">
          <div>
            <h2>Детали AI-операции</h2>
            {log && (
              <p className="ai-log-detail-subtitle">{getOperationLabel(log)}</p>
            )}
          </div>
          <button type="button" className="ai-log-detail-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="ai-log-detail-body">
          {isRefreshing && (
            <div className="ai-log-detail-loading">Обновление данных...</div>
          )}

          {log && (
            <>
              <DetailSection title="Основное">
                <DetailRow label="ID" value={getLogId(log)} />
                <DetailRow label="Операция" value={getOperationLabel(log)} />
                <DetailRow label="Раздел" value={getSectionLabel(log.section)} />
                <DetailRow label="Провайдер" value={log.provider} />
                <DetailRow label="API endpoint" value={log.apiEndpoint} />
                <DetailRow
                  label="Статус"
                  value={(
                    <span className={getStatusBadgeClass(log)}>
                      {getLifecycleStatusLabel(log)}
                    </span>
                  )}
                />
                <DetailRow label="Начало" value={formatLogDate(log.startedAt)} />
                <DetailRow label="Завершение" value={formatLogDate(log.finishedAt)} />
                <DetailRow label="Длительность" value={formatDuration(log.durationMs)} />
              </DetailSection>

              <DetailSection title="Пользователь">
                <DetailRow label="Пользователь" value={owner?.name} />
                <DetailRow label="ID пользователя" value={owner?.id} />
              </DetailSection>

              <DetailSection title="Контекст">
                <DetailRow label="Компания" value={getCompanyName(log)} />
                <DetailRow label="Company ID" value={getCompanyId(log)} />
                <DetailRow label="Источник" value={getLogSourceLabel(log)} />
                <DetailRow label="Браузер" value={formatUserAgent(log.meta?.userAgent)} />
                <DetailRow label="Session ID" value={log.meta?.sessionId} />
                <DetailRow label="Client Request ID" value={log.meta?.clientRequestId} />
              </DetailSection>

              {log.requestData && (
                <section className="ai-log-detail-section">
                  <h4>Данные запроса</h4>
                  <JsonBlock data={log.requestData} />
                </section>
              )}

              {log.requestConfig && Object.keys(log.requestConfig).length > 0 && (
                <section className="ai-log-detail-section">
                  <h4>Конфигурация запроса</h4>
                  <JsonBlock data={log.requestConfig} />
                </section>
              )}

              {log.responseData && (
                <section className="ai-log-detail-section">
                  <h4>Данные ответа</h4>
                  <JsonBlock data={log.responseData} />
                </section>
              )}

              {log.meta && (
                <section className="ai-log-detail-section">
                  <h4>Метаданные</h4>
                  <JsonBlock data={log.meta} />
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AiLogDetailModal;
