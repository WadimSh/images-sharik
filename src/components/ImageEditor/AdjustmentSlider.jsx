import { useState, useRef, useEffect, useCallback } from 'react';
import { FiPlus, FiMinus } from 'react-icons/fi';
import styles from './ImageEditor.module.css';

const AdjustmentSlider = ({ 
  label, 
  value, 
  onChange, 
  min = -100, 
  max = 100,
  icon 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(value));
  const inputRef = useRef(null);
  
  const incrementIntervalRef = useRef(null);
  const decrementIntervalRef = useRef(null);
  const incrementTimeoutRef = useRef(null);
  const decrementTimeoutRef = useRef(null);
  const isIncrementingRef = useRef(false);
  const isDecrementingRef = useRef(false);
  
  const valueRef = useRef(value);
  
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  
  const valueClass = value > 0 ? styles.positive : value < 0 ? styles.negative : styles.zero;
  const displayValue = value > 0 ? `+${value}` : `${value}`;
  
  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(value));
    }
  }, [value, isEditing]);
  
  useEffect(() => {
    return () => {
      if (incrementIntervalRef.current) clearInterval(incrementIntervalRef.current);
      if (decrementIntervalRef.current) clearInterval(decrementIntervalRef.current);
      if (incrementTimeoutRef.current) clearTimeout(incrementTimeoutRef.current);
      if (decrementTimeoutRef.current) clearTimeout(decrementTimeoutRef.current);
    };
  }, []);
  
  const increment = useCallback(() => {
    const currentValue = valueRef.current;
    const newValue = Math.min(max, currentValue + 1);
    onChange(newValue);
  }, [max, onChange]);
  
  const decrement = useCallback(() => {
    const currentValue = valueRef.current;
    const newValue = Math.max(min, currentValue - 1);
    onChange(newValue);
  }, [min, onChange]);
  
  const startIncrement = useCallback((e) => {
    e.preventDefault();
    if (isIncrementingRef.current) return;
    
    isIncrementingRef.current = true;
    
    increment();
    
    incrementTimeoutRef.current = setTimeout(() => {
      if (isIncrementingRef.current) {
        incrementIntervalRef.current = setInterval(() => {
          if (isIncrementingRef.current && valueRef.current < max) {
            increment();
          } else if (valueRef.current >= max) {
            stopIncrement();
          }
        }, 50);
      }
    }, 200);
  }, [increment, max]);
  
  const startDecrement = useCallback((e) => {
    e.preventDefault();
    if (isDecrementingRef.current) return;
    
    isDecrementingRef.current = true;
    
    decrement();
    
    decrementTimeoutRef.current = setTimeout(() => {
      if (isDecrementingRef.current) {
        decrementIntervalRef.current = setInterval(() => {
          if (isDecrementingRef.current && valueRef.current > min) {
            decrement();
          } else if (valueRef.current <= min) {
            stopDecrement();
          }
        }, 50);
      }
    }, 200);
  }, [decrement, min]);
  
  const stopIncrement = useCallback(() => {
    isIncrementingRef.current = false;
    if (incrementTimeoutRef.current) {
      clearTimeout(incrementTimeoutRef.current);
      incrementTimeoutRef.current = null;
    }
    if (incrementIntervalRef.current) {
      clearInterval(incrementIntervalRef.current);
      incrementIntervalRef.current = null;
    }
  }, []);
  
  const stopDecrement = useCallback(() => {
    isDecrementingRef.current = false;
    if (decrementTimeoutRef.current) {
      clearTimeout(decrementTimeoutRef.current);
      decrementTimeoutRef.current = null;
    }
    if (decrementIntervalRef.current) {
      clearInterval(decrementIntervalRef.current);
      decrementIntervalRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isIncrementingRef.current) stopIncrement();
      if (isDecrementingRef.current) stopDecrement();
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [stopIncrement, stopDecrement]);
  
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  
  const handleInputBlur = () => {
    setIsEditing(false);
    let newValue = parseInt(inputValue, 10);
    if (isNaN(newValue)) {
      newValue = value;
    }
    newValue = Math.max(min, Math.min(max, newValue));
    onChange(newValue);
    setInputValue(String(newValue));
  };
  
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(String(value));
    }
  };
  
  const handleValueClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };
  
  return (
    <div className={styles.sliderGroup} onClick={(e) => e.stopPropagation()}>
      <div className={styles.sliderHeader}>
        {icon && <span className={styles.sliderIcon}>{icon}</span>}
        <span className={styles.sliderLabel}>{label}</span>
      </div>
      
      <div className={styles.valueControl}>
        <button
          className={styles.valueButton}
          onMouseDown={startDecrement}
          onMouseUp={stopDecrement}
          onMouseLeave={stopDecrement}
          onTouchStart={startDecrement}
          onTouchEnd={stopDecrement}
          disabled={value <= min}
          type="button"
        >
          <FiMinus size={18} />
        </button>
        
        <div className={styles.valueDisplay}>
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              min={min}
              max={max}
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className={styles.valueInput}
              step={1}
            />
          ) : (
            <span 
              className={`${styles.valueText} ${valueClass}`}
              onClick={handleValueClick}
            >
              {displayValue}
            </span>
          )}
        </div>
        
        <button
          className={styles.valueButton}
          onMouseDown={startIncrement}
          onMouseUp={stopIncrement}
          onMouseLeave={stopIncrement}
          onTouchStart={startIncrement}
          onTouchEnd={stopIncrement}
          disabled={value >= max}
          type="button"
        >
          <FiPlus size={18} />
        </button>
      </div>
    </div>
  );
};

export default AdjustmentSlider;