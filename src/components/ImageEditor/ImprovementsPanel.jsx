import { IMPROVEMENTS, PRODUCT_SHOWCASE } from './improvementsConfig';
import ShadowImprovementCard from './ShadowImprovementCard';
import styles from './ImageEditor.module.css';

const ImprovementCard = ({
  id,
  label,
  description,
  icon: Icon,
  activeProcessing,
  onImprovementClick,
  disabled,
  disabledReason,
}) => {
  const isLoading = activeProcessing === id;
  const isDisabled = disabled || isLoading;
  const showUnavailableHint = disabled && !isLoading && disabledReason;

  return (
    <button
      type="button"
      className={`${styles.improvementCard} ${styles.improvementCardWide} ${isLoading ? styles.loading : ''} ${showUnavailableHint ? styles.improvementCardUnavailable : ''}`}
      onClick={() => onImprovementClick(id)}
      disabled={isDisabled}
      title={showUnavailableHint ? disabledReason : undefined}
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
    </button>
  );
};

const ImprovementsPanel = ({
  activeProcessing,
  onImprovementClick,
  disabled,
  disabledImprovements = {},
  disabledReasons = {},
}) => {
  return (
    <div className={styles.toolsGroup}>
      <div className={styles.improvementsWideList}>
        {IMPROVEMENTS.map((item) => {
          if (item.id === 'shadow') {
            return (
              <ShadowImprovementCard
                key={item.id}
                label={item.label}
                description={item.description}
                icon={item.icon}
                activeProcessing={activeProcessing}
                onApply={(options) => onImprovementClick('shadow', options)}
                disabled={disabled || disabledImprovements.shadow}
              />
            );
          }

          return (
            <ImprovementCard
              key={item.id}
              {...item}
              activeProcessing={activeProcessing}
              onImprovementClick={onImprovementClick}
              disabled={disabled || disabledImprovements[item.id]}
              disabledReason={disabledReasons[item.id]}
            />
          );
        })}
      </div>

      <div className={styles.improvementsSection}>
        <h4 className={styles.improvementsSectionTitle}>Показать товар</h4>
        <div className={styles.improvementsWideList}>
          {PRODUCT_SHOWCASE.map((item) => (
            <ImprovementCard
              key={item.id}
              {...item}
              activeProcessing={activeProcessing}
              onImprovementClick={onImprovementClick}
              disabled={disabled || disabledImprovements[item.id]}
              disabledReason={disabledReasons[item.id]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImprovementsPanel;
