import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineChevronLeft, 
  HiOutlineChevronDown, 
  HiOutlineChevronRight,
  HiOutlineUserGroup,
  HiOutlineShoppingBag,
  HiOutlineCube
} from "react-icons/hi2";

import { DateRangePicker } from '../../ui/DateRangePicker/DateRangePicker';
import { apiGetReport, apiGetReportLastDays } from '../../services/reportsService';
import { LanguageContext } from '../../contexts/contextLanguage';
import { useAuth } from '../../contexts/AuthContext';
import './Reports.css';

export const Reports = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const { user } = useAuth();

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [initialDateRange, setInitialDateRange] = useState({
    startDate: null,
    endDate: null
  });

  const handleBack = () => {
    navigate(-1);
  };

  // Универсальная функция загрузки отчета по периоду
  const loadReport = useCallback(async (companyId, startDate, endDate) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Загрузка отчета с датами:', {
        startDate: startDate ? startDate.toLocaleDateString('ru-RU') : 'null',
        endDate: endDate ? endDate.toLocaleDateString('ru-RU') : 'null'
      });
      
      const data = await apiGetReport(companyId, {
        startDate,
        endDate,
        grouping: 'daily',
        includeDetails: true
      });
      
      setReportData(data);
      
      // Обновляем даты для отображения в пикере
      if (data?.timeRange) {
        const startDate = new Date(data.timeRange.startDate);
        const endDate = new Date(data.timeRange.endDate);
        
        // КОРРЕКТИРУЕМ конечную дату: уменьшаем на 1 день для отображения
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);
        
        setInitialDateRange({
          startDate,
          endDate: adjustedEndDate // Используем с -1 день
        });
      }
      
    } catch (err) {
      console.error('Ошибка загрузки отчета:', err);
      setError(err.message || 'Ошибка загрузки отчета');
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка отчета за последние 30 дней (начальная загрузка)
  const loadLast30DaysReport = useCallback(async (companyId) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiGetReportLastDays(companyId, 30);
      setReportData(data);
      
      // Устанавливаем начальные даты из ответа API
      if (data?.timeRange) {
        const startDate = new Date(data.timeRange.startDate);
        const endDate = new Date(data.timeRange.endDate);
        
        // КОРРЕКТИРУЕМ конечную дату: уменьшаем на 1 день для отображения
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);
        
        setInitialDateRange({
          startDate,
          endDate: adjustedEndDate // Используем с -1 день
        });
      }
      
    } catch (err) {
      console.error('Ошибка загрузки отчета:', err);
      setError(err.message || 'Ошибка загрузки отчета');
    } finally {
      setLoading(false);
    }
  }, []);

  // Обработка изменения диапазона дат
  const handleDateRangeChange = (start, end) => {
    console.log('Пользователь выбрал период:', {
      start: start ? start.toLocaleDateString('ru-RU') : 'null',
      end: end ? end.toLocaleDateString('ru-RU') : 'null'
    });
    
    setInitialDateRange({ startDate: start, endDate: end });
    
    if (start && end && user?.company?.[0]?.id) {
      loadReport(user.company[0].id, start, end);
      setExpandedRows(new Set());
    }
  };

  useEffect(() => {
    if (user?.company?.[0]?.id) {
      loadLast30DaysReport(user.company[0].id);
    } else {
      setError('Не удалось определить ID компании');
      setLoading(false);
    }
  }, [user, loadLast30DaysReport]);

  // Форматирование даты для отображения
  const formatDate = (dateString) => {
    if (!dateString || dateString === '1970-01-01T00:00:00.000Z') {
      return '—';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Форматирование даты периода (только день.месяц)
  const formatPeriodDate = (periodString) => {
    const date = new Date(periodString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  // Переключение раскрытия строки
  const toggleRow = (employeeId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(employeeId)) {
      newExpandedRows.delete(employeeId);
    } else {
      newExpandedRows.add(employeeId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Подсчет общей активности за период
  const calculatePeriodStats = (detailedPeriodStats) => {
    const totalActive = detailedPeriodStats.reduce((sum, day) => sum + day.activeHistories, 0);
    const totalUnique = detailedPeriodStats.reduce((sum, day) => sum + day.uniqueArticles, 0);
    return { totalActive, totalUnique, formatted: `${totalActive}/${totalUnique}` };
  };

  // Генерация всех дат в периоде
  const generateAllDatesInPeriod = () => {
    if (!reportData || !reportData.timeRange) return [];
    
    const startDate = new Date(reportData.timeRange.startDate);
    const endDate = new Date(reportData.timeRange.endDate);
    
    // API возвращает endDate уже увеличенным на 1 день
    // Поэтому нам нужно уменьшить его на 1 день для отображения
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);
    
    const dates = [];
    const currentDate = new Date(startDate);
    
    // Создаем даты для каждого дня в периоде
    while (currentDate <= adjustedEndDate) {
      // Форматируем дату как YYYY-MM-DD для сравнения с данными
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      dates.push(dateString);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  // Проверяем, есть ли активность у сотрудника в определенный день
  const getDayStatsForEmployee = (employee, date) => {
    // Ищем точное совпадение даты
    const dayStat = employee.detailedPeriodStats.find(
      day => day.period === date
    );
    
    if (dayStat) {
      return dayStat.formatted;
    }
    
    // Если не нашли, проверяем другие возможные форматы
    const dateObj = new Date(date);
    
    // Проверяем формат с ведущими нулями (2025-11-16)
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    const foundWithFormat = employee.detailedPeriodStats.find(
      day => day.period === formattedDate
    );
    
    if (foundWithFormat) {
      return foundWithFormat.formatted;
    }
    
    return '0/0';
  };

  // Скелетон для загрузки
  const renderSkeleton = () => (
    <div className="dashboard-skeleton">
      <div className="skeleton-cards">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-content">
              <div className="skeleton-title"></div>
              <div className="skeleton-value"></div>
            </div>
            <div className="skeleton-icon"></div>
          </div>
        ))}
      </div>
      <div className="skeleton-table">
        <div className="skeleton-table-header">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton-header-cell"></div>
          ))}
        </div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="skeleton-table-row">
            {[...Array(8)].map((_, j) => (
              <div key={j} className="skeleton-table-cell"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="reports-dashboard">
      <div className='header-section' style={{ margin: '10px 10px 20px'}}>
        <button onClick={handleBack} className='button-back' style={{ color: '#333'}}>
          <HiOutlineChevronLeft /> {t('header.back')}
        </button>
        <h2 style={{ color: '#333'}}>{'Отчет по сотрудникам'}</h2>

        {/* Добавляем компонент выбора дат */}
        <div className="date-picker-container" style={{ marginLeft: '10px' }}>
          {!loading && reportData && (
            <DateRangePicker 
              initialStartDate={initialDateRange.startDate} 
              initialEndDate={initialDateRange.endDate}
              onDateRangeChange={handleDateRangeChange}
              placeholder="Выберите период отчета"
            />
          )}
        </div>
      </div>
      
      <div className="dashboard-content">
        {loading && renderSkeleton()}
        {error && <div className="error-message">Ошибка: {error}</div>}
        
        {reportData && !loading && (
          <>
            {/* Dashboard Cards */}
            <div className="dashboard-cards">
              <div className="dashboard-card employees-card">
                <div className="card-content">
                  <span className="card-label">Всего сотрудников</span>
                  <span className="card-sublabel" style={{ height: '12px' }}>{' '}</span>
                  <span className="card-value">{reportData.companySummary.totalEmployees}</span>
                </div>
                <div className="card-icon users">
                  <HiOutlineUserGroup />
                </div>
              </div>

              <div className="dashboard-card total-card">
                <div className="card-content">
                  <span className="card-label">Всего</span>
                  <span className="card-sublabel">(дизайнов/товаров)</span>
                  <span className="card-value">{reportData.companySummary.formatted}</span>
                </div>
                <div className="card-icon total">
                  <HiOutlineShoppingBag />
                </div>
              </div>

              <div className="dashboard-card wb-card">
                <div className="card-content">
                  <span className="card-label">Wildberries</span>
                  <span className="card-sublabel">(дизайнов/товаров)</span>
                  <span className="card-value">{reportData.companySummary.wbTotal.formatted}</span>
                </div>
                <div className="card-icon wb">
                  <svg width="511" height="511" viewBox="0 0 511 511" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_275_5)">
                      <path d="M0 239.894C0 155.923 0 113.938 16.3419 81.8655C30.7165 53.6535 53.6535 30.7165 81.8655 16.3419C113.938 0 155.923 0 239.894 0H271.106C355.077 0 397.062 0 429.135 16.3419C457.346 30.7165 480.284 53.6535 494.659 81.8655C511 113.938 511 155.923 511 239.894V271.106C511 355.077 511 397.062 494.659 429.135C480.284 457.346 457.346 480.284 429.135 494.659C397.062 511 355.077 511 271.106 511H239.894C155.923 511 113.938 511 81.8655 494.659C53.6535 480.284 30.7165 457.346 16.3419 429.135C0 397.062 0 355.077 0 271.106V239.894Z" fill="url(#paint0_linear_275_5)"/>
                      <path d="M386.626 180.313C368.325 180.313 351.797 185.847 337.686 195.32V108.862H298.648V268.31C298.648 316.821 338.115 355.859 386.411 355.859C434.708 355.859 474.623 317.054 474.623 267.862C474.623 218.669 435.584 180.313 386.626 180.313ZM209.461 279.576L173.736 186.511H146.391L110.45 279.576L74.5113 186.511H31.9255L94.781 350.149H122.126L159.839 252.679L197.767 350.149H225.111L287.753 186.511H245.4L209.461 279.576ZM386.43 316.84C359.963 316.84 337.686 295.674 337.686 268.096C337.686 240.517 358.638 219.585 386.645 219.585C414.652 219.585 435.604 241.413 435.604 268.096C435.604 294.778 413.327 316.84 386.43 316.84Z" fill="white"/>
                    </g>
                    <defs>
                      <linearGradient id="paint0_linear_275_5" x1="171.882" y1="555.132" x2="485.45" y2="32.5182" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6F01FB"/>
                        <stop offset="1" stopColor="#FF49D7"/>
                      </linearGradient>
                      <clipPath id="clip0_275_5">
                        <rect width="511" height="511" fill="white"/>
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </div>

              <div className="dashboard-card ozon-card">
                <div className="card-content">
                  <span className="card-label">Ozon</span>
                  <span className="card-sublabel">(дизайнов/товаров)</span>
                  <span className="card-value">{reportData.companySummary.ozonTotal.formatted}</span>
                </div>
                <div className="card-icon ozon">
                  <svg width="511" height="511" viewBox="0 0 511 511" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_275_2)">
                      <rect width="511" height="511" fill="white"/>
                      <path d="M106.458 0H404.542C463.335 0 511 47.6649 511 106.458V404.542C511 463.335 463.335 511 404.542 511H106.458C47.6649 511 0 463.335 0 404.542V106.458C0 47.6649 47.6649 0 106.458 0Z" fill="#2962FF"/>
                      <path d="M222.577 282.594H188.589L231.982 208.491C232.934 206.871 232.669 204.484 231.401 203.274C230.926 202.796 230.292 202.524 229.671 202.524H166.899C161.378 202.524 156.873 208.355 156.873 215.465C156.873 222.575 161.391 228.406 166.899 228.406H195.101L151.563 302.577C150.559 304.197 150.823 306.516 152.091 307.794C152.62 308.34 153.241 308.613 153.875 308.545H222.524C228.046 308.204 232.299 302.1 232.035 294.921C231.771 288.271 227.676 282.986 222.524 282.645V282.576L222.577 282.594ZM441.921 202.524C436.4 202.524 431.895 208.355 431.895 215.465V258.927L377.683 203.393C376.481 202.097 374.632 202.302 373.641 203.939C373.218 204.621 373.007 205.422 373.007 206.309V295.603C373.007 302.73 377.525 308.545 383.033 308.545C388.542 308.545 393.059 302.782 393.059 295.603V252.141L447.271 307.743C448.526 309.039 450.375 308.766 451.366 307.129C451.789 306.447 452 305.646 452 304.828V215.465C451.96 208.287 447.496 202.524 441.921 202.524ZM298.479 285.032C275.521 285.032 258.401 269.43 258.401 255.466C258.401 241.501 275.574 225.9 298.479 225.9C321.437 225.9 338.557 241.501 338.557 255.466C338.557 269.43 321.477 285.032 298.479 285.032ZM298.479 200C265.284 200 238.336 224.809 238.336 255.466C238.336 286.123 265.284 310.932 298.479 310.932C331.675 310.932 358.622 286.123 358.622 255.466C358.622 224.809 331.675 200 298.479 200ZM101.023 285.1C88.3687 285.1 78.0652 271.886 78.0652 255.534C78.0652 239.182 88.3026 225.9 100.971 225.9C113.638 225.9 123.929 239.114 123.929 255.466V255.534C123.929 271.818 113.691 285.032 101.023 285.1ZM101.023 200C77.2859 200 58.0528 224.809 58 255.466C58 286.106 77.2198 310.932 100.971 311C124.708 311 143.941 286.191 143.994 255.534V255.466C143.941 224.826 124.721 200 101.023 200Z" fill="white"/>
                    </g>
                    <defs>
                      <clipPath id="clip0_275_2">
                        <rect width="511" height="511" fill="white"/>
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </div>

              <div className="dashboard-card other-card">
                <div className="card-content">
                  <span className="card-label">Другие площадки</span>
                  <span className="card-sublabel">(дизайнов/товаров)</span>
                  <span className="card-value">{reportData.companySummary.otherTotal.formatted}</span>
                </div>
                <div className="card-icon other">
                  <HiOutlineCube />
                </div>
              </div>
            </div>

            {/* Employees Table Container */}
            <div className="table-container">
              <div className="table-scroll-container">
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30px' }}></th>
                      <th>Сотрудник</th>
                      <th>Последняя операция</th>
                      <th style={{ textAlign: 'center' }}>Дизайнов/Товаров<br/> (всего)</th>
                      <th style={{ textAlign: 'center' }}>Дизайнов/Товаров<br/> (за период)</th>
                      <th style={{ textAlign: 'center' }}>WB</th>
                      <th style={{ textAlign: 'center' }}>OZON</th>
                      <th style={{ textAlign: 'center' }}>Другие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.employees.map((employee) => {
                      const periodStats = calculatePeriodStats(employee.detailedPeriodStats);
                      const hasActivityInPeriod = periodStats.totalActive > 0;
                      const isExpanded = expandedRows.has(employee.employeeId);
                      
                      return (
                        <React.Fragment key={employee.employeeId}>
                          <tr 
                            className={`employee-row ${employee.totalStats.activeHistories === 0 ? 'inactive-employee' : ''} ${isExpanded ? 'expanded-row' : ''}`}
                            onClick={() => hasActivityInPeriod && toggleRow(employee.employeeId)}
                            style={{ cursor: hasActivityInPeriod ? 'pointer' : 'default' }}
                          >
                            <td className="expand-icon">
                              {hasActivityInPeriod ? (
                                isExpanded ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />
                              ) : (
                                <span style={{ opacity: 0.3 }}>—</span>
                              )}
                            </td>
                            <td className="employee-info">
                              <div className="employee-name">{employee.employeeName}</div>
                              <div className="employee-email">{employee.employeeEmail}</div>
                            </td>
                            <td className="last-operation">
                              <span className={employee.lastOperationDate === '1970-01-01T00:00:00.000Z' ? 'zero-stats' : ''}>
                                {formatDate(employee.lastOperationDate)}
                              </span>
                            </td>
                            <td className="total-stats">
                              <span className={employee.totalStats.activeHistories === 0 ? 'zero-stats' : ''}>
                                {employee.totalStats.formatted}
                              </span>
                            </td>
                            <td className="period-stats">
                              <span className={periodStats.totalActive === 0 ? 'zero-stats' : ''}>
                                {periodStats.formatted}
                              </span>
                            </td>
                            <td className="wb-stats">
                              <span className={employee.wbStats.activeHistories === 0 ? 'zero-stats' : ''}>
                                {employee.wbStats.formatted}
                              </span>
                            </td>
                            <td className="ozon-stats">
                              <span className={employee.ozonStats.activeHistories === 0 ? 'zero-stats' : ''}>
                                {employee.ozonStats.formatted}
                              </span>
                            </td>
                            <td className="other-stats">
                              <span className={employee.otherStats.activeHistories === 0 ? 'zero-stats' : ''}>
                                {employee.otherStats.formatted}
                              </span>
                            </td>
                          </tr>
                          
                          {/* Детальная информация по дням */}
                          {isExpanded && hasActivityInPeriod && (
                            <tr className="detailed-row">
                              <td colSpan="8">
                                <div className="detailed-period-container">
                                  <div className="detailed-period-header">
                                    <h4>Детальная активность по дням:</h4>
                                  </div>
                                  <div className="detailed-period-scroll">
                                    <table className="detailed-period-table">
                                      <thead>
                                        <tr>
                                          {generateAllDatesInPeriod().map((date, index) => (
                                            <th key={index} className="date-header">
                                              {formatPeriodDate(date)}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          {generateAllDatesInPeriod().map((date, index) => (
                                            <td key={index} className="day-value-cell">
                                              <span className={
                                                getDayStatsForEmployee(employee, date) === '0/0' 
                                                  ? 'zero-stats' 
                                                  : ''
                                              }>
                                                {getDayStatsForEmployee(employee, date)}
                                              </span>
                                            </td>
                                          ))}
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {reportData.employees.length === 0 && (
                <div className="no-data-message">
                  <div className="no-data-icon">📊</div>
                  <p>Нет данных по сотрудникам</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};