import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { Card } from '../../../components/Card/Card';
import { Badge } from '../../../components/Badge/Badge';
import { Button } from '../../../components/Button/Button';
import { Modal } from '../../../components/Modal/Modal';
import { FormError } from '../../../components/FormError/FormError';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { useAsync } from '../../../lib/useAsync';
import { ApiError } from '../../../lib/api/client';
import {
  cancelReservation,
  getArea,
  getReservationHistory,
  getSpace,
  getUser,
  listReservations,
} from '../../../lib/api/resources';
import { reservationStatusLabel, reservationStatusTone } from '../../../lib/status';
import { formatDateRange } from '../../../lib/date';
import type { ReservationHistoryAction } from '../../../types';
import styles from './ScheduleDetail.module.css';

const historyActionLabel: Record<ReservationHistoryAction, string> = {
  created: '作成',
  updated: '編集',
  cancelled: 'キャンセル',
};

const historyActionTone: Record<ReservationHistoryAction, 'info' | 'warning' | 'danger'> = {
  created: 'info',
  updated: 'warning',
  cancelled: 'danger',
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduleDetail() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const { data, isLoading, error, reload } = useAsync(async () => {
    if (!reservationId) return null;
    const reservations = await listReservations();
    const reservation = reservations.find((r) => r.id === reservationId);
    if (!reservation) return null;
    const space = await getSpace(reservation.spaceId);
    const [area, user, history] = await Promise.all([
      getArea(space.areaId),
      getUser(reservation.userId),
      getReservationHistory(reservationId),
    ]);
    return { reservation, space, area, user, history };
  }, [reservationId]);

  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div>
        <Link to="/admin/schedules" className={styles.backLink}>
          ← スケジュール一覧に戻る
        </Link>
        <Card className={styles.infoCard}>
          <Skeleton height="16px" width="30%" />
          <Skeleton height="14px" width="70%" />
          <Skeleton height="14px" width="60%" />
        </Card>
        <Card className={styles.historyCard}>
          <Skeleton height="80px" width="100%" />
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <Link to="/admin/schedules" className={styles.backLink}>
          ← スケジュール一覧に戻る
        </Link>
        {error ? <ErrorState onRetry={reload} /> : <PageHeader title="予約が見つかりません" />}
      </div>
    );
  }

  const { reservation, space, area, user, history } = data;
  const cancellable = reservation.status === 'upcoming' || reservation.status === 'active';

  async function handleConfirmCancel() {
    try {
      await cancelReservation(reservation.id);
      setIsConfirmingCancel(false);
      reload();
    } catch (err) {
      setDialogError(err instanceof ApiError ? err.message : '予約のキャンセルに失敗しました。');
    }
  }

  return (
    <div>
      <Link to="/admin/schedules" className={styles.backLink}>
        ← スケジュール一覧に戻る
      </Link>
      <PageHeader
        title={reservation.purpose}
        description={space ? `${space.name} ・ ${area?.name ?? ''}` : undefined}
        actions={
          cancellable && (
            <Button variant="danger" onClick={() => setIsConfirmingCancel(true)}>
              <Trash2 size={14} /> キャンセル
            </Button>
          )
        }
      />

      <Card className={styles.infoCard}>
        <dl className={styles.infoGrid}>
          <div>
            <dt>状態</dt>
            <dd>
              <Badge tone={reservationStatusTone[reservation.status]}>
                {reservationStatusLabel[reservation.status]}
              </Badge>
            </dd>
          </div>
          <div>
            <dt>スペース</dt>
            <dd>{space ? <Link to={`/admin/spaces/${space.id}`}>{space.name}</Link> : '不明'}</dd>
          </div>
          <div>
            <dt>エリア</dt>
            <dd>{area ? <Link to={`/admin/areas/${area.id}`}>{area.name}</Link> : '-'}</dd>
          </div>
          <div>
            <dt>予約者</dt>
            <dd>{user ? <Link to={`/admin/users/${user.id}`}>{user.name}</Link> : '不明'}</dd>
          </div>
          <div>
            <dt>期間</dt>
            <dd>{formatDateRange(reservation.startDate, reservation.endDate)}</dd>
          </div>
          <div>
            <dt>予約登録日</dt>
            <dd>{reservation.createdAt}</dd>
          </div>
        </dl>
      </Card>

      <Card className={styles.historyCard}>
        <h2 className={styles.cardTitle}>変更履歴</h2>
        {history.length === 0 ? (
          <p className={styles.historyEmpty}>履歴がありません。</p>
        ) : (
          <ul className={styles.historyList}>
            {history.map((entry) => (
              <li key={entry.id} className={styles.historyItem}>
                <Badge tone={historyActionTone[entry.action]}>{historyActionLabel[entry.action]}</Badge>
                <span className={styles.historyUser}>{entry.userName}</span>
                <span className={styles.historyDate}>{formatDateTime(entry.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {isConfirmingCancel && (
        <Modal title="予約のキャンセル" onClose={() => setIsConfirmingCancel(false)}>
          {dialogError && <FormError message={dialogError} />}
          <p className={styles.confirmText}>以下の予約を管理者権限でキャンセルします。よろしいですか？</p>
          <dl className={styles.dialogGrid}>
            <div>
              <dt>スペース</dt>
              <dd>{space?.name ?? '不明'}</dd>
            </div>
            <div>
              <dt>予約者</dt>
              <dd>{user?.name ?? '不明'}</dd>
            </div>
            <div>
              <dt>期間</dt>
              <dd>{formatDateRange(reservation.startDate, reservation.endDate)}</dd>
            </div>
          </dl>
          <div className={styles.dialogActions}>
            <Button variant="danger" onClick={handleConfirmCancel}>
              <Trash2 size={14} /> キャンセルする
            </Button>
            <Button variant="ghost" onClick={() => setIsConfirmingCancel(false)}>
              戻る
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
