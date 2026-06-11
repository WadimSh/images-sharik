import styles from './ImageEditor.module.css';
import { STRAIGHTEN_MAX_ANGLE, STRAIGHTEN_MIN_ANGLE } from './utils/straightenUtils';

const LABELED_ANGLES = [-45, -30, -15, 0, 15, 30, 45];
const NOTCH_STEP = 1;
const MICRO_TICK_COUNT = Math.round((STRAIGHTEN_MAX_ANGLE - STRAIGHTEN_MIN_ANGLE) / 0.1);

const buildNotchAngles = () => {
  const angles = [];
  for (let value = STRAIGHTEN_MIN_ANGLE; value <= STRAIGHTEN_MAX_ANGLE; value += NOTCH_STEP) {
    angles.push(value);
  }
  return angles;
};

const NOTCH_ANGLES = buildNotchAngles();

const angleToPercent = (value) => (
  ((value - STRAIGHTEN_MIN_ANGLE) / (STRAIGHTEN_MAX_ANGLE - STRAIGHTEN_MIN_ANGLE)) * 100
);

const getNotchClassName = (notchAngle) => {
  if (notchAngle === 0) return styles.straightenNotchCenter;
  if (notchAngle % 15 === 0) return styles.straightenNotchMajor;
  if (notchAngle % 5 === 0) return styles.straightenNotchMedium;
  return styles.straightenNotchMinor;
};

export const formatStraightenAngle = (angle) => (
  angle > 0 ? `+${angle.toFixed(1)}` : angle.toFixed(1)
);

export default function StraightenSliderBar({ visible, angle, onChange }) {
  if (!visible) return null;

  return (
    <div className={styles.straightenBar}>
      <div className={styles.straightenScale}>
        <div className={styles.straightenRuler}>
          <div
            className={styles.straightenMicroTicks}
            style={{ '--straighten-micro-ticks': MICRO_TICK_COUNT }}
          />

          {NOTCH_ANGLES.map((notchAngle) => (
            <span
              key={notchAngle}
              className={`${styles.straightenNotch} ${getNotchClassName(notchAngle)}`}
              style={{ left: `${angleToPercent(notchAngle)}%` }}
            />
          ))}

          <input
            type="range"
            className={styles.straightenSlider}
            min={STRAIGHTEN_MIN_ANGLE}
            max={STRAIGHTEN_MAX_ANGLE}
            step={0.1}
            value={angle}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label="Наклон изображения"
          />
        </div>

        <div className={styles.straightenScaleLabels}>
          {LABELED_ANGLES.map((labelAngle) => (
            <span
              key={labelAngle}
              className={`${styles.straightenScaleLabel} ${labelAngle === 0 ? styles.straightenScaleLabelCenter : ''}`}
              style={{ left: `${angleToPercent(labelAngle)}%` }}
            >
              {labelAngle > 0 ? `+${labelAngle}` : labelAngle}°
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
