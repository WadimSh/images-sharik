import { useState, useEffect, useRef } from 'react';
import { FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import {
  BACKGROUND_GUIDANCE_SCALE_DEFAULT,
  BACKGROUND_PROMPT_PLACEHOLDER,
} from './backgroundConfig';
import styles from './ImageEditor.module.css';

const BackgroundImprovementCard = ({
  label,
  description,
  icon: Icon,
  activeProcessing,
  onApply,
  disabled,
}) => {
  const isLoading = activeProcessing === 'createBackground';
  const isDisabled = disabled || isLoading;
  const [isExpanded, setIsExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [guidanceImage, setGuidanceImage] = useState(null);
  const [guidancePreview, setGuidancePreview] = useState(null);
  const [guidanceScale, setGuidanceScale] = useState(BACKGROUND_GUIDANCE_SCALE_DEFAULT);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!guidanceImage) {
      setGuidancePreview(null);
      return undefined;
    }

    const url = URL.createObjectURL(guidanceImage);
    setGuidancePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [guidanceImage]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setGuidanceImage(file);
    }
  };

  const clearGuidanceImage = () => {
    setGuidanceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApply = () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt && !guidanceImage) {
      alert('Укажите текстовое описание фона или загрузите образец');
      return;
    }

    onApply({
      prompt: trimmedPrompt,
      guidanceImage: guidanceImage || undefined,
      guidanceScale: guidanceImage ? guidanceScale : undefined,
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
          <p className={styles.shadowModeHint}>
            Опишите фон текстом, загрузите образец или используйте оба варианта вместе.
          </p>

          <div className={styles.shadowControls}>
            <div className={styles.shadowControl}>
              <label className={styles.shadowControlLabel} htmlFor="background-prompt">
                Текстовое описание фона
              </label>
              <textarea
                id="background-prompt"
                className={styles.backgroundTextarea}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={BACKGROUND_PROMPT_PLACEHOLDER}
                rows={3}
                disabled={isDisabled}
              />
            </div>

            <div className={styles.shadowControl}>
              <span className={styles.shadowControlLabel}>Образец фона (необязательно)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={styles.backgroundFileInput}
                disabled={isDisabled}
              />
              {guidancePreview && (
                <div className={styles.backgroundGuidancePreview}>
                  <img src={guidancePreview} alt="Образец фона" />
                  <button
                    type="button"
                    className={styles.backgroundGuidanceRemove}
                    onClick={clearGuidanceImage}
                    disabled={isDisabled}
                    aria-label="Удалить образец"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              )}
            </div>

            {guidanceImage && (
              <div className={styles.shadowControl}>
                <div className={styles.shadowControlHeader}>
                  <span className={styles.shadowControlLabel}>Соответствие образцу</span>
                  <span className={styles.shadowControlValue}>{guidanceScale.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={guidanceScale}
                  onChange={(e) => setGuidanceScale(Number(e.target.value))}
                  className={styles.shadowRange}
                  disabled={isDisabled}
                />
                <p className={styles.shadowModeHint}>
                  0 — образец игнорируется, 1 — максимальное соответствие образцу.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.shadowApplyButton}
            onClick={handleApply}
            disabled={isDisabled}
          >
            {isLoading ? 'Создание…' : 'Создать фон'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BackgroundImprovementCard;
