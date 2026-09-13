import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { Card } from '../../../components/Card/Card';
import { Button } from '../../../components/Button/Button';
import { Modal } from '../../../components/Modal/Modal';
import { FormError } from '../../../components/FormError/FormError';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { useAsync } from '../../../lib/useAsync';
import { ApiError } from '../../../lib/api/client';
import { deleteCalendarNote, listCalendarNotes, upsertCalendarNote } from '../../../lib/api/resources';
import { buildCalendarWeeks, toISODate } from '../../../lib/date';
import styles from './Calendar.module.css';

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export function Calendar() {
  const today = new Date();
  const todayIso = toISODate(today);
  const { data, error, reload } = useAsync(() => listCalendarNotes(), []);

  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [memo, setMemo] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);

  const weeks = useMemo(() => buildCalendarWeeks(year, monthIndex), [year, monthIndex]);
  const notesByDate = useMemo(() => {
    const map = new Map<string, NonNullable<typeof data>[number]>();
    (data ?? []).forEach((note) => map.set(note.date, note));
    return map;
  }, [data]);

  if (error) {
    return (
      <div>
        <PageHeader
          title="カレンダー"
          description="祝日や日付ごとのメモを登録できます。日付をクリックして編集してください。"
        />
        <ErrorState onRetry={reload} />
      </div>
    );
  }

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
    setYear(today.getFullYear());
    setMonthIndex(today.getMonth());
  }

  function openDay(dateIso: string) {
    const existing = notesByDate.get(dateIso);
    setEditingId(existing?.id ?? null);
    setIsHoliday(!!existing?.holidayName);
    setHolidayName(existing?.holidayName ?? '');
    setMemo(existing?.memo ?? '');
    setDialogError(null);
    setEditingDate(dateIso);
  }

  function closeDialog() {
    setEditingDate(null);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!editingDate) return;
    const nextHolidayName = isHoliday ? holidayName.trim() : '';
    const nextMemo = memo.trim();

    try {
      if (!nextHolidayName && !nextMemo) {
        if (editingId) {
          await deleteCalendarNote(editingId);
        }
      } else {
        await upsertCalendarNote({
          id: editingId ?? undefined,
          date: editingDate,
          holidayName: nextHolidayName,
          memo: nextMemo,
        });
      }
      closeDialog();
      reload();
    } catch (err) {
      setDialogError(err instanceof ApiError ? err.message : '保存に失敗しました。');
    }
  }

  async function handleDelete() {
    if (!editingId) return;
    try {
      await deleteCalendarNote(editingId);
      closeDialog();
      reload();
    } catch (err) {
      setDialogError(err instanceof ApiError ? err.message : '削除に失敗しました。');
    }
  }

  const editingHasNote = editingId !== null;

  return (
    <div>
      <PageHeader
        title="カレンダー"
        description="祝日や日付ごとのメモを登録できます。日付をクリックして編集してください。"
      />

      <Card className={styles.card}>
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

        <div className={styles.grid}>
          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              const dayIso = toISODate(day);
              const isCurrentMonth = day.getMonth() === monthIndex;
              const isToday = dayIso === todayIso;
              const note = notesByDate.get(dayIso);
              return (
                <button
                  key={dayIso}
                  type="button"
                  className={`${styles.dayCell} ${isCurrentMonth ? '' : styles.dayCellOutside}`}
                  style={{ gridRow: weekIndex + 1, gridColumn: dayIndex + 1 }}
                  onClick={() => openDay(dayIso)}
                >
                  <span className={`${styles.dayNumber} ${isToday ? styles.dayNumberToday : ''}`}>
                    {day.getDate()}
                  </span>
                  {note?.holidayName && <span className={styles.holidayLabel}>{note.holidayName}</span>}
                  {note?.memo && <span className={styles.memoLabel}>{note.memo}</span>}
                </button>
              );
            }),
          )}
        </div>
      </Card>

      {editingDate && (
        <Modal title={`${editingDate.replace(/-/g, '/')} の設定`} onClose={closeDialog}>
          <form className={styles.form} onSubmit={handleSave}>
            {dialogError && <FormError message={dialogError} />}
            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={isHoliday}
                onChange={(event) => setIsHoliday(event.target.checked)}
              />
              祝日にする
            </label>
            {isHoliday && (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>祝日名</span>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="例：創立記念日"
                  value={holidayName}
                  onChange={(event) => setHolidayName(event.target.value)}
                />
              </label>
            )}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>メモ</span>
              <textarea
                className={styles.textarea}
                placeholder="例：全社会議のため会議室が混み合います"
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                rows={3}
              />
            </label>
            <div className={styles.dialogActions}>
              {editingHasNote && (
                <Button type="button" variant="danger" onClick={handleDelete}>
                  <Trash2 size={14} /> 削除
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={closeDialog}>
                閉じる
              </Button>
              <Button type="submit">保存する</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
