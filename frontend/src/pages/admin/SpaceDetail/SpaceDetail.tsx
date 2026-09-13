import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { Card } from '../../../components/Card/Card';
import { Badge } from '../../../components/Badge/Badge';
import { Button } from '../../../components/Button/Button';
import { Modal } from '../../../components/Modal/Modal';
import { FormError } from '../../../components/FormError/FormError';
import { EmptyState } from '../../../components/EmptyState/EmptyState';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { Pagination } from '../../../components/Pagination/Pagination';
import { useAsync } from '../../../lib/useAsync';
import { ApiError } from '../../../lib/api/client';
import {
  deleteSpace,
  getArea,
  getSpace,
  listAreas,
  listReservations,
  listUsers,
  updateSpace,
} from '../../../lib/api/resources';
import {
  spaceStatusLabel,
  spaceStatusTone,
  reservationStatusLabel,
  reservationStatusTone,
} from '../../../lib/status';
import { formatDateRange } from '../../../lib/date';
import type { SpaceStatus } from '../../../types';
import tableStyles from '../../../components/Table/Table.module.css';
import styles from './SpaceDetail.module.css';

const PAGE_SIZE = 10;
const statusOptions: SpaceStatus[] = ['available', 'in_use', 'reserved', 'closed'];

export function SpaceDetail() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, reload } = useAsync(async () => {
    if (!spaceId) return null;
    const space = await getSpace(spaceId);
    const [area, allAreas, reservations, users] = await Promise.all([
      getArea(space.areaId),
      listAreas(),
      listReservations(),
      listUsers(),
    ]);
    return {
      space,
      area,
      allAreas,
      users,
      spaceReservations: reservations
        .filter((r) => r.spaceId === space.id)
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    };
  }, [spaceId]);

  const [currentPage, setCurrentPage] = useState(1);
  const [dialogMode, setDialogMode] = useState<'edit' | 'delete' | null>(null);
  const [form, setForm] = useState({ name: '', areaId: '', description: '', status: 'available' as SpaceStatus });
  const [dialogError, setDialogError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div>
        <Link to="/admin/areas" className={styles.backLink}>
          ← エリア・スペース一覧に戻る
        </Link>
        <Card className={styles.infoCard}>
          <Skeleton height="16px" width="30%" />
          <Skeleton height="14px" width="70%" />
          <Skeleton height="14px" width="60%" />
        </Card>
        <Card className={styles.scheduleCard}>
          <Skeleton height="200px" width="100%" />
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <Link to="/admin/areas" className={styles.backLink}>
          ← エリア・スペース一覧に戻る
        </Link>
        {error ? <ErrorState onRetry={reload} /> : <PageHeader title="スペースが見つかりません" />}
      </div>
    );
  }

  const { space, area, allAreas, users, spaceReservations } = data;
  const totalPages = Math.max(1, Math.ceil(spaceReservations.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = spaceReservations.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function openEdit() {
    setForm({ name: space.name, areaId: space.areaId, description: space.description, status: space.status });
    setDialogError(null);
    setDialogMode('edit');
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    try {
      await updateSpace(space.id, { ...form, capacity: space.capacity, tags: space.tags });
      setDialogMode(null);
      reload();
    } catch (err) {
      setDialogError(err instanceof ApiError ? err.message : 'スペースの更新に失敗しました。');
    }
  }

  async function handleConfirmDelete() {
    try {
      await deleteSpace(space.id);
      navigate(`/admin/areas/${space.areaId}`);
    } catch (err) {
      setDialogError(err instanceof ApiError ? err.message : 'スペースの削除に失敗しました。');
    }
  }

  return (
    <div>
      <Link to="/admin/areas" className={styles.backLink}>
        ← エリア・スペース一覧に戻る
      </Link>
      <PageHeader
        title={space.name}
        description={area ? `${area.name} ・ ${area.floor}` : undefined}
        actions={
          <>
            <Button variant="secondary" onClick={openEdit}>
              <Pencil size={14} /> 編集
            </Button>
            <Button variant="danger" onClick={() => setDialogMode('delete')}>
              <Trash2 size={14} /> 削除
            </Button>
          </>
        }
      />

      <Card className={styles.infoCard}>
        <dl className={styles.infoGrid}>
          <div>
            <dt>状態</dt>
            <dd>
              <Badge tone={spaceStatusTone[space.status]}>{spaceStatusLabel[space.status]}</Badge>
            </dd>
          </div>
          <div>
            <dt>スペースID</dt>
            <dd>{space.id}</dd>
          </div>
          <div>
            <dt>登録予約数</dt>
            <dd>{spaceReservations.length}件</dd>
          </div>
        </dl>
        <p className={styles.description}>{space.description}</p>
      </Card>

      <Card className={styles.scheduleCard}>
        <h2 className={styles.cardTitle}>利用スケジュール</h2>
        {pageItems.length === 0 ? (
          <EmptyState message="このスペースに登録された利用予定はありません。" />
        ) : (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>利用目的</th>
                  <th>予約者</th>
                  <th>期間</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((reservation) => {
                  const user = users.find((u) => u.id === reservation.userId);
                  return (
                    <tr key={reservation.id}>
                      <td className={styles.nameCell}>
                        <Link to={`/admin/schedules/${reservation.id}`}>{reservation.purpose}</Link>
                      </td>
                      <td>
                        {user ? <Link to={`/admin/users/${user.id}`}>{user.name}</Link> : '不明'}
                      </td>
                      <td>{formatDateRange(reservation.startDate, reservation.endDate)}</td>
                      <td>
                        <Badge tone={reservationStatusTone[reservation.status]}>
                          {reservationStatusLabel[reservation.status]}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {dialogMode === 'edit' && (
        <Modal title="スペースを編集" onClose={() => setDialogMode(null)}>
          <form className={styles.form} onSubmit={handleSave}>
            {dialogError && <FormError message={dialogError} />}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>スペース名</span>
              <input
                type="text"
                className={styles.input}
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>エリア</span>
              <select
                className={styles.input}
                value={form.areaId}
                onChange={(event) => setForm((prev) => ({ ...prev, areaId: event.target.value }))}
                required
              >
                {allAreas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>状態</span>
              <select
                className={styles.input}
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as SpaceStatus }))}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {spaceStatusLabel[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>説明</span>
              <textarea
                className={styles.textarea}
                rows={3}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </label>
            <div className={styles.dialogActions}>
              <Button type="button" variant="ghost" onClick={() => setDialogMode(null)}>
                閉じる
              </Button>
              <Button type="submit">保存する</Button>
            </div>
          </form>
        </Modal>
      )}

      {dialogMode === 'delete' && (
        <Modal title="スペースを削除" onClose={() => setDialogMode(null)}>
          {dialogError && <FormError message={dialogError} />}
          <p className={styles.confirmText}>「{space.name}」を削除します。よろしいですか？</p>
          <div className={styles.dialogActions}>
            <Button variant="danger" onClick={handleConfirmDelete}>
              <Trash2 size={14} /> 削除する
            </Button>
            <Button variant="ghost" onClick={() => setDialogMode(null)}>
              戻る
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
