import { useEffect, useRef, useState } from 'react';
import { HiOutlineChevronDown } from 'react-icons/hi2';

const HeatmapFilter = ({
  label,
  options,
  selected,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionId) => {
    if (selected.includes(optionId)) {
      onChange(selected.filter((id) => id !== optionId));
      return;
    }
    onChange([...selected, optionId]);
  };

  const clearSelection = () => onChange([]);

  const selectedLabel = selected.length === 0
    ? 'Все'
    : `${selected.length} выбрано`;

  return (
    <div className="heatmap-filter" ref={containerRef}>
      <span className="heatmap-filter-label">{label}</span>
      <button
        type="button"
        className="heatmap-filter-button"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>{selectedLabel}</span>
        <HiOutlineChevronDown />
      </button>

      {isOpen && (
        <div className="heatmap-filter-dropdown">
          <button
            type="button"
            className="heatmap-filter-clear"
            onClick={clearSelection}
          >
            Сбросить
          </button>
          {options.map((option) => (
            <label key={option.id} className="heatmap-filter-option">
              <input
                type="checkbox"
                checked={selected.includes(option.id)}
                onChange={() => toggleOption(option.id)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeatmapFilter;
