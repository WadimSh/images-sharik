import { IMPROVEMENTS, PRODUCT_SHOWCASE } from '../../components/ImageEditor/improvementsConfig';
import { apiGetEditorAiLogs } from '../../services/editorAiLogService';

export const AI_OPERATION_OPTIONS = [
  { id: 'background', label: 'Удаление фона' },
  ...IMPROVEMENTS.map(({ id, label }) => ({ id, label })),
  ...PRODUCT_SHOWCASE.map(({ id, label }) => ({ id, label })),
];

export const EDITOR_AI_LOGS_PAGE_LIMIT = 100;
export const TABLE_PAGE_LIMIT = 50;

export const SECTION_FILTER_OPTIONS = [
  { id: 'tools', label: 'Инструменты' },
  { id: 'improvements', label: 'Улучшения' },
  { id: 'product_showcase', label: 'Показать товар' },
];

export const LIFECYCLE_STATUS_OPTIONS = [
  { id: 'pending', label: 'В ожидании' },
  { id: 'processing', label: 'Обработка' },
  { id: 'success', label: 'Успех' },
  { id: 'error', label: 'Ошибка' },
];

export const STATUS_FILTER_OPTIONS = [
  { id: 'success', label: 'Успешно' },
  { id: 'error', label: 'С ошибкой' },
];

export const PROVIDER_FILTER_OPTIONS = [
  { id: 'photoroom', label: 'Photoroom' },
];

export const SOURCE_FILTER_OPTIONS = [
  { id: 'library', label: 'Библиотека' },
  { id: 'product_detail', label: 'Карточка товара' },
  { id: 'generator', label: 'Генератор' },
  { id: 'page_chat', label: 'Чат страницы' },
];

export const SORT_SELECT_OPTIONS = {
  startedAt_desc: 'Дата (новые)',
  startedAt_asc: 'Дата (старые)',
  createdAt_desc: 'Создано (новые)',
  createdAt_asc: 'Создано (старые)',
  durationMs_desc: 'Длительность (больше)',
  durationMs_asc: 'Длительность (меньше)',
  operationId_asc: 'Операция (А-Я)',
  operationId_desc: 'Операция (Я-А)',
  lifecycleStatus_asc: 'Статус (А-Я)',
  lifecycleStatus_desc: 'Статус (Я-А)',
};

const SECTION_LABELS = Object.fromEntries(
  SECTION_FILTER_OPTIONS.map(({ id, label }) => [id, label])
);

const LIFECYCLE_LABELS = Object.fromEntries(
  LIFECYCLE_STATUS_OPTIONS.map(({ id, label }) => [id, label])
);

const SOURCE_LABELS = Object.fromEntries(
  SOURCE_FILTER_OPTIONS.map(({ id, label }) => [id, label])
);

export function getDefaultTableFilters() {
  return {
    operationIds: [],
    ownerSearch: '',
    section: '',
    lifecycleStatus: '',
    status: '',
    provider: '',
    source: '',
    sortKey: 'startedAt_desc',
  };
}

export function countActiveTableFilters(filters) {
  let count = 0;

  if (filters.operationIds?.length) count += 1;
  if (filters.ownerSearch?.trim()) count += 1;
  if (filters.section) count += 1;
  if (filters.lifecycleStatus) count += 1;
  if (filters.status) count += 1;
  if (filters.provider) count += 1;
  if (filters.source) count += 1;
  if (filters.sortKey && filters.sortKey !== 'startedAt_desc') count += 1;

  return count;
}

export function parseSortKey(sortKey) {
  const [sortBy, sortOrder] = sortKey.split('_');
  return { sortBy, sortOrder };
}

export function buildTableQueryParams({ companyId, dateRange, filters, page }) {
  const { sortBy, sortOrder } = parseSortKey(filters.sortKey);
  const params = {
    company: companyId,
    page,
    limit: TABLE_PAGE_LIMIT,
    sortBy,
    sortOrder,
  };

  if (dateRange?.startDate && dateRange?.endDate) {
    params.dateFrom = toIsoDateStart(dateRange.startDate);
    params.dateTo = toIsoDateEnd(dateRange.endDate);
  }

  if (filters.operationIds?.length) {
    params.operationIds = filters.operationIds.join('+');
  }
  if (filters.ownerSearch?.trim()) {
    params.ownerSearch = filters.ownerSearch.trim();
  }
  if (filters.section) params.section = filters.section;
  if (filters.lifecycleStatus) params.lifecycleStatus = filters.lifecycleStatus;
  if (filters.status) params.status = filters.status;
  if (filters.provider) params.provider = filters.provider;
  if (filters.source) params.source = filters.source;

  return params;
}

export async function fetchEditorAiLogsPage(params) {
  return apiGetEditorAiLogs(params);
}

export function getLogId(log) {
  return log?.id || log?._id;
}

export function getLogSessionId(log) {
  const sessionId = log?.meta?.sessionId;
  return sessionId ? String(sessionId) : null;
}

const SESSION_BORDER_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#0d9488',
  '#d97706',
  '#db2777',
  '#4f46e5',
  '#059669',
  '#dc2626',
  '#0891b2',
  '#7c3aed',
];

function buildSessionColorMap(sessionEntries) {
  const sessions = [...sessionEntries.entries()].map(([sessionId, sessionLogs]) => {
    const earliestLog = [...sessionLogs].sort(compareLogsByStartedAt)[0];
    return {
      sessionId,
      earliestStartedAt: new Date(earliestLog.startedAt || 0).getTime(),
    };
  });

  sessions.sort((a, b) => {
    if (a.earliestStartedAt !== b.earliestStartedAt) {
      return a.earliestStartedAt - b.earliestStartedAt;
    }
    return a.sessionId.localeCompare(b.sessionId);
  });

  const colorMap = new Map();
  sessions.forEach((session, index) => {
    colorMap.set(
      session.sessionId,
      SESSION_BORDER_COLORS[index % SESSION_BORDER_COLORS.length]
    );
  });

  return colorMap;
}

function getSessionGroupPosition(logs, index, sessionId) {
  const prevSessionId = index > 0 ? getLogSessionId(logs[index - 1]) : null;
  const nextSessionId = index < logs.length - 1 ? getLogSessionId(logs[index + 1]) : null;
  const connectedPrev = prevSessionId === sessionId;
  const connectedNext = nextSessionId === sessionId;

  if (!connectedPrev && !connectedNext) return 'single';
  if (!connectedPrev && connectedNext) return 'start';
  if (connectedPrev && connectedNext) return 'middle';
  return 'end';
}

function compareLogsByStartedAt(a, b) {
  const aTime = new Date(a.startedAt || 0).getTime();
  const bTime = new Date(b.startedAt || 0).getTime();
  if (aTime !== bTime) return aTime - bTime;
  return String(getLogId(a)).localeCompare(String(getLogId(b)));
}

function buildSessionOrdinalsByStartedAt(logs) {
  const sessionEntries = new Map();

  logs.forEach((log) => {
    const sessionId = getLogSessionId(log);
    if (!sessionId) return;

    if (!sessionEntries.has(sessionId)) {
      sessionEntries.set(sessionId, []);
    }

    sessionEntries.get(sessionId).push(log);
  });

  const sessionColorMap = buildSessionColorMap(sessionEntries);
  const ordinalByLogId = new Map();

  sessionEntries.forEach((sessionLogs, sessionId) => {
    const sortedLogs = [...sessionLogs].sort(compareLogsByStartedAt);
    const sessionTotal = sortedLogs.length;
    const borderColor = sessionColorMap.get(sessionId);

    sortedLogs.forEach((log, index) => {
      ordinalByLogId.set(getLogId(log), {
        sessionTotal,
        sessionOrdinal: index + 1,
        borderColor,
      });
    });
  });

  return ordinalByLogId;
}

export function buildLogSessionMap(logs) {
  const ordinalByLogId = buildSessionOrdinalsByStartedAt(logs);
  const map = new Map();

  logs.forEach((log, index) => {
    const logId = getLogId(log);
    const sessionId = getLogSessionId(log);

    if (!sessionId) {
      map.set(logId, { isGrouped: false });
      return;
    }

    const ordinalInfo = ordinalByLogId.get(logId);
    if (!ordinalInfo) {
      map.set(logId, { isGrouped: false });
      return;
    }

    const { sessionTotal, sessionOrdinal, borderColor } = ordinalInfo;
    const isGrouped = sessionTotal > 1;

    map.set(logId, {
      hasSession: true,
      isGrouped,
      sessionId,
      sessionTotal,
      sessionOrdinal,
      groupPosition: isGrouped
        ? getSessionGroupPosition(logs, index, sessionId)
        : 'single',
      borderColor,
    });
  });

  return map;
}

export function formatLogDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(durationMs) {
  if (durationMs == null) return '—';
  if (durationMs < 1000) return `${durationMs} мс`;

  const seconds = (durationMs / 1000).toFixed(1);
  return `${seconds} с`;
}

export function getLogSource(log) {
  return log?.meta?.source || log?.source || '—';
}

export function getLogSourceLabel(log) {
  const source = getLogSource(log);
  return SOURCE_LABELS[source] || source;
}

function detectBrowser(userAgent) {
  if (/YaBrowser/i.test(userAgent)) return 'Яндекс Браузер';
  if (/Edg\//i.test(userAgent)) return 'Microsoft Edge';
  if (/OPR\//i.test(userAgent) || /Opera/i.test(userAgent)) return 'Opera';
  if (/Firefox\//i.test(userAgent)) return 'Firefox';
  if (/Chrome\//i.test(userAgent)) return 'Chrome';
  if (/Safari\//i.test(userAgent)) return 'Safari';
  return null;
}

function detectOs(userAgent) {
  if (/Windows NT/i.test(userAgent)) return 'Windows';
  if (/Mac OS X/i.test(userAgent)) return 'macOS';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone|iPad/i.test(userAgent)) return 'iOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return null;
}

export function formatUserAgent(userAgent) {
  if (!userAgent) return '—';

  const browser = detectBrowser(userAgent);
  const os = detectOs(userAgent);

  if (browser && os) return `${browser} на ${os}`;
  if (browser) return browser;
  if (os) return os;
  return userAgent;
}

export function getSectionLabel(section) {
  return SECTION_LABELS[section] || section || '—';
}

export function getLifecycleStatus(log) {
  return log?.lifecycleStatus || '—';
}

export function getLifecycleStatusLabel(log) {
  const status = getLifecycleStatus(log);
  return LIFECYCLE_LABELS[status] || status;
}

export function getResponseStatus(log) {
  return log?.responseData?.status || log?.status || null;
}

export function getResponseStatusLabel(log) {
  const status = getResponseStatus(log);
  if (!status) return '—';
  return status === 'success' ? 'Успешно' : status === 'error' ? 'Ошибка' : status;
}

export function getStatusBadgeClass(log) {
  const lifecycle = getLifecycleStatus(log);
  if (lifecycle === 'error') return 'ai-log-badge ai-log-badge-error';
  if (lifecycle === 'success') return 'ai-log-badge ai-log-badge-success';
  if (lifecycle === 'processing') return 'ai-log-badge ai-log-badge-processing';
  if (lifecycle === 'pending') return 'ai-log-badge ai-log-badge-pending';
  return 'ai-log-badge';
}

export function getDefaultDateRange(days = 30) {
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));

  return { startDate, endDate };
}

export function getYearDateRange() {
  const year = new Date().getFullYear();
  const startDate = new Date(year, 0, 1);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(year, 11, 31);
  endDate.setHours(0, 0, 0, 0);

  return { startDate, endDate, year };
}

export function toIsoDateStart(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value.toISOString();
}

export function toIsoDateEnd(date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value.toISOString();
}

export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLogOwner(log) {
  const userRef = log?.userId || log?.owner || log?.user;

  let id = log?.ownerId;
  if (!id && userRef) {
    id = typeof userRef === 'string' ? userRef : (userRef._id || userRef.id);
  }

  const name = log?.ownerName
    || (typeof userRef === 'object' ? userRef?.username : null)
    || (typeof userRef === 'object' ? userRef?.name : null)
    || log?.owner?.name
    || log?.user?.name
    || log?.owner?.email
    || log?.ownerEmail
    || log?.user?.email
    || (typeof userRef === 'object' ? userRef?.email : null)
    || (typeof userRef === 'string' ? userRef : null)
    || 'Неизвестный пользователь';

  return { id: id || name, name };
}

export function getCompanyId(log) {
  const companyRef = log?.companyId;
  if (!companyRef) return null;
  if (typeof companyRef === 'string') return companyRef;
  return companyRef._id || companyRef.id || null;
}

export function getCompanyName(log) {
  const companyRef = log?.companyId;
  if (!companyRef || typeof companyRef === 'string') return null;
  return companyRef.name || null;
}

export function getOperationLabel(log) {
  const { operationId, operationLabel } = log || {};
  if (operationLabel && operationLabel !== operationId) {
    return operationLabel;
  }

  const fromConfig = AI_OPERATION_OPTIONS.find((item) => item.id === operationId);
  return fromConfig?.label || operationLabel || operationId || '—';
}

export async function fetchAllEditorAiLogs(params) {
  const all = [];
  let page = 1;
  const limit = EDITOR_AI_LOGS_PAGE_LIMIT;

  while (true) {
    const response = await apiGetEditorAiLogs({
      ...params,
      page,
      limit,
      sortBy: 'startedAt',
      sortOrder: 'asc',
    });

    const items = response?.data || [];
    all.push(...items);

    const totalPages = response?.pagination?.pages || 1;
    if (page >= totalPages || items.length < limit) {
      break;
    }

    page += 1;
  }

  return all;
}

function getMondayBasedDayIndex(date) {
  return (date.getDay() + 6) % 7;
}

export function buildHeatmapWeeks(startDate, endDate, logs) {
  const counts = {};

  logs.forEach((log) => {
    if (!log.startedAt) return;
    const key = log.startedAt.slice(0, 10);
    counts[key] = (counts[key] || 0) + 1;
  });

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  if (start > end) {
    return { weeks: [], maxCount: 0 };
  }

  const gridStart = new Date(start);
  gridStart.setDate(gridStart.getDate() - getMondayBasedDayIndex(gridStart));

  const gridEnd = new Date(end);
  gridEnd.setDate(gridEnd.getDate() + (6 - getMondayBasedDayIndex(gridEnd)));

  const days = [];
  const current = new Date(gridStart);

  while (current <= gridEnd) {
    const key = formatDateKey(current);
    const inRange = current >= start && current <= end;

    days.push({
      date: new Date(current),
      count: inRange ? (counts[key] || 0) : 0,
      inRange,
    });

    current.setDate(current.getDate() + 1);
  }

  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(
      days.slice(index, index + 7).map((day) => (day.inRange ? day : null))
    );
  }

  const maxCount = days
    .filter((day) => day.inRange)
    .reduce((max, day) => Math.max(max, day.count), 0);

  return { weeks, maxCount };
}

export function getHeatmapLevel(count, maxCount) {
  if (!count) return 0;
  if (maxCount <= 1) return 4;

  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export function getMonthLabels(weeks) {
  const labels = [];
  let lastMonth = null;

  weeks.forEach((week, weekIndex) => {
    const firstDayInWeek = week.find((day) => day !== null);
    if (!firstDayInWeek) {
      labels.push({ weekIndex, label: '' });
      return;
    }

    const month = firstDayInWeek.date.getMonth();
    if (month !== lastMonth) {
      labels.push({
        weekIndex,
        label: firstDayInWeek.date.toLocaleDateString('ru-RU', { month: 'short' }),
      });
      lastMonth = month;
      return;
    }

    labels.push({ weekIndex, label: '' });
  });

  return labels;
}
