import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { Card } from '../../../components/Card/Card';
import { Badge } from '../../../components/Badge/Badge';
import { Button } from '../../../components/Button/Button';
import { Modal } from '../../../components/Modal/Modal';
import { FormError } from '../../../components/FormError/FormError';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { MonthCalendar } from '../../../components/MonthCalendar/MonthCalendar';
import type { CalendarEvent } from '../../../components/MonthCalendar/MonthCalendar';
import { useAuth } from '../../../lib/AuthContext';
import { useAsync } from '../../../lib/useAsync';
import { ApiError } from '../../../lib/api/client';
import {
  cancelReservation,
  createReservation,
  getArea,
  getSpace,
  listReservations,
  listUsers,
  updateReservation,
} from '../../../lib/api/resources';
import { spaceStatusLabel, spaceStatusTone, reservationStatusLabel, reservationStatusTone } from '../../../lib/status';
import { formatDateRange, toISODate } from '../../../lib/date';
import styles from './SpaceDetail.module.css';

type DialogMode = 'view' | 'edit' | 'confirm-cancel';

export function SpaceDetail() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const { user } = useAuth();
  const today = toISODate(new Date());

  const { data, isLoading, error, reload } = useAsync(async () => {
    if (!spaceId) return null;
    const space = await getSpace(spaceId);
    const [area, allReservations, users] = await Promise.all([
      getArea(space.areaId),
      listReservations(),
      listUsers(),
    ]);
    const reservations = allReservations
      .filter((r) => r.spaceId === space.id && r.status !== 'cancelled')
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    return { space, area, reservations, users };
  }, [spaceId]);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>('view');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);

  if (!user) return null;

  if (isLoading) {
    return (
      <div>
        <Link to="/areas" className={styles.backLink}>
          ← エリア一覧に戻る
        </Link>
        <div className={styles.layout}>
          <div className={styles.main}>
            <Card className={styles.infoCard}>
              <Skeleton height="16px" width="30%" />
              <Skeleton height="14px" width="70%" />
              <Skeleton height="14px" width="60%" />
            </Card>
            <Card className={styles.scheduleCard}>
              <Skeleton height="300px" width="100%" />
            </Card>
          </div>
          <Card className={styles.formCard}>
            <Skeleton height="220px" width="100%" />
          </Card>
        </div>
      </div>
    );
  }

  if (error || !data || !data.space) {
    return (
      <div>
        <Link to="/areas" className={styles.backLink}>
          ← エリア一覧に戻る
        </Link>
        {error ? (
          <ErrorState onRetry={reload} />
        ) : (
          <PageHeader title="スペースが見つかりません" />
        )}
      </div>
    );
  }

  const { space, area, reservations, users } = data;

  const calendarEvents: CalendarEvent[] = reservations.map((reservation) => ({
    id: reservation.id,
    startDate: reservation.startDate,
    endDate: reservation.endDate,
    label: reservation.purpose,
    tone: reservationStatusTone[reservation.status],
  }));

  const selectedReservation = reservations.find((r) => r.id === selectedReservationId) ?? null;
  const selectedUser = selectedReservation ? users.find((u) => u.id === selectedReservation.userId) : undefined;
  const canManageSelected =
    !!selectedReservation && selectedReservation.userId === user.id && selectedReservation.status === 'upcoming';

  const currentReservation = reservations.find((r) => r.startDate <= today && r.endDate >= today);
  const nextReservation = reservations.find((r) => r.startDate > today);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!startDate || !endDate) return;
    setSubmitError(null);
    try {
      await createReservation({
        spaceId: space.id,
        userId: user!.id,
        purpose: purpose || '利用予約',
        startDate,
        endDate,
      });
      setStartDate(today);
      setEndDate('');
      setPurpose('');
      setSubmitted(true);
      reload();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : '予約の登録に失敗しました。');
    }
  }

  function handleEventClick(event: CalendarEvent) {
    setSelectedReservationId(event.id);
    setDialogMode('view');
    setDialogError(null);
  }

  function handleCloseDialog() {
    setSelectedReservationId(null);
    setDialogMode('view');
    setDialogError(null);
  }

  function startEdit() {
    if (!selectedReservation) return;
    setEditStartDate(selectedReservation.startDate);
    setEditEndDate(selectedReservation.endDate);
    setEditPurpose(selectedReservation.purpose);
    setDialogMode('edit');
  }

  async function handleSaveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedReservationId || !editStartDate || !editEndDate) return;
    setDialogError(null);
    try {
      await updateReservation(selectedReservationId, {
        startDate: editStartDate,
        endDate: editEndDate,
        purpose: editPurpose,
      });
      handleCloseDialog();
      reload();
    } catch (err) {
      setDialogError(err instanceof ApiError ? err.message : '予約の更新に失敗しました。');
    }
  }

  async function handleConfirmCancel() {
    if (!selectedReservationId) return;
    setDialogError(null);
    try {
      await cancelReservation(selectedReservationId);
      handleCloseDialog();
      reload();
    } catch (err) {
      setDialogError(err instanceof ApiError ? err.message : '予約のキャンセルに失敗しました。');
    }
  }

  const dialogTitle =
    dialogMode === 'edit' ? '予約を編集' : dialogMode === 'confirm-cancel' ? '予約のキャンセル' : '予約の詳細';

  return (
    <div>
      <Link to="/areas" className={styles.backLink}>
        ← エリア一覧に戻る
      </Link>
      <PageHeader
        title={space.name}
        description={area ? `${area.name} ・ ${area.floor}` : undefined}
      />

      <div className={styles.layout}>
        <div className={styles.main}>
          <Card className={styles.infoCard}>
            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>ステータス</span>
              <Badge tone={spaceStatusTone[space.status]}>{spaceStatusLabel[space.status]}</Badge>
            </div>
            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>現在の予約</span>
              {currentReservation ? (
                <div className={styles.statusDetail}>
                  <span className={styles.statusPeriod}>
                    {formatDateRange(currentReservation.startDate, currentReservation.endDate)}
                  </span>
                  <span className={styles.statusPurpose}>{currentReservation.purpose}</span>
                </div>
              ) : (
                <span className={styles.statusEmpty}>現在の予約はありません</span>
              )}
            </div>
            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>次の予約</span>
              {nextReservation ? (
                <div className={styles.statusDetail}>
                  <span className={styles.statusPeriod}>
                    {formatDateRange(nextReservation.startDate, nextReservation.endDate)}
                  </span>
                  <span className={styles.statusPurpose}>{nextReservation.purpose}</span>
                </div>
              ) : (
                <span className={styles.statusEmpty}>次の予約はありません</span>
              )}
            </div>
          </Card>

          <Card className={styles.scheduleCard}>
            <h2 className={styles.cardTitle}>利用予定・利用履歴</h2>
            <MonthCalendar
              events={calendarEvents}
              onEventClick={handleEventClick}
              initialDate={today}
              todayDate={today}
            />
          </Card>
        </div>

        <Card className={styles.formCard}>
          <h2 className={styles.cardTitle}>利用期間を登録</h2>
          {submitted && <p className={styles.successMessage}>予約を登録しました。予約一覧から確認できます。</p>}
          {submitError && <FormError message={submitError} />}
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>開始日</span>
              <input
                type="date"
                className={styles.input}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                min={today}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>終了日</span>
              <input
                type="date"
                className={styles.input}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                min={startDate || undefined}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>利用目的</span>
              <input
                type="text"
                className={styles.input}
                placeholder="例：チーム定例会議"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
              />
            </label>
            <Button type="submit" fullWidth disabled={space.status === 'closed'}>
              {space.status === 'closed' ? '現在利用停止中です' : 'この期間で予約する'}
            </Button>
          </form>
        </Card>
      </div>

      {selectedReservation && (
        <Modal
          title={dialogTitle}
          onClose={handleCloseDialog}
          headerActions={
            dialogMode === 'view' && canManageSelected ? (
              <div className={styles.headerIconActions}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={startEdit}
                  title="編集"
                  aria-label="編集"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                  onClick={() => setDialogMode('confirm-cancel')}
                  title="キャンセル"
                  aria-label="キャンセル"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : undefined
          }
        >
          {dialogMode === 'view' && (
            <>
              <dl className={styles.dialogGrid}>
                <div>
                  <dt>スペース</dt>
                  <dd>{space.name}</dd>
                </div>
                <div>
                  <dt>利用目的</dt>
                  <dd>{selectedReservation.purpose}</dd>
                </div>
                <div>
                  <dt>予約者</dt>
                  <dd>{selectedUser ? selectedUser.name : '利用者不明'}</dd>
                </div>
                <div>
                  <dt>期間</dt>
                  <dd>{formatDateRange(selectedReservation.startDate, selectedReservation.endDate)}</dd>
                </div>
                <div>
                  <dt>状態</dt>
                  <dd>
                    <Badge tone={reservationStatusTone[selectedReservation.status]}>
                      {reservationStatusLabel[selectedReservation.status]}
                    </Badge>
                  </dd>
                </div>
              </dl>
              <div className={styles.dialogActions}>
                <Button variant="ghost" onClick={handleCloseDialog}>
                  閉じる
                </Button>
              </div>
            </>
          )}

          {dialogMode === 'edit' && (
            <form className={styles.form} onSubmit={handleSaveEdit}>
              {dialogError && <FormError message={dialogError} />}
              <label className={styles.field}>
                <span className={styles.fieldLabel}>開始日</span>
                <input
                  type="date"
                  className={styles.input}
                  value={editStartDate}
                  onChange={(event) => setEditStartDate(event.target.value)}
                  min={today}
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>終了日</span>
                <input
                  type="date"
                  className={styles.input}
                  value={editEndDate}
                  onChange={(event) => setEditEndDate(event.target.value)}
                  min={editStartDate || undefined}
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>利用目的</span>
                <input
                  type="text"
                  className={styles.input}
                  value={editPurpose}
                  onChange={(event) => setEditPurpose(event.target.value)}
                />
              </label>
              <div className={styles.dialogActions}>
                <Button type="button" variant="ghost" onClick={() => setDialogMode('view')}>
                  戻る
                </Button>
                <Button type="submit">保存する</Button>
              </div>
            </form>
          )}

          {dialogMode === 'confirm-cancel' && (
            <>
              {dialogError && <FormError message={dialogError} />}
              <p className={styles.confirmText}>以下の予約をキャンセルします。よろしいですか？</p>
              <dl className={styles.dialogGrid}>
                <div>
                  <dt>スペース</dt>
                  <dd>{space.name}</dd>
                </div>
                <div>
                  <dt>期間</dt>
                  <dd>{formatDateRange(selectedReservation.startDate, selectedReservation.endDate)}</dd>
                </div>
                <div>
                  <dt>利用目的</dt>
                  <dd>{selectedReservation.purpose}</dd>
                </div>
              </dl>
              <div className={styles.dialogActions}>
                <Button variant="danger" onClick={handleConfirmCancel}>
                  キャンセルする
                </Button>
                <Button variant="ghost" onClick={() => setDialogMode('view')}>
                  戻る
                </Button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
