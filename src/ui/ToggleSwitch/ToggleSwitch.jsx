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

  const handleToggle = () => {
    if (!disabled) {
      const newState = !isChecked;
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
    <label
      className={`toggle-switch ${className} ${disabled ? 'disabled' : ''}`}
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
        onChange={handleToggle}
        disabled={disabled || isAnimating}
        aria-checked={isChecked}
        role="switch"
        className="toggle-input"
      />
      <span className="toggle-slider" />
      {label && <span className="toggle-label">{label}</span>}
    </label>
  );
};