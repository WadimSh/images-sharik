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

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleToggle = () => {
    if (!disabled) {
      const newState = !isChecked;
      setIsChecked(newState);
      onChange?.(newState);
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
        disabled={disabled}
        aria-checked={isChecked}
        role="switch"
        className="toggle-input"
      />
      <span className="toggle-slider" />
      {label && <span className="toggle-label">{label}</span>}
    </label>
  );
};