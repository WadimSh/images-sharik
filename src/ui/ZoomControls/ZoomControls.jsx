import { FiZoomIn, FiZoomOut, FiMaximize } from 'react-icons/fi';
import { TbDeviceMobileSearch } from "react-icons/tb";
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
  setShowMobilePreview,
  showMobilePreview,
  containerSize,
  className = ''
}) => {
  return (
    <div className={`zoom-controls ${className} ${layout}`}>
      {(containerSize.fileName === '900x1200') && <button
        onClick={setShowMobilePreview}
        className={`zoom-button zoom-preview ${showMobilePreview ? "active-preview" : ""}`}
      >
        <TbDeviceMobileSearch size={20} />
      </button>}

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
        <FiMaximize size={16} />
      </button>
    </div>
  );
};