import { fetchDataWithFetch } from "./fetch/fetchBase";

// Получить отчет по компании с корректной обработкой дат
export async function apiGetReport(companyId, params = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) {
    const startDate = new Date(params.startDate);
    startDate.setHours(0, 0, 0, 0);

    queryParams.append('startDate', startDate.toISOString().split('T')[0]);
  }
  
  if (params.endDate) {
    const endDate = new Date(params.endDate);
    
    // КРИТИЧЕСКО ВАЖНО: добавляем +1 день для полуоткрытого интервала
    // Пользователь думает "включительно", API работает с [start, end)
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(0, 0, 0, 0); 
    
    queryParams.append('endDate', endDate.toISOString().split('T')[0]);
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
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (days - 1)); // -1 чтобы включить сегодняшний день
  
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
