import { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import {
  SHADOW_MODE,
  SHADOW_DEFAULT_OVERRIDES,
  SHADOW_SPREAD_OPTIONS,
  SHADOW_DIRECTION_OPTIONS,
  SHADOW_POSE_OPTIONS,
} from './shadowConfig';
import styles from './ImageEditor.module.css';

const ShadowImprovementCard = ({
  label,
  description,
  icon: Icon,
  activeProcessing,
  onApply,
  disabled,
}) => {
  const isLoading = activeProcessing === 'shadow';
  const isDisabled = disabled || isLoading;
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState(SHADOW_MODE.AUTO);
  const [overrides, setOverrides] = useState(SHADOW_DEFAULT_OVERRIDES);

  const updateOverride = (key, value) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply({
      mode,
      overrides: mode === SHADOW_MODE.CUSTOM ? overrides : undefined,
    });
  };

  return (
    <div className={`${styles.shadowImprovement} ${isExpanded ? styles.shadowImprovementExpanded : ''}`}>
      <button
        type="button"
        className={`${styles.improvementCard} ${styles.improvementCardWide} ${isLoading ? styles.loading : ''}`}
        onClick={() => setIsExpanded((prev) => !prev)}
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
          {description && (
            <span className={styles.improvementDescription}>{description}</span>
          )}
        </div>
        <span className={styles.shadowExpandIcon} aria-hidden="true">
          {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
        </span>
      </button>

      {isExpanded && (
        <div className={styles.shadowSettings}>
          <div className={styles.shadowModeToggle}>
            <label className={styles.shadowModeOption}>
              <input
                type="radio"
                name="shadowMode"
                value={SHADOW_MODE.AUTO}
                checked={mode === SHADOW_MODE.AUTO}
                onChange={() => setMode(SHADOW_MODE.AUTO)}
                disabled={isDisabled}
              />
              <span>Авто</span>
            </label>
            <label className={styles.shadowModeOption}>
              <input
                type="radio"
                name="shadowMode"
                value={SHADOW_MODE.CUSTOM}
                checked={mode === SHADOW_MODE.CUSTOM}
                onChange={() => setMode(SHADOW_MODE.CUSTOM)}
                disabled={isDisabled}
              />
              <span>Настройки</span>
            </label>
          </div>

          <p className={styles.shadowModeHint}>
            {mode === SHADOW_MODE.AUTO
              ? 'Модель сама подберёт мягкость, интенсивность и положение тени.'
              : 'Задайте параметры тени вручную для предсказуемого результата.'}
          </p>

          {mode === SHADOW_MODE.CUSTOM && (
            <div className={styles.shadowControls}>
              <div className={styles.shadowControl}>
                <div className={styles.shadowControlHeader}>
                  <span className={styles.shadowControlLabel}>Мягкость</span>
                  <span className={styles.shadowControlValue}>{overrides.softnessOverride.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={overrides.softnessOverride}
                  onChange={(e) => updateOverride('softnessOverride', Number(e.target.value))}
                  className={styles.shadowRange}
                  disabled={isDisabled}
                />
              </div>

              <div className={styles.shadowControl}>
                <div className={styles.shadowControlHeader}>
                  <span className={styles.shadowControlLabel}>Интенсивность</span>
                  <span className={styles.shadowControlValue}>{overrides.intensityOverride.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={overrides.intensityOverride}
                  onChange={(e) => updateOverride('intensityOverride', Number(e.target.value))}
                  className={styles.shadowRange}
                  disabled={isDisabled}
                />
              </div>

              <div className={styles.shadowControl}>
                <label className={styles.shadowControlLabel} htmlFor="shadow-spread">Длина тени</label>
                <select
                  id="shadow-spread"
                  value={overrides.spreadOverride}
                  onChange={(e) => updateOverride('spreadOverride', e.target.value)}
                  className={styles.shadowSelect}
                  disabled={isDisabled}
                >
                  {SHADOW_SPREAD_OPTIONS.map(({ value, label: optionLabel }) => (
                    <option key={value} value={value}>{optionLabel}</option>
                  ))}
                </select>
              </div>

              <div className={styles.shadowControl}>
                <label className={styles.shadowControlLabel} htmlFor="shadow-direction">Направление</label>
                <select
                  id="shadow-direction"
                  value={overrides.directionOverride}
                  onChange={(e) => updateOverride('directionOverride', e.target.value)}
                  className={styles.shadowSelect}
                  disabled={isDisabled}
                >
                  {SHADOW_DIRECTION_OPTIONS.map(({ value, label: optionLabel }) => (
                    <option key={value} value={value}>{optionLabel}</option>
                  ))}
                </select>
              </div>

              <div className={styles.shadowControl}>
                <label className={styles.shadowControlLabel} htmlFor="shadow-pose">Положение объекта</label>
                <select
                  id="shadow-pose"
                  value={overrides.subjectPoseOverride}
                  onChange={(e) => updateOverride('subjectPoseOverride', e.target.value)}
                  className={styles.shadowSelect}
                  disabled={isDisabled}
                >
                  {SHADOW_POSE_OPTIONS.map(({ value, label: optionLabel }) => (
                    <option key={value} value={value}>{optionLabel}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="button"
            className={styles.shadowApplyButton}
            onClick={handleApply}
            disabled={isDisabled}
          >
            {isLoading ? 'Применение…' : 'Применить тень'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShadowImprovementCard;
