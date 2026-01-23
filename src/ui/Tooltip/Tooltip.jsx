import { useState, useRef, useEffect } from 'react';
import './Tooltip.css';

export const Tooltip = ({ 
  children, 
  content, 
  position = 'top' 
}) => {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (visible) {
      // Даём время на применение стилей
      requestAnimationFrame(() => {
        setReady(true);
      });
    } else {
      setReady(false);
    }
  }, [visible]);

  const handleMouseEnter = () => {
    setVisible(true);
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  return (
    <div className="tooltip-wrapper">
      <div
        ref={triggerRef}
        className="tooltip-trigger"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {visible && (
        <div 
          ref={tooltipRef}
          className={`tooltip ${position} ${ready ? 'visible' : ''}`}
        >
          {content}
          <div className={`tooltip-arrow ${position}`} />
        </div>
      )}
    </div>
  );
};