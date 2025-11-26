import { useState, useEffect } from "react";
import Pagination from "../Pagination/Pagination"; 
import { CustomSelect } from "../CustomSelect/CustomSelect"; // ваш кастомный селект
import './PaginationPanel.css';

const PaginationPanel = ({
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className = "",
  itemsPerPageOptions = [10, 20, 30, 40, 50]
}) => {
  const [localItemsPerPage, setLocalItemsPerPage] = useState(itemsPerPage);

  // Синхронизируем локальное состояние с пропсами
  useEffect(() => {
    setLocalItemsPerPage(itemsPerPage);
  }, [itemsPerPage]);

  const handleItemsPerPageChange = (newValue) => {
    const newItemsPerPage = parseInt(newValue);
    setLocalItemsPerPage(newItemsPerPage);
    onItemsPerPageChange(newItemsPerPage);
  };

  // Создаем опции для селекта
  const itemsPerPageOptionsObj = itemsPerPageOptions.reduce((acc, option) => {
    acc[option] = `${option} на странице`;
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

  return (
    <div className={`pagination-panel ${className}`}>
      {/* Левая часть - информация о диапазоне */}
      <div className="pagination-panel__info">
        Показано {start}-{end} из {totalCount} элементов
      </div>

      {/* Центральная часть - пагинация */}
      <div className="pagination-panel__navigation">
        <Pagination
          currentPage={currentPage}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
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
        />
      </div>
    </div>
  );
};

export default PaginationPanel;