/**
 * @param {{ usage?: { minute?: number }, max?: { minute?: number } }|null|undefined} limits
 * @returns {boolean}
 */
export function isMinuteRateLimitReached(limits) {
  const max = limits?.max?.minute;
  if (max == null) return false;

  const usage = limits?.usage?.minute ?? 0;
  return usage >= max;
}

/**
 * @typedef {'low'|'medium'|'high'|'critical'|'exceeded'} MinuteLimitTone
 * @typedef {{ usage: number, max: number, ratio: number, percent: number, tone: MinuteLimitTone, isExceeded: boolean, title: string }} MinuteLimitMeter
 */

/**
 * @param {number} ratio
 * @returns {MinuteLimitTone}
 */
export function getMinuteLimitTone(ratio) {
  if (ratio >= 1) {
    return 'exceeded';
  }
  if (ratio >= 0.9) {
    return 'critical';
  }
  if (ratio >= 0.75) {
    return 'high';
  }
  if (ratio >= 0.5) {
    return 'medium';
  }
  return 'low';
}

/**
 * @param {{ usage?: { minute?: number }, max?: { minute?: number } }|null|undefined} limits
 * @returns {MinuteLimitMeter|null}
 */
export function getMinuteLimitMeter(limits) {
  const max = limits?.max?.minute;
  if (max == null || max <= 0) {
    return null;
  }

  const usage = Math.max(0, limits?.usage?.minute ?? 0);
  const ratio = Math.min(usage / max, 1);
  const tone = getMinuteLimitTone(usage / max);
  const isExceeded = usage >= max;

  return {
    usage,
    max,
    ratio,
    percent: Math.round(ratio * 100),
    tone,
    isExceeded,
    title: isExceeded
      ? `Лимит исчерпан: ${usage} из ${max} запросов в минуту`
      : `Использовано ${usage} из ${max} запросов в минуту`,
  };
}

/**
 * Обновляет usage из result.limits после completed generate.
 *
 * @param {object|null|undefined} limits
 * @param {{ minute?: number, day?: number }|null|undefined} resultLimits
 * @returns {object|null|undefined}
 */
export function applyResultLimits(limits, resultLimits) {
  if (!resultLimits || typeof resultLimits !== 'object') {
    return limits;
  }

  return {
    ...(limits || {}),
    usage: {
      ...(limits?.usage || {}),
      ...(resultLimits.minute != null ? { minute: resultLimits.minute } : {}),
      ...(resultLimits.day != null ? { day: resultLimits.day } : {}),
    },
  };
}
