import { useState } from 'react';
import './Tooltip.css';

export const Tooltip = ({ children, content, position = 'top' }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="tooltip-wrapper">
      <div
        className={`tooltip-trigger`}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </div>
      {visible && (
        <div className={`tooltip ${position}`}>
          {content}
          <div className={`tooltip-arrow ${position}`} />
        </div>
      )}
    </div>
  );
};