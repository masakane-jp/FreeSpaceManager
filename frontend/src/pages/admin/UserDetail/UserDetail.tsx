import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { KeyRound, Pencil } from 'lucide-react';
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
  getUser,
  listAreas,
  listReservations,
  listSpaces,
  setUserPassword,
  updateUser,
} from '../../../lib/api/resources';
import { reservationStatusLabel, reservationStatusTone } from '../../../lib/status';
import { formatDateRange } from '../../../lib/date';
import type { UserRole, UserStatus } from '../../../types';
import tableStyles from '../../../components/Table/Table.module.css';
import styles from './UserDetail.module.css';

const PAGE_SIZE = 10;

const roleLabel: Record<UserRole, string> = {
  member: '一般メンバー',
  admin: '管理者',
};

const statusLabel: Record<UserStatus, string> = {
  active: '在籍中',
  inactive: '退職',
};

export function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const { data, isLoading, error, reload } = useAsync(async () => {
    if (!userId) return null;
    const [user, reservations, spaces, areas] = await Promise.all([
      getUser(userId),
      listReservations(),
      listSpaces(),
      listAreas(),
    ]);
    return { user, reservations: reservations.filter((r) => r.userId === user.id), spaces, areas };
  }, [userId]);

  const [currentPage, setCurrentPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    employeeNumber: '',
    role: 'member' as UserRole,
    status: 'active' as UserStatus,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div>
        <Link to="/admin/users" className={styles.backLink}>
          ← ユーザー一覧に戻る
        </Link>
        <Card className={styles.infoCard}>
          <Skeleton height="16px" width="30%" />
          <Skeleton height="14px" width="70%" />
          <Skeleton height="14px" width="60%" />
        </Card>
        <Card className={styles.reservationsCard}>
          <Skeleton height="200px" width="100%" />
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <Link to="/admin/users" className={styles.backLink}>
          ← ユーザー一覧に戻る
        </Link>
        {error ? <ErrorState onRetry={reload} /> : <PageHeader title="ユーザーが見つかりません" />}
      </div>
    );
  }

  const { user, reservations, spaces, areas } = data;

  const userReservations = [...reservations].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const totalPages = Math.max(1, Math.ceil(userReservations.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = userReservations.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function openEdit() {
    setForm({
      name: user.name,
      employeeNumber: user.employeeNumber,
      role: user.role,
      status: user.status,
    });
    setFormError(null);
    setIsEditing(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    try {
      await updateUser(user.id, form);
      setIsEditing(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'ユーザーの更新に失敗しました。');
    }
  }

  function openPasswordChange() {
    setPasswordForm({ password: '', confirm: '' });
    setPasswordError(null);
    setIsChangingPassword(true);
  }

  async function handlePasswordSave(event: React.FormEvent) {
    event.preventDefault();
    if (passwordForm.password !== passwordForm.confirm) {
      setPasswordError('確認用パスワードが一致しません。');
      return;
    }
    try {
      await setUserPassword(user.id, passwordForm.password);
      setIsChangingPassword(false);
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'パスワードの変更に失敗しました。');
    }
  }

  return (
    <div>
      <Link to="/admin/users" className={styles.backLink}>
        ← ユーザー一覧に戻る
      </Link>
      <PageHeader
        title={user.name}
        description={`社員番号: ${user.employeeNumber}`}
        actions={
          <>
            {user.role === 'admin' && (
              <Button variant="secondary" onClick={openPasswordChange}>
                <KeyRound size={14} /> パスワード変更
              </Button>
            )}
            <Button variant="secondary" onClick={openEdit}>
              <Pencil size={14} /> 編集
            </Button>
          </>
        }
      />

      <Card className={styles.infoCard}>
        <dl className={styles.infoGrid}>
          <div>
            <dt>権限</dt>
            <dd>
              <Badge tone={user.role === 'admin' ? 'info' : 'neutral'}>{roleLabel[user.role]}</Badge>
            </dd>
          </div>
          <div>
            <dt>状態</dt>
            <dd>
              <Badge tone={user.status === 'active' ? 'success' : 'neutral'}>
                {statusLabel[user.status]}
              </Badge>
            </dd>
          </div>
          <div>
            <dt>ユーザーID</dt>
            <dd>{user.id}</dd>
          </div>
          <div>
            <dt>予約件数</dt>
            <dd>{userReservations.length}件</dd>
          </div>
        </dl>
      </Card>

      <Card className={styles.reservationsCard}>
        <h2 className={styles.cardTitle}>予約履歴</h2>
        {pageItems.length === 0 ? (
          <EmptyState message="このユーザーの予約はありません。" />
        ) : (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>利用目的</th>
                  <th>スペース</th>
                  <th>エリア</th>
                  <th>期間</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((reservation) => {
                  const space = spaces.find((s) => s.id === reservation.spaceId);
                  const area = space ? areas.find((a) => a.id === space.areaId) : undefined;
                  return (
                    <tr key={reservation.id}>
                      <td className={styles.purposeCell}>
                        <Link to={`/admin/schedules/${reservation.id}`}>{reservation.purpose}</Link>
                      </td>
                      <td>
                        {space ? (
                          <Link to={`/admin/spaces/${space.id}`}>{space.name}</Link>
                        ) : (
                          '不明'
                        )}
                      </td>
                      <td>
                        {area ? <Link to={`/admin/areas/${area.id}`}>{area.name}</Link> : '-'}
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

      {isEditing && (
        <Modal title="ユーザーを編集" onClose={() => setIsEditing(false)}>
          <form className={styles.form} onSubmit={handleSave}>
            {formError && <FormError message={formError} />}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>氏名</span>
              <input
                type="text"
                className={styles.input}
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>社員番号</span>
              <input
                type="text"
                className={styles.input}
                value={form.employeeNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, employeeNumber: event.target.value }))}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>権限</span>
              <select
                className={styles.input}
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}
              >
                <option value="member">一般メンバー</option>
                <option value="admin">管理者</option>
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>状態</span>
              <select
                className={styles.input}
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as UserStatus }))}
              >
                <option value="active">在籍中</option>
                <option value="inactive">退職</option>
              </select>
            </label>
            <div className={styles.dialogActions}>
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                閉じる
              </Button>
              <Button type="submit">保存する</Button>
            </div>
          </form>
        </Modal>
      )}

      {isChangingPassword && (
        <Modal title="パスワードを変更" onClose={() => setIsChangingPassword(false)}>
          <form className={styles.form} onSubmit={handlePasswordSave}>
            {passwordError && <FormError message={passwordError} />}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>新しいパスワード</span>
              <input
                type="password"
                className={styles.input}
                value={passwordForm.password}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, password: event.target.value }))
                }
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>新しいパスワード（確認用）</span>
              <input
                type="password"
                className={styles.input}
                value={passwordForm.confirm}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, confirm: event.target.value }))
                }
                required
              />
            </label>
            <div className={styles.dialogActions}>
              <Button type="button" variant="ghost" onClick={() => setIsChangingPassword(false)}>
                閉じる
              </Button>
              <Button type="submit">変更する</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
