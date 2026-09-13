import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import { deleteArea, getArea, listSpaces, updateArea } from '../../../lib/api/resources';
import { spaceStatusLabel, spaceStatusTone } from '../../../lib/status';
import tableStyles from '../../../components/Table/Table.module.css';
import styles from './AreaDetail.module.css';

const PAGE_SIZE = 10;

export function AreaDetail() {
  const { areaId } = useParams<{ areaId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, reload } = useAsync(async () => {
    if (!areaId) return null;
    const [area, allSpaces] = await Promise.all([getArea(areaId), listSpaces()]);
    return { area, spacesInArea: allSpaces.filter((s) => s.areaId === area.id) };
  }, [areaId]);

  const [currentPage, setCurrentPage] = useState(1);
  const [dialogMode, setDialogMode] = useState<'edit' | 'delete' | null>(null);
  const [form, setForm] = useState({ name: '', floor: '', description: '' });
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
        <Card className={styles.spacesCard}>
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
        {error ? <ErrorState onRetry={reload} /> : <PageHeader title="エリアが見つかりません" />}
      </div>
    );
  }

  const { area, spacesInArea } = data;
  const totalPages = Math.max(1, Math.ceil(spacesInArea.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = spacesInArea.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function openEdit() {
    setForm({ name: area.name, floor: area.floor, description: area.description });
    setDialogError(null);
    setDialogMode('edit');
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    try {
      await updateArea(area.id, form);
      setDialogMode(null);
      reload();
    } catch (err) {
      setDialogError(err instanceof ApiError ? err.message : 'エリアの更新に失敗しました。');
    }
  }

  async function handleConfirmDelete() {
    try {
      await deleteArea(area.id);
      navigate('/admin/areas');
    } catch (err) {
      setDialogError(err instanceof ApiError ? err.message : 'エリアの削除に失敗しました。');
    }
  }

  return (
    <div>
      <Link to="/admin/areas" className={styles.backLink}>
        ← エリア・スペース一覧に戻る
      </Link>
      <PageHeader
        title={area.name}
        description={area.floor}
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
            <dt>エリアID</dt>
            <dd>{area.id}</dd>
          </div>
          <div>
            <dt>フロア</dt>
            <dd>{area.floor}</dd>
          </div>
          <div>
            <dt>登録スペース数</dt>
            <dd>{spacesInArea.length}件</dd>
          </div>
        </dl>
        <p className={styles.description}>{area.description}</p>
      </Card>

      <Card className={styles.spacesCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>このエリアのスペース</h2>
          <Button variant="secondary">
            <Plus size={14} /> スペースを追加
          </Button>
        </div>
        {pageItems.length === 0 ? (
          <EmptyState message="このエリアに登録されているスペースはありません。" />
        ) : (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>スペースID</th>
                  <th>スペース名</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((space) => (
                  <tr key={space.id}>
                    <td>{space.id}</td>
                    <td className={styles.nameCell}>
                      <Link to={`/admin/spaces/${space.id}`}>{space.name}</Link>
                    </td>
                    <td>
                      <Badge tone={spaceStatusTone[space.status]}>{spaceStatusLabel[space.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {dialogMode === 'edit' && (
        <Modal title="エリアを編集" onClose={() => setDialogMode(null)}>
          <form className={styles.form} onSubmit={handleSave}>
            {dialogError && <FormError message={dialogError} />}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>エリア名</span>
              <input
                type="text"
                className={styles.input}
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>フロア</span>
              <input
                type="text"
                className={styles.input}
                value={form.floor}
                onChange={(event) => setForm((prev) => ({ ...prev, floor: event.target.value }))}
                required
              />
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
        <Modal title="エリアを削除" onClose={() => setDialogMode(null)}>
          {dialogError && <FormError message={dialogError} />}
          <p className={styles.confirmText}>
            「{area.name}」を削除します。このエリアに登録されているスペース（{spacesInArea.length}
            件）も同時に削除されます。よろしいですか？
          </p>
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
