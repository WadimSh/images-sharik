import { fetchDataWithFetch } from "./fetch/fetchBase";

// Получить отчет по компании с корректной обработкой дат
export async function apiGetReport(companyId, params = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) {
    const startDate = new Date(params.startDate);
    
    // Форматируем дату как YYYY-MM-DD в локальном времени
    const formattedDate = startDate.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('.').reverse().join('-');
    
    queryParams.append('startDate', formattedDate);
  }
  
  if (params.endDate) {
    const endDate = new Date(params.endDate);
        
    // КРИТИЧЕСКО ВАЖНО: добавляем +1 день для полуоткрытого интервала
    endDate.setDate(endDate.getDate() + 1);
    
    // Форматируем дату как YYYY-MM-DD в локальном времени
    const formattedDate = endDate.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('.').reverse().join('-');
    
    queryParams.append('endDate', formattedDate);
  }
  
  if (params.grouping) {
    queryParams.append('grouping', params.grouping);
  }
  
  if (params.includeDetails !== undefined) {
    queryParams.append('includeDetails', params.includeDetails.toString());
  }
  
  const queryString = queryParams.toString();
  const url = `/api/reports/${companyId}${queryString ? `?${queryString}` : ''}`;
  
  return fetchDataWithFetch(url, {
    method: 'GET'
  });
}

// Получение отчета за последние N дней
export async function apiGetReportLastDays(companyId, days = 30) {
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0); 
  
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (days - 1)); 
  startDate.setHours(0, 0, 0, 0);

  return apiGetReport(companyId, {
    startDate,
    endDate,
    grouping: 'daily',
    includeDetails: true
  });
}

// Получить отчет за указанный месяц
export async function apiGetReportForMonth(companyId, year, month, options = {}) {
  // {number} year - Год (например, 2025)
  // {number} month - Месяц (0-11, где 0=январь, 11=декабрь)
  
  // Первое число указанного месяца
  const startDate = new Date(year, month, 1);
  
  // Последний день указанного месяца
  const endDate = new Date(year, month + 1, 0);
  
  return apiGetReport(companyId, {
    startDate,
    endDate,
    grouping: options.grouping || 'daily',
    includeDetails: options.includeDetails !== undefined ? options.includeDetails : true
  });
}
