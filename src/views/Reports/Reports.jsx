import { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineChevronLeft } from "react-icons/hi2";

import { apiGetReportLastDays } from '../../services/reportsService';
import { LanguageContext } from '../../contexts/contextLanguage';
import { useAuth } from '../../contexts/AuthContext';

export const Reports = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const { user } = useAuth();

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  console.log(reportData)

  return (
    <div>
      <div className='header-section' style={{ margin: '10px 10px 0px'}}>
        <button onClick={handleBack} className='button-back' style={{ color: '#333'}}>
          <HiOutlineChevronLeft /> {t('header.back')}
        </button>
        <h2 style={{ color: '#333'}}>{'Отчет по сотрудникам'}</h2>
      </div>
      <div className="items-grid">
        {loading && <div>Загрузка...</div>}
        {error && <div style={{ color: 'red' }}>Ошибка: {error}</div>}
      </div>
    </div>
  );
};