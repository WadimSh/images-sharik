import { useState, useEffect, useRef } from 'react';
import './Tooltip.css';

export const Tooltip = ({ children, content, position = 'top' }) => {
  const triggerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});

  useEffect(() => {
    const style = {};
    const arrowPos = {};

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const trigger = triggerRef.current;
    const triggerRect = trigger.getBoundingClientRect();
    
    if (position = "bottom") {
      const slagRight = viewportWidth - triggerRect.right;
      if (slagRight < 50) {
        style.left = '0%';
        arrowPos.left= '67%'
      } 
    }
    setTooltipStyle(style);
    setArrowStyle(arrowPos);
  }, [visible])

  return (
    <div className="tooltip-wrapper">
      <div
        ref={triggerRef}
        className={`tooltip-trigger`}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </div>
      {visible && (
        <div className={`tooltip ${position}`} style={tooltipStyle}>
          {content}
          <div className={`tooltip-arrow ${position}`} style={arrowStyle} />
        </div>
      )}
    </div>
  );
};