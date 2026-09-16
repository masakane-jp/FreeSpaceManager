import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { Card } from '../../../components/Card/Card';
import { Badge } from '../../../components/Badge/Badge';
import { Button } from '../../../components/Button/Button';
import { EmptyState } from '../../../components/EmptyState/EmptyState';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { SkeletonTable } from '../../../components/Skeleton/SkeletonTable';
import { Pagination } from '../../../components/Pagination/Pagination';
import { Modal } from '../../../components/Modal/Modal';
import { FormError } from '../../../components/FormError/FormError';
import { useAuth } from '../../../lib/AuthContext';
import { useAsync } from '../../../lib/useAsync';
import { ApiError } from '../../../lib/api/client';
import { cancelReservation, listAreas, listReservations, listSpaces, updateReservation } from '../../../lib/api/resources';
import { reservationStatusLabel, reservationStatusTone } from '../../../lib/status';
import { formatDateRange, toISODate } from '../../../lib/date';
import type { Reservation, ReservationStatus } from '../../../types';
import tableStyles from '../../../components/Table/Table.module.css';
import styles from './Reservations.module.css';

const PAGE_SIZE = 10;

const tabs: Array<{ value: ReservationStatus | 'all'; label: string }> = [
  { value: 'all', label: 'すべて' },
  { value: 'upcoming', label: reservationStatusLabel.upcoming },
  { value: 'active', label: reservationStatusLabel.active },
  { value: 'ended', label: reservationStatusLabel.ended },
  { value: 'cancelled', label: reservationStatusLabel.cancelled },
];

export function Reservations() {
  const { user } = useAuth();
  const today = toISODate(new Date());
  const { data, isLoading, error, reload } = useAsync(
    () => Promise.all([listReservations(), listSpaces(), listAreas()]),
    [],
  );

  const [activeTab, setActiveTab] = useState<ReservationStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);

  if (!user) return null;

  const [reservations, spaces, areas] = data ?? [[], [], []];

  const allReservations = reservations
    .filter((r) => r.userId === user.id)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const filtered = allReservations.filter(
    (reservation) => activeTab === 'all' || reservation.status === activeTab,
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const editingReservation = allReservations.find((r) => r.id === editingId) ?? null;
  const cancelingReservation = allReservations.find((r) => r.id === cancelingId) ?? null;
  const cancelingSpace = cancelingReservation
    ? spaces.find((s) => s.id === cancelingReservation.spaceId)
    : undefined;

  function handleTabChange(tab: ReservationStatus | 'all') {
    setActiveTab(tab);
    setCurrentPage(1);
  }

  function openEdit(reservation: Reservation) {
    setEditingId(reservation.id);
    setEditStartDate(reservation.startDate);
    setEditEndDate(reservation.endDate);
    setEditPurpose(reservation.purpose);
    setDialogError(null);
  }

  async function handleSaveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId || !editStartDate || !editEndDate) return;
    try {
      await updateReservation(editingId, {
        startDate: editStartDate,
        endDate: editEndDate,
        purpose: editPurpose,
      });
      setEditingId(null);
      reload();
    } catch (err) {
      setDialogError(err instanceof ApiError ? err.message : '予約の更新に失敗しました。');
    }
  }

  async function handleConfirmCancel() {
    if (!cancelingId) return;
    try {
      await cancelReservation(cancelingId);
      setCancelingId(null);
      reload();
    } catch (err) {
      setDialogError(err instanceof ApiError ? err.message : '予約のキャンセルに失敗しました。');
    }
  }

  return (
    <div>
      <PageHeader
        title="予約一覧"
        description={`${user.name} さんが予約したスペースの一覧です。`}
      />

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`${styles.tab} ${activeTab === tab.value ? styles.tabActive : ''}`}
            onClick={() => handleTabChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <SkeletonTable columns={6} />
        ) : error || !data ? (
          <ErrorState onRetry={reload} />
        ) : pageItems.length === 0 ? (
          <EmptyState message="該当する予約はありません。" />
        ) : (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>スペース</th>
                  <th>エリア</th>
                  <th>期間</th>
                  <th>利用目的</th>
                  <th>状態</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((reservation) => {
                  const space = spaces.find((s) => s.id === reservation.spaceId);
                  const area = space ? areas.find((a) => a.id === space.areaId) : undefined;
                  const editable = reservation.status === 'upcoming';
                  return (
                    <tr key={reservation.id}>
                      <td>
                        {space ? <Link to={`/spaces/${space.id}`}>{space.name}</Link> : '不明'}
                      </td>
                      <td>{area?.name ?? '-'}</td>
                      <td>{formatDateRange(reservation.startDate, reservation.endDate)}</td>
                      <td>{reservation.purpose}</td>
                      <td>
                        <Badge tone={reservationStatusTone[reservation.status]}>
                          {reservationStatusLabel[reservation.status]}
                        </Badge>
                      </td>
                      <td>
                        {editable && (
                          <div className={styles.rowActions}>
                            <Button variant="secondary" onClick={() => openEdit(reservation)}>
                              <Pencil size={14} /> 編集
                            </Button>
                            <Button variant="danger" onClick={() => setCancelingId(reservation.id)}>
                              <Trash2 size={14} /> キャンセル
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!isLoading && !error && (
        <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {editingReservation && (
        <Modal title="予約を編集" onClose={() => setEditingId(null)}>
          <form className={styles.editForm} onSubmit={handleSaveEdit}>
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
              <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>
                閉じる
              </Button>
              <Button type="submit">保存する</Button>
            </div>
          </form>
        </Modal>
      )}

      {cancelingReservation && (
        <Modal title="予約のキャンセル" onClose={() => setCancelingId(null)}>
          {dialogError && <FormError message={dialogError} />}
          <p className={styles.confirmText}>以下の予約をキャンセルします。よろしいですか？</p>
          <dl className={styles.dialogGrid}>
            <div>
              <dt>スペース</dt>
              <dd>{cancelingSpace?.name ?? '不明'}</dd>
            </div>
            <div>
              <dt>期間</dt>
              <dd>{formatDateRange(cancelingReservation.startDate, cancelingReservation.endDate)}</dd>
            </div>
            <div>
              <dt>利用目的</dt>
              <dd>{cancelingReservation.purpose}</dd>
            </div>
          </dl>
          <div className={styles.dialogActions}>
            <Button variant="danger" onClick={handleConfirmCancel}>
              キャンセルする
            </Button>
            <Button variant="ghost" onClick={() => setCancelingId(null)}>
              戻る
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
