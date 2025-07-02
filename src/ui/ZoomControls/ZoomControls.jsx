import { FiZoomIn, FiZoomOut, FiRefreshCw } from 'react-icons/fi';

import './ZoomControls.css';

export const ZoomControls = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onReset,
  minZoom,
  maxZoom,
  layout = 'horizontal', // или 'vertical'
  showPercentage = true,
  className = ''
}) => {
  return (
    <div className={`zoom-controls ${className} ${layout}`}>
      <button
        onClick={onZoomIn}
        disabled={zoomLevel >= maxZoom}
        className="zoom-button zoom-in"
      >
        <FiZoomIn size={16} />
      </button>
      
      {showPercentage && (
        <div className={`zoom-percentage  ${layout}`}>
          {Math.round(zoomLevel * 100)}%
        </div>
      )}
      
      <button
        onClick={onZoomOut}
        disabled={zoomLevel <= minZoom}
        className="zoom-button zoom-out"
      >
        <FiZoomOut size={16} />
      </button>
      
      <button
        onClick={onReset}
        disabled={zoomLevel === 1}
        className="zoom-button zoom-reset"
      >
        <FiRefreshCw size={16} />
      </button>
    </div>
  );
};