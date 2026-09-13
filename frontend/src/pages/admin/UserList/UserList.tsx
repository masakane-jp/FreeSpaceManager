import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Plus, Upload } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { Card } from '../../../components/Card/Card';
import { Badge } from '../../../components/Badge/Badge';
import { Button } from '../../../components/Button/Button';
import { Modal } from '../../../components/Modal/Modal';
import { FormError } from '../../../components/FormError/FormError';
import { EmptyState } from '../../../components/EmptyState/EmptyState';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { SkeletonTable } from '../../../components/Skeleton/SkeletonTable';
import { Pagination } from '../../../components/Pagination/Pagination';
import { useAsync } from '../../../lib/useAsync';
import { ApiError } from '../../../lib/api/client';
import {
  createUser,
  exportUsersCsv,
  importUsersCsv,
  listReservations,
  listUsers,
  type ImportUsersCsvResult,
} from '../../../lib/api/resources';
import type { UserRole, UserStatus } from '../../../types';
import tableStyles from '../../../components/Table/Table.module.css';
import styles from './UserList.module.css';

const PAGE_SIZE = 10;

const roleLabel: Record<UserRole, string> = {
  member: '一般メンバー',
  admin: '管理者',
};

const statusLabel: Record<UserStatus, string> = {
  active: '在籍中',
  inactive: '退職',
};

export function UserList() {
  const { data, isLoading, error, reload } = useAsync(
    () => Promise.all([listUsers(), listReservations()]),
    [],
  );

  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', employeeNumber: '', role: 'member' as UserRole });
  const [formError, setFormError] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportUsersCsvResult | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const usersState = data?.[0] ?? [];
  const reservations = data?.[1] ?? [];

  const filtered = useMemo(() => {
    return usersState.filter((user) => {
      const matchesKeyword =
        keyword.trim() === '' || user.name.includes(keyword) || user.employeeNumber.includes(keyword);
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesKeyword && matchesRole && matchesStatus;
    });
  }, [usersState, keyword, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleKeywordChange(value: string) {
    setKeyword(value);
    setCurrentPage(1);
  }

  function handleRoleFilterChange(value: UserRole | 'all') {
    setRoleFilter(value);
    setCurrentPage(1);
  }

  function handleStatusFilterChange(value: UserStatus | 'all') {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function openAdd() {
    setForm({ name: '', employeeNumber: '', role: 'member' });
    setFormError(null);
    setIsAdding(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createUser(form);
      setIsAdding(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'ユーザーの追加に失敗しました。');
    }
  }

  async function handleExportCsv() {
    setCsvError(null);
    try {
      const blob = await exportUsersCsv();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'users.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setCsvError(err instanceof ApiError ? err.message : 'CSVのエクスポートに失敗しました。');
    }
  }

  async function handleImportCsvFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setCsvError(null);
    try {
      const result = await importUsersCsv(file);
      setImportResult(result);
      reload();
    } catch (err) {
      setCsvError(err instanceof ApiError ? err.message : 'CSVのインポートに失敗しました。');
    }
  }

  return (
    <div>
      <PageHeader
        title="ユーザー一覧"
        description="社内メンバーの登録状況と権限を管理します。"
        actions={
          <>
            <Button variant="secondary" onClick={handleExportCsv}>
              <Download size={14} /> CSVエクスポート
            </Button>
            <Button variant="secondary" onClick={() => csvInputRef.current?.click()}>
              <Upload size={14} /> CSVインポート
            </Button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCsvFileChange}
              className={styles.hiddenFileInput}
            />
            <Button variant="primary" onClick={openAdd}>
              <Plus size={14} /> ユーザーを追加
            </Button>
          </>
        }
      />
      {csvError && <FormError message={csvError} />}

      <div className={styles.filters}>
        <input
          className={styles.search}
          type="text"
          placeholder="氏名・社員番号で検索"
          value={keyword}
          onChange={(event) => handleKeywordChange(event.target.value)}
        />
        <select
          className={styles.select}
          value={roleFilter}
          onChange={(event) => handleRoleFilterChange(event.target.value as UserRole | 'all')}
        >
          <option value="all">すべての権限</option>
          <option value="member">一般メンバー</option>
          <option value="admin">管理者</option>
        </select>
        <select
          className={styles.select}
          value={statusFilter}
          onChange={(event) => handleStatusFilterChange(event.target.value as UserStatus | 'all')}
        >
          <option value="all">すべての状態</option>
          <option value="active">在籍中</option>
          <option value="inactive">退職</option>
        </select>
      </div>

      <Card>
        {isLoading ? (
          <SkeletonTable columns={5} />
        ) : error || !data ? (
          <ErrorState onRetry={reload} />
        ) : pageItems.length === 0 ? (
          <EmptyState message="該当するユーザーが見つかりませんでした。" />
        ) : (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>氏名</th>
                  <th>社員番号</th>
                  <th>権限</th>
                  <th>状態</th>
                  <th>予約件数</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((user) => (
                  <tr key={user.id}>
                    <td className={styles.nameCell}>
                      <Link to={`/admin/users/${user.id}`}>{user.name}</Link>
                    </td>
                    <td>{user.employeeNumber}</td>
                    <td>
                      <Badge tone={user.role === 'admin' ? 'info' : 'neutral'}>{roleLabel[user.role]}</Badge>
                    </td>
                    <td>
                      <Badge tone={user.status === 'active' ? 'success' : 'neutral'}>
                        {statusLabel[user.status]}
                      </Badge>
                    </td>
                    <td>{reservations.filter((r) => r.userId === user.id).length}件</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!isLoading && !error && (
        <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {isAdding && (
        <Modal title="ユーザーを追加" onClose={() => setIsAdding(false)}>
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
            <div className={styles.dialogActions}>
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>
                閉じる
              </Button>
              <Button type="submit">追加する</Button>
            </div>
          </form>
        </Modal>
      )}

      {importResult && (
        <Modal title="CSVインポート結果" onClose={() => setImportResult(null)}>
          <div className={styles.importSummary}>
            <span>新規登録: {importResult.created}件</span>
            <span>更新: {importResult.updated}件</span>
            <span>エラー: {importResult.errors.length}件</span>
          </div>
          {importResult.errors.length > 0 && (
            <ul className={styles.importErrorList}>
              {importResult.errors.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          )}
          <div className={styles.dialogActions}>
            <Button variant="ghost" onClick={() => setImportResult(null)}>
              閉じる
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
