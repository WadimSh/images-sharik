import { useState, useEffect, useRef } from 'react';
import { 
  HiOutlineCalendarDateRange,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineXMark
} from 'react-icons/hi2';
import './DateRangePicker.css';

export const DateRangePicker = ({ 
  onDateRangeChange, 
  initialStartDate = null, 
  initialEndDate = null,
  placeholder = "Выберите период"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const pickerRef = useRef(null);

  // Обработка клика вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Форматирование даты для отображения
  const formatDisplayDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Форматирование для отображения в инпуте
  const getDisplayValue = () => {
    if (!startDate && !endDate) return placeholder;
    if (startDate && !endDate) return `${formatDisplayDate(startDate)} - ...`;
    if (startDate && endDate) {
      return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
    }
    return placeholder;
  };

  // Генерация дней для текущего месяца
  const generateDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Первый день месяца
    const firstDay = new Date(year, month, 1);
    // Последний день месяца
    const lastDay = new Date(year, month + 1, 0);
    
    // День недели первого дня (0 - воскресенье, 1 - понедельник)
    const firstDayOfWeek = firstDay.getDay();
    // Количество дней в месяце
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Дни предыдущего месяца
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isDisabled: false
      });
    }
    
    // Дни текущего месяца
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isDisabled: false
      });
    }
    
    // Дни следующего месяца (чтобы заполнить сетку)
    const totalCells = 42; // 6 недель * 7 дней
    const nextMonthDays = totalCells - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isDisabled: false
      });
    }
    
    return days;
  };

  // Обработка клика по дате
  const handleDateClick = (date) => {
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // Начало нового диапазона
      setTempStartDate(date);
      setTempEndDate(null);
    } else {
      // Завершение диапазона
      if (date < tempStartDate) {
        // Если выбрана дата раньше начальной, меняем их местами
        setTempEndDate(tempStartDate);
        setTempStartDate(date);
      } else {
        setTempEndDate(date);
      }
    }
  };

  // Применение выбранного диапазона
  const applyDateRange = () => {
    if (tempStartDate && tempEndDate) {
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
      if (onDateRangeChange) {
        onDateRangeChange(tempStartDate, tempEndDate);
      }
      setIsOpen(false);
    }
  };

  // Сброс выбора
  const resetSelection = () => {
    setTempStartDate(null);
    setTempEndDate(null);
  };

  // Очистка диапазона
  const clearRange = () => {
    setStartDate(null);
    setEndDate(null);
    setTempStartDate(null);
    setTempEndDate(null);
    if (onDateRangeChange) {
      onDateRangeChange(null, null);
    }
  };

  // Переключение на предыдущий месяц
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Переключение на следующий месяц
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Проверка, находится ли дата в выбранном диапазоне
  const isDateInRange = (date) => {
    if (!tempStartDate || !tempEndDate) return false;
    return date >= tempStartDate && date <= tempEndDate;
  };

  // Проверка, является ли дата началом или концом диапазона
  const isDateRangeEdge = (date) => {
    if (!tempStartDate && !tempEndDate) return false;
    return (
      (tempStartDate && date.toDateString() === tempStartDate.toDateString()) ||
      (tempEndDate && date.toDateString() === tempEndDate.toDateString())
    );
  };

  // Получение названия месяца
  const getMonthName = () => {
    return currentMonth.toLocaleDateString('ru-RU', { 
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="date-range-picker" ref={pickerRef}>
      <div 
        className="date-range-input"
        onClick={() => setIsOpen(!isOpen)}
      >
        <HiOutlineCalendarDateRange className="calendar-icon" />
        <span className={`date-range-value ${!startDate && !endDate ? 'placeholder' : ''}`}>
          {getDisplayValue()}
        </span>
        {(startDate || endDate) && (
          <button 
            className="clear-button"
            onClick={(e) => {
              e.stopPropagation();
              clearRange();
            }}
          >
            <HiOutlineXMark />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="date-range-dropdown">
          <div className="date-range-header">
            <div className="month-navigation">
              <button 
                className="nav-button"
                onClick={prevMonth}
              >
                <HiOutlineChevronLeft />
              </button>
              <span className="current-month">
                {getMonthName()}
              </span>
              <button 
                className="nav-button"
                onClick={nextMonth}
              >
                <HiOutlineChevronRight />
              </button>
            </div>
          </div>

          <div className="calendar-container">
            <div className="days-header">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
                <div key={index} className="day-header">
                  {day}
                </div>
              ))}
            </div>

            <div className="days-grid">
              {generateDays().map((day, index) => {
                const isInRange = isDateInRange(day.date);
                const isRangeEdge = isDateRangeEdge(day.date);
                const isToday = day.date.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={index}
                    className={`day-cell ${
                      !day.isCurrentMonth ? 'other-month' : ''
                    } ${isInRange ? 'in-range' : ''} ${
                      isRangeEdge ? 'range-edge' : ''
                    } ${isToday ? 'today' : ''}`}
                    onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                    disabled={!day.isCurrentMonth}
                  >
                    <span className="day-number">
                      {day.date.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="date-range-footer">
            <div className="selected-range">
              {tempStartDate && !tempEndDate && (
                <span>Выберите конечную дату</span>
              )}
              {tempStartDate && tempEndDate && (
                <span>
                  {formatDisplayDate(tempStartDate)} - {formatDisplayDate(tempEndDate)}
                </span>
              )}
              {!tempStartDate && !tempEndDate && (
                <span>Выберите диапазон дат</span>
              )}
            </div>
            
            <div className="footer-buttons">
              <button 
                className="footer-button reset"
                onClick={resetSelection}
                disabled={!tempStartDate && !tempEndDate}
              >
                Сбросить
              </button>
              <button 
                className="footer-button apply"
                onClick={applyDateRange}
                disabled={!tempStartDate || !tempEndDate}
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};