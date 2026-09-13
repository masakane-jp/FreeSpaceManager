import { useMemo, useState } from 'react';
import { buildCalendarWeeks, parseISODate, toISODate } from '../../lib/date';
import styles from './MonthCalendar.module.css';

export interface CalendarEvent {
  id: string;
  startDate: string;
  endDate: string;
  label: string;
  tone: 'success' | 'warning' | 'info' | 'neutral' | 'danger';
}

interface MonthCalendarProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  initialDate: string;
  todayDate: string;
}

interface PositionedEvent {
  event: CalendarEvent;
  weekIndex: number;
  startCol: number;
  endCol: number;
  lane: number;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const HEADER_HEIGHT = 28;
const LANE_HEIGHT = 22;
const LANE_GAP = 4;
const CELL_MIN_HEIGHT = 84;
const CELL_BOTTOM_PADDING = 8;

export function MonthCalendar({ events, onEventClick, initialDate, todayDate }: MonthCalendarProps) {
  const initial = parseISODate(initialDate);
  const [year, setYear] = useState(initial.getFullYear());
  const [monthIndex, setMonthIndex] = useState(initial.getMonth());

  const weeks = useMemo(() => buildCalendarWeeks(year, monthIndex), [year, monthIndex]);

  const { positionedEvents, rowHeights } = useMemo(() => {
    const sortedEvents = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const positioned: PositionedEvent[] = [];
    const heights: number[] = [];

    weeks.forEach((week, weekIndex) => {
      const weekStartIso = toISODate(week[0]);
      const weekEndIso = toISODate(week[6]);

      const overlapping = sortedEvents.filter(
        (event) => event.startDate <= weekEndIso && event.endDate >= weekStartIso,
      );

      const laneEndCols: number[] = [];
      overlapping.forEach((event) => {
        const clippedStartIso = event.startDate < weekStartIso ? weekStartIso : event.startDate;
        const clippedEndIso = event.endDate > weekEndIso ? weekEndIso : event.endDate;
        const startCol = week.findIndex((day) => toISODate(day) === clippedStartIso);
        const endCol = week.findIndex((day) => toISODate(day) === clippedEndIso);

        let lane = laneEndCols.findIndex((endCol_) => endCol_ < startCol);
        if (lane === -1) {
          lane = laneEndCols.length;
          laneEndCols.push(endCol);
        } else {
          laneEndCols[lane] = endCol;
        }

        positioned.push({ event, weekIndex, startCol, endCol, lane });
      });

      const laneCount = laneEndCols.length;
      heights.push(
        Math.max(CELL_MIN_HEIGHT, HEADER_HEIGHT + laneCount * (LANE_HEIGHT + LANE_GAP) + CELL_BOTTOM_PADDING),
      );
    });

    return { positionedEvents: positioned, rowHeights: heights };
  }, [weeks, events]);

  function goToPreviousMonth() {
    const previous = new Date(year, monthIndex - 1, 1);
    setYear(previous.getFullYear());
    setMonthIndex(previous.getMonth());
  }

  function goToNextMonth() {
    const next = new Date(year, monthIndex + 1, 1);
    setYear(next.getFullYear());
    setMonthIndex(next.getMonth());
  }

  function goToToday() {
    const today = parseISODate(todayDate);
    setYear(today.getFullYear());
    setMonthIndex(today.getMonth());
  }

  const cumulativeTop = (weekIndex: number) => rowHeights.slice(0, weekIndex).reduce((sum, h) => sum + h, 0);

  return (
    <div className={styles.calendar}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.navButton} onClick={goToPreviousMonth} aria-label="前の月">
          ←
        </button>
        <span className={styles.monthLabel}>
          {year}年{monthIndex + 1}月
        </span>
        <button type="button" className={styles.navButton} onClick={goToNextMonth} aria-label="次の月">
          →
        </button>
        <button type="button" className={styles.todayButton} onClick={goToToday}>
          今日
        </button>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className={styles.weekdayLabel}>
            {label}
          </span>
        ))}
      </div>

      <div
        className={styles.grid}
        style={{ gridTemplateRows: rowHeights.map((h) => `${h}px`).join(' ') }}
      >
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            const dayIso = toISODate(day);
            const isCurrentMonth = day.getMonth() === monthIndex;
            const isToday = dayIso === todayDate;
            return (
              <div
                key={dayIso}
                className={`${styles.dayCell} ${isCurrentMonth ? '' : styles.dayCellOutside}`}
                style={{ gridRow: weekIndex + 1, gridColumn: dayIndex + 1 }}
              >
                <span className={`${styles.dayNumber} ${isToday ? styles.dayNumberToday : ''}`}>
                  {day.getDate()}
                </span>
              </div>
            );
          }),
        )}

        <div className={styles.eventLayer}>
          {positionedEvents.map(({ event, weekIndex, startCol, endCol, lane }) => (
            <button
              key={`${event.id}-${weekIndex}`}
              type="button"
              className={`${styles.eventBar} ${styles[`tone-${event.tone}`]}`}
              style={{
                top: cumulativeTop(weekIndex) + HEADER_HEIGHT + lane * (LANE_HEIGHT + LANE_GAP),
                left: `calc(${(startCol / 7) * 100}% + 3px)`,
                width: `calc(${((endCol - startCol + 1) / 7) * 100}% - 6px)`,
                height: LANE_HEIGHT,
              }}
              onClick={() => onEventClick(event)}
              title={event.label}
            >
              {event.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
