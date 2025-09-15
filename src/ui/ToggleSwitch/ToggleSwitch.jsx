import { useState, useEffect } from 'react';
import './ToggleSwitch.css';

export const ToggleSwitch = ({
  checked = false,
  onChange,
  disabled = false,
  size = 'medium',
  onColor = '#2196F3',
  offColor = '#cccccc',
  label = '',
  className = '',
}) => {
  const [isChecked, setIsChecked] = useState(checked);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleToggle = (e) => {
    e.stopPropagation(); // Останавливаем всплытие события
    e.preventDefault(); // Предотвращаем стандартное поведение
    
    console.log('Toggle area clicked, disabled:', disabled, 'current:', isChecked);
    
    if (!disabled && !isAnimating) {
      const newState = !isChecked;
      console.log('New state:', newState);
      setIsAnimating(true);
      setIsChecked(newState);
      
      // Задержка соответствует времени анимации в CSS (0.25s)
      setTimeout(() => {
        setIsAnimating(false);
        onChange?.(newState);
      }, 250);
    }
  };

  const sizes = {
    small: { width: 40, height: 20 },
    medium: { width: 50, height: 26 },
    large: { width: 60, height: 32 },
  };

  return (
    <div
      className={`toggle-switch-container ${className} ${disabled ? 'disabled' : ''}`}
      onClick={handleToggle}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div
        className="toggle-switch"
        style={{
          '--width': `${sizes[size].width}px`,
          '--height': `${sizes[size].height}px`,
          '--on-color': onColor,
          '--off-color': offColor,
        }}
      >
        <input
          type="checkbox"
          checked={isChecked}
          readOnly // Делаем только для чтения, управляем через клик по контейнеру
          disabled={disabled || isAnimating}
          aria-checked={isChecked}
          role="switch"
          className="toggle-input"
        />
        <span className="toggle-slider" />
      </div>
      
      {label && (
        <span 
          className="toggle-label"
          onClick={handleToggle} // Дублируем обработчик на лейбл
        >
          {label}
        </span>
      )}
    </div>
  );
};