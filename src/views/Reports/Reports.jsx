import { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineChevronLeft, 
  HiOutlineChevronDown, 
  HiOutlineChevronRight
} from "react-icons/hi2";

import { apiGetReportLastDays } from '../../services/reportsService';
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

  const handleBack = () => {
    navigate(-1);
  };

  const loadLast30DaysReport = useCallback(async (companyId) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiGetReportLastDays(companyId, 30);
      setReportData(data);
      
    } catch (err) {
      console.error('Ошибка загрузки отчета:', err);
      setError(err.message || 'Ошибка загрузки отчета');
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Генерация всех дат в периоде (без последней даты - она из будущего)
  const generateAllDatesInPeriod = () => {
    if (!reportData) return [];
    
    const startDate = new Date(reportData.timeRange.startDate);
    const endDate = new Date(reportData.timeRange.endDate);
    
    // Уменьшаем endDate на 1 день, так как последняя дата - это 00:00 следующего дня
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);
    
    const dates = [];
    const currentDate = new Date(startDate);
    
    // Создаем даты для каждого дня в периоде (без последней даты)
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

  // Форматирование периода для отображения в заголовке
  const formatPeriodForDisplay = () => {
    if (!reportData) return '';
    
    const startDate = new Date(reportData.timeRange.startDate);
    const endDate = new Date(reportData.timeRange.endDate);
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);
    
    return `${startDate.toLocaleDateString('ru-RU')} - ${adjustedEndDate.toLocaleDateString('ru-RU')}`;
  };

  return (
    <div className="reports-container">
      <div className='header-section' style={{ margin: '10px 10px 20px'}}>
        <button onClick={handleBack} className='button-back' style={{ color: '#333'}}>
          <HiOutlineChevronLeft /> {t('header.back')}
        </button>
        <h2 style={{ color: '#333'}}>{'Отчет по сотрудникам'}</h2>
      </div>
      
      <div className="reports-content">
        {loading && <div className="loading">Загрузка...</div>}
        {error && <div className="error" style={{ color: 'red' }}>Ошибка: {error}</div>}
        
        {reportData && !loading && (
          <div className="report-table-container">
            <div className="report-summary">
              <div className="summary-item">
                <span className="summary-label">Период:</span>
                <span className="summary-value">
                  {formatPeriodForDisplay()}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Всего сотрудников:</span>
                <span className="summary-value">{reportData.companySummary.totalEmployees}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Всего за период:</span>
                <span className="summary-value">{reportData.companySummary.formatted}</span>
              </div>
            </div>
            
            <div className="employees-table-wrapper">
              <table className="employees-table">
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}></th>
                    <th>Сотрудник</th>
                    <th>Последняя операция</th>
                    <th>Дизайнов/Товаров<br/> (всего)</th>
                    <th>Дизайнов/Товаров<br/> (за период)</th>
                    <th>WB</th>
                    <th>OZON</th>
                    <th>Другие</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.employees.map((employee) => {
                    const periodStats = calculatePeriodStats(employee.detailedPeriodStats);
                    const hasActivityInPeriod = periodStats.totalActive > 0;
                    const isExpanded = expandedRows.has(employee.employeeId);
                    
                    return (
                      <>
                        <tr 
                          key={employee.employeeId} 
                          className={`${employee.totalStats.activeHistories === 0 ? 'inactive-employee' : ''} ${isExpanded ? 'expanded-row' : ''}`}
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
                                <div className="detailed-period-table-wrapper">
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
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {reportData.employees.length === 0 && (
              <div className="no-data">Нет данных по сотрудникам</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};