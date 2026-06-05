import { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { RiFilterFill } from 'react-icons/ri';

import { CustomSelect } from '../../ui/CustomSelect/CustomSelect';
import '../../components/SidebarFilters/SidebarFilters.css';
import HeatmapFilter from './HeatmapFilter';
import {
  AI_OPERATION_OPTIONS,
  getDefaultTableFilters,
  LIFECYCLE_STATUS_OPTIONS,
  PROVIDER_FILTER_OPTIONS,
  SECTION_FILTER_OPTIONS,
  SORT_SELECT_OPTIONS,
  SOURCE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from './editorAiLogsHelpers';
import './AiLogsFiltersSidebar.css';

const selectOptionsFromList = (options, allLabel) => ({
  '': allLabel,
  ...Object.fromEntries(options.map(({ id, label }) => [id, label])),
});

const AiLogsFiltersSidebar = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
  totalCount,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const updateFilter = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const defaults = getDefaultTableFilters();
    setLocalFilters(defaults);
    onReset(defaults);
    onClose();
  };

  return (
    <div className="sidebar-filters-overlay" onClick={onClose}>
      <div
        className="sidebar-filters ai-logs-filters-sidebar"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sidebar-filters-header">
          <div className="header-title">
            <RiFilterFill className="filter-icon" />
            <h3>Фильтры логов</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="sidebar-filters-content ai-logs-filters-content">
          <div className="ai-logs-filter-field">
            <HeatmapFilter
              label="AI-функции"
              options={AI_OPERATION_OPTIONS}
              selected={localFilters.operationIds}
              onChange={(value) => updateFilter('operationIds', value)}
            />
          </div>

          <div className="ai-logs-filter-field">
            <label className="ai-logs-filter-label">Пользователь</label>
            <input
              type="text"
              className="filter-input"
              placeholder="Имя или email"
              value={localFilters.ownerSearch}
              onChange={(event) => updateFilter('ownerSearch', event.target.value)}
            />
          </div>

          <div className="ai-logs-filter-field">
            <label className="ai-logs-filter-label">Раздел</label>
            <CustomSelect
              options={selectOptionsFromList(SECTION_FILTER_OPTIONS, 'Все разделы')}
              value={localFilters.section}
              onChange={(value) => updateFilter('section', value)}
            />
          </div>

          <div className="ai-logs-filter-field">
            <label className="ai-logs-filter-label">Статус процесса</label>
            <CustomSelect
              options={selectOptionsFromList(LIFECYCLE_STATUS_OPTIONS, 'Все статусы')}
              value={localFilters.lifecycleStatus}
              onChange={(value) => updateFilter('lifecycleStatus', value)}
            />
          </div>

          <div className="ai-logs-filter-field">
            <label className="ai-logs-filter-label">Результат</label>
            <CustomSelect
              options={selectOptionsFromList(STATUS_FILTER_OPTIONS, 'Все результаты')}
              value={localFilters.status}
              onChange={(value) => updateFilter('status', value)}
            />
          </div>

          <div className="ai-logs-filter-field">
            <label className="ai-logs-filter-label">Провайдер</label>
            <CustomSelect
              options={selectOptionsFromList(PROVIDER_FILTER_OPTIONS, 'Все провайдеры')}
              value={localFilters.provider}
              onChange={(value) => updateFilter('provider', value)}
            />
          </div>

          <div className="ai-logs-filter-field">
            <label className="ai-logs-filter-label">Источник</label>
            <CustomSelect
              options={selectOptionsFromList(SOURCE_FILTER_OPTIONS, 'Все источники')}
              value={localFilters.source}
              onChange={(value) => updateFilter('source', value)}
            />
          </div>

          <div className="ai-logs-filter-field">
            <label className="ai-logs-filter-label">Сортировка</label>
            <CustomSelect
              options={SORT_SELECT_OPTIONS}
              value={localFilters.sortKey}
              onChange={(value) => updateFilter('sortKey', value)}
            />
          </div>
        </div>

        <div className="sidebar-filters-footer">
          <div className="filter-stats">
            <RiFilterFill className="stats-icon" />
            <span>
              Найдено: <strong>{totalCount ?? 0}</strong>
            </span>
          </div>
          <div className="filter-actions">
            <button type="button" className="reset-btn" onClick={handleReset}>
              Сбросить
            </button>
            <button type="button" className="apply-btn" onClick={handleApply}>
              Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiLogsFiltersSidebar;
