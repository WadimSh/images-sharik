import { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import {
  EXPAND_ASPECT_RATIOS,
  EXPAND_OUTPUT_INVALID_REASON,
  getDefaultDimensions,
  getHeightForWidth,
  getWidthForHeight,
  isExpandFreeAspect,
  isExpandOutputValid,
} from './expandConfig';
import styles from './ImageEditor.module.css';

const ExpandImprovementCard = ({
  label,
  description,
  icon: Icon,
  activeProcessing,
  onApply,
  disabled,
  disabledReason,
}) => {
  const isLoading = activeProcessing === 'expand';
  const isBusy = activeProcessing !== null;
  const isSourceDisabled = Boolean(disabled);
  const isDisabled = isSourceDisabled || isBusy;
  const showUnavailableHint = isSourceDisabled && !isBusy && disabledReason;

  const [isExpanded, setIsExpanded] = useState(false);
  const [aspectId, setAspectId] = useState(EXPAND_ASPECT_RATIOS[0].id);
  const [outputWidth, setOutputWidth] = useState(EXPAND_ASPECT_RATIOS[0].defaultWidth);
  const [outputHeight, setOutputHeight] = useState(EXPAND_ASPECT_RATIOS[0].defaultHeight);

  const selectedAspect = EXPAND_ASPECT_RATIOS.find((item) => item.id === aspectId)
    || EXPAND_ASPECT_RATIOS[0];
  const isFreeAspect = isExpandFreeAspect(aspectId);
  const isOutputValid = isExpandOutputValid(outputWidth, outputHeight);

  const handleAspectChange = (nextAspectId) => {
    if (nextAspectId === aspectId) return;

    if (isExpandFreeAspect(nextAspectId)) {
      setAspectId(nextAspectId);
      return;
    }

    const defaults = getDefaultDimensions(nextAspectId);
    setAspectId(nextAspectId);
    setOutputWidth(defaults.width);
    setOutputHeight(defaults.height);
  };

  const handleWidthChange = (event) => {
    const width = Math.max(1, Number.parseInt(event.target.value, 10) || 0);
    setOutputWidth(width);

    if (!isFreeAspect) {
      setOutputHeight(getHeightForWidth(width, selectedAspect.ratio));
    }
  };

  const handleHeightChange = (event) => {
    const height = Math.max(1, Number.parseInt(event.target.value, 10) || 0);
    setOutputHeight(height);

    if (!isFreeAspect) {
      setOutputWidth(getWidthForHeight(height, selectedAspect.ratio));
    }
  };

  const handleApply = () => {
    if (!isOutputValid) {
      alert(EXPAND_OUTPUT_INVALID_REASON);
      return;
    }

    onApply({
      outputWidth,
      outputHeight,
    });
  };

  return (
    <div className={`${styles.shadowImprovement} ${isExpanded ? styles.shadowImprovementExpanded : ''}`}>
      <button
        type="button"
        className={`${styles.improvementCard} ${styles.improvementCardWide} ${isLoading ? styles.loading : ''} ${showUnavailableHint ? styles.improvementCardUnavailable : ''}`}
        onClick={() => setIsExpanded((prev) => !prev)}
        disabled={isDisabled}
      >
        <div className={styles.improvementPreviewWide}>
          {isLoading ? (
            <div className={styles.spinner} />
          ) : (
            <Icon size={24} />
          )}
        </div>
        <div className={styles.improvementTextWide}>
          <span className={styles.improvementLabel}>{label}</span>
          {description && !showUnavailableHint && (
            <span className={styles.improvementDescription}>{description}</span>
          )}
          {showUnavailableHint && (
            <span className={styles.improvementUnavailableHint}>{disabledReason}</span>
          )}
        </div>
        <span className={styles.shadowExpandIcon} aria-hidden="true">
          {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
        </span>
      </button>

      {isExpanded && (
        <div className={styles.shadowSettings}>
          {showUnavailableHint ? (
            <p className={styles.improvementUnavailableHint}>{disabledReason}</p>
          ) : (
            <>
              <p className={styles.shadowModeHint}>
                Выберите пропорции и размер итогового изображения. Края будут достроены под выбранный формат.
              </p>

              <div className={styles.expandAspectButtons}>
                {EXPAND_ASPECT_RATIOS.map(({ id, label: aspectLabel }) => (
                  <button
                    key={id}
                    type="button"
                    className={`${styles.aspectRatioButton} ${aspectId === id ? styles.active : ''}`}
                    onClick={() => handleAspectChange(id)}
                    disabled={isDisabled}
                  >
                    {aspectLabel}
                  </button>
                ))}
              </div>

              <div className={styles.expandSizeControls}>
                <div className={styles.resizeInputGroup}>
                  <label htmlFor="expand-width">Ширина (px)</label>
                  <div className={styles.resizeInputWrapper}>
                    <input
                      id="expand-width"
                      type="number"
                      min="1"
                      max="5000"
                      value={outputWidth}
                      onChange={handleWidthChange}
                      className={styles.resizeInput}
                      disabled={isDisabled}
                    />
                  </div>
                </div>

                <div className={styles.resizeInputGroup}>
                  <label htmlFor="expand-height">Высота (px)</label>
                  <div className={styles.resizeInputWrapper}>
                    <input
                      id="expand-height"
                      type="number"
                      min="1"
                      max="5000"
                      value={outputHeight}
                      onChange={handleHeightChange}
                      className={styles.resizeInput}
                      disabled={isDisabled}
                    />
                  </div>
                </div>
              </div>

              {isFreeAspect && (
                <p className={styles.shadowModeHint}>
                  Ширина и высота задаются независимо.
                </p>
              )}

              {!isOutputValid && (
                <p className={styles.improvementUnavailableHint}>{EXPAND_OUTPUT_INVALID_REASON}</p>
              )}

              <button
                type="button"
                className={styles.shadowApplyButton}
                onClick={handleApply}
                disabled={isDisabled || !isOutputValid}
              >
                {isLoading ? 'Увеличение…' : 'Увеличить изображение'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpandImprovementCard;
