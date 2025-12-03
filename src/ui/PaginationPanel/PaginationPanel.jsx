import { useState, useEffect, useContext } from "react";

import Pagination from "../Pagination/Pagination"; 
import { CustomSelect } from "../CustomSelect/CustomSelect";
import { LanguageContext } from "../../contexts/contextLanguage";
import './PaginationPanel.css';

const PaginationPanel = ({
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className = "",
  itemsPerPageOptions = [10, 20, 30, 40, 50],
  loading = false // ← Добавляем проп loading
}) => {
  const { t } = useContext(LanguageContext);
  const [localItemsPerPage, setLocalItemsPerPage] = useState(itemsPerPage);

  // Синхронизируем локальное состояние с пропсами
  useEffect(() => {
    setLocalItemsPerPage(itemsPerPage);
  }, [itemsPerPage]);

  const handleItemsPerPageChange = (newValue) => {
    if (loading) return; // ← Блокируем во время загрузки
    
    const newItemsPerPage = parseInt(newValue);
    setLocalItemsPerPage(newItemsPerPage);
    onItemsPerPageChange(newItemsPerPage);
  };

  const handlePageChange = (page) => {
    if (loading) return; // ← Блокируем во время загрузки
    onPageChange(page);
  };

  // Создаем опции для селекта
  const itemsPerPageOptionsObj = itemsPerPageOptions.reduce((acc, option) => {
    acc[option] = `${option} ${t('pagination.itemsPerPage')}`;
    return acc;
  }, {});

  // Рассчитываем диапазон отображаемых элементов
  const getDisplayRange = () => {
    const start = ((currentPage - 1) * itemsPerPage) + 1;
    const end = Math.min(currentPage * itemsPerPage, totalCount);
    return { start, end };
  };

  const { start, end } = getDisplayRange();

  if (totalCount === 0) return null;

  // Форматируем текст с диапазоном
  const rangeText = t('pagination.showRange')
    .replace('{start}', start)
    .replace('{end}', end)
    .replace('{total}', totalCount);

  return (
    <div className={`pagination-panel ${className}`}>
      {/* Левая часть - информация о диапазоне */}
      <div className="pagination-panel__info">
        {!loading && rangeText}
      </div>

      {/* Центральная часть - пагинация */}
      <div className="pagination-panel__navigation">
        <Pagination
          currentPage={currentPage}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          disabled={loading} // ← Передаем disabled в Pagination
        />
      </div>

      {/* Правая часть - выбор количества элементов */}
      <div className="pagination-panel__controls">
        <CustomSelect
          options={itemsPerPageOptionsObj}
          value={localItemsPerPage.toString()}
          onChange={handleItemsPerPageChange}
          className="pagination-panel__select"
          dropdownMaxHeight="150px"
          disabled={loading} // ← Добавляем disabled
        />
      </div>
    </div>
  );
};

export default PaginationPanel;