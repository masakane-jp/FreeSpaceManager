import { describe, expect, it } from 'vitest';
import { addDays, buildCalendarWeeks, formatDate, formatDateRange, parseISODate, toISODate } from './date';

describe('formatDate', () => {
  it('formats an ISO date with slashes', () => {
    expect(formatDate('2026-09-13')).toBe('2026/09/13');
  });
});

describe('formatDateRange', () => {
  it('shows a single date when start and end are the same', () => {
    expect(formatDateRange('2026-09-13', '2026-09-13')).toBe('2026/09/13');
  });

  it('shows a range with a separator when dates differ', () => {
    expect(formatDateRange('2026-09-13', '2026-09-15')).toBe('2026/09/13 〜 2026/09/15');
  });
});

describe('parseISODate / toISODate', () => {
  it('round-trips an ISO date string', () => {
    const date = parseISODate('2026-09-13');
    expect(toISODate(date)).toBe('2026-09-13');
  });

  it('parses using local time, not UTC (avoids the classic off-by-one-day bug)', () => {
    const date = parseISODate('2026-01-01');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
  });
});

describe('addDays', () => {
  it('adds days without mutating the input', () => {
    const original = new Date(2026, 0, 1);
    const result = addDays(original, 5);
    expect(toISODate(result)).toBe('2026-01-06');
    expect(toISODate(original)).toBe('2026-01-01');
  });

  it('rolls over into the next month', () => {
    const result = addDays(new Date(2026, 0, 30), 5);
    expect(toISODate(result)).toBe('2026-02-04');
  });
});

describe('buildCalendarWeeks', () => {
  it('always returns full weeks of 7 days', () => {
    const weeks = buildCalendarWeeks(2026, 8); // September 2026
    for (const week of weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it('starts each week on Sunday', () => {
    const weeks = buildCalendarWeeks(2026, 8);
    expect(weeks[0][0].getDay()).toBe(0);
  });

  it('covers every day of the target month', () => {
    const weeks = buildCalendarWeeks(2026, 8); // September has 30 days
    const daysInMonth = weeks.flat().filter((d) => d.getMonth() === 8);
    expect(daysInMonth).toHaveLength(30);
  });
});
