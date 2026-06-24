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
