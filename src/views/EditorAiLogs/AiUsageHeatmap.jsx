import { useMemo } from 'react';

import {
  buildHeatmapWeeks,
  getHeatmapLevel,
  getMonthLabels,
} from './editorAiLogsHelpers';

const LEVEL_COLORS = [
  '#ebedf0',
  '#b3d4ff',
  '#6cb6ff',
  '#218bff',
  '#0969da',
];

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const AiUsageHeatmap = ({ logs, startDate, endDate }) => {
  const { weeks, maxCount } = useMemo(
    () => buildHeatmapWeeks(startDate, endDate, logs),
    [startDate, endDate, logs]
  );

  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);

  const year = startDate?.getFullYear();

  const totalCount = useMemo(() => {
    if (!startDate || !endDate) return 0;

    const rangeStart = new Date(startDate);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(endDate);
    rangeEnd.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const effectiveEnd = rangeEnd < today ? rangeEnd : today;

    return logs.filter((log) => {
      if (!log.startedAt) return false;
      const startedAt = new Date(log.startedAt);
      return startedAt >= rangeStart && startedAt <= effectiveEnd;
    }).length;
  }, [logs, startDate, endDate]);

  const formatTooltip = (day) => {
    const countLabel = day.count === 1 ? 'операция' : 'операций';
    const dateLabel = day.date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return `${day.count} ${countLabel} ${dateLabel}`;
  };

  if (!startDate || !endDate) {
    return (
      <div className="ai-heatmap-empty">
        Выберите период для отображения карты
      </div>
    );
  }

  return (
    <div className="ai-heatmap">
      <div className="ai-heatmap-meta">
        <div className="ai-heatmap-summary">
          <span className="ai-heatmap-summary-value">{totalCount}</span>
          <span className="ai-heatmap-summary-label">
            {year ? `операций за ${year} год` : 'операций за год'}
          </span>
        </div>
      </div>

      <div className="ai-heatmap-scroll">
        <div className="ai-heatmap-grid ai-heatmap-grid-full">
          <div className="ai-heatmap-months">
            <div className="ai-heatmap-months-spacer" />
            {monthLabels.map((month) => (
              <div
                key={`month-${month.weekIndex}`}
                className="ai-heatmap-month-label"
              >
                {month.label}
              </div>
            ))}
          </div>

          <div className="ai-heatmap-body">
            <div className="ai-heatmap-weekdays">
              {WEEKDAY_LABELS.map((label, index) => (
                <span
                  key={label}
                  className={`ai-heatmap-weekday ${index % 2 === 0 ? '' : 'ai-heatmap-weekday-hidden'}`}
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="ai-heatmap-weeks">
              {weeks.map((week, weekIndex) => (
                <div key={`week-${weekIndex}`} className="ai-heatmap-week">
                  {week.map((day, dayIndex) => (
                    <div
                      key={`day-${weekIndex}-${dayIndex}`}
                      className="ai-heatmap-cell-wrapper"
                    >
                      {day ? (
                        <div
                          className="ai-heatmap-cell"
                          style={{
                            backgroundColor: LEVEL_COLORS[getHeatmapLevel(day.count, maxCount)],
                          }}
                          title={formatTooltip(day)}
                        />
                      ) : (
                        <div className="ai-heatmap-cell ai-heatmap-cell-empty" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="ai-heatmap-legend">
        <span>Меньше</span>
        {LEVEL_COLORS.map((color, index) => (
          <span
            key={color}
            className="ai-heatmap-legend-cell"
            style={{ backgroundColor: color }}
            title={index === 0 ? 'Нет операций' : undefined}
          />
        ))}
        <span>Больше</span>
      </div>
    </div>
  );
};

export default AiUsageHeatmap;
