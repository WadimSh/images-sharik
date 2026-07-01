import { getMinuteLimitMeter, getMinuteLimitTone, isMinuteRateLimitReached } from './mitupLimits';

describe('mitupLimits', () => {
  test('isMinuteRateLimitReached returns true when usage meets max', () => {
    expect(isMinuteRateLimitReached({ usage: { minute: 10 }, max: { minute: 10 } })).toBe(true);
    expect(isMinuteRateLimitReached({ usage: { minute: 3 }, max: { minute: 10 } })).toBe(false);
  });

  test('getMinuteLimitTone changes color band as ratio grows', () => {
    expect(getMinuteLimitTone(0.1)).toBe('low');
    expect(getMinuteLimitTone(0.55)).toBe('medium');
    expect(getMinuteLimitTone(0.8)).toBe('high');
    expect(getMinuteLimitTone(0.95)).toBe('critical');
    expect(getMinuteLimitTone(1)).toBe('exceeded');
  });

  test('getMinuteLimitMeter returns progress data for status bar', () => {
    expect(getMinuteLimitMeter({ usage: { minute: 1 }, max: { minute: 10 } })).toEqual({
      usage: 1,
      max: 10,
      ratio: 0.1,
      percent: 10,
      tone: 'low',
      isExceeded: false,
      title: 'Использовано 1 из 10 запросов в минуту',
    });
  });
});
