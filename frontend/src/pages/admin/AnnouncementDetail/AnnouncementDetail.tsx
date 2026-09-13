import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
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
import { deleteAnnouncement, getAnnouncement, updateAnnouncement } from '../../../lib/api/resources';
import { announcementCategoryTone } from '../../../lib/announcement';
import { formatDate, formatDateRange } from '../../../lib/date';
import type { AnnouncementCategory } from '../../../types';
import styles from './AnnouncementDetail.module.css';

const categoryOptions: AnnouncementCategory[] = ['お知らせ', 'メンテナンス', 'イベント', '運用変更'];

export function AnnouncementDetail() {
  const { announcementId } = useParams<{ announcementId: string }>();
  const navigate = useNavigate();
  const { data: announcement, isLoading, error, reload } = useAsync(
    () => (announcementId ? getAnnouncement(announcementId) : Promise.resolve(undefined)),
    [announcementId],
  );

  const [dialogMode, setDialogMode] = useState<'edit' | 'delete' | null>(null);
  const [form, setForm] = useState({
    title: '',
    body: '',
    category: 'お知らせ' as AnnouncementCategory,
    publishedAt: '',
    bannerEnabled: false,
    bannerStartDate: '',
    bannerEndDate: '',
  });
  const [dialogError, setDialogError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div>
        <Link to="/admin/announcements" className={styles.backLink}>
          ← お知らせ一覧に戻る
        </Link>
        <Card className={styles.infoCard}>
          <Skeleton height="16px" width="20%" />
          <Skeleton height="14px" width="70%" />
          <Skeleton height="14px" width="60%" />
        </Card>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div>
        <Link to="/admin/announcements" className={styles.backLink}>
          ← お知らせ一覧に戻る
        </Link>
        {error ? <ErrorState onRetry={reload} /> : <PageHeader title="お知らせが見つかりません" />}
      </div>
    );
  }

  function openEdit() {
    if (!announcement) return;
    setForm({
      title: announcement.title,
      body: announcement.body,
      category: announcement.category,
      publishedAt: announcement.publishedAt,
      bannerEnabled: announcement.bannerEnabled,
      bannerStartDate: announcement.bannerStartDate ?? '',
      bannerEndDate: announcement.bannerEndDate ?? '',
    });
    setDialogError(null);
    setDialogMode('edit');
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!announcement) return;
    try {
      await updateAnnouncement(announcement.id, form);
      setDialogMode(null);
      reload();
    } catch (err) {
      setDialogError(err instanceof ApiError ? err.message : 'お知らせの更新に失敗しました。');
    }
  }

  async function handleConfirmDelete() {
    if (!announcement) return;
    try {
      await deleteAnnouncement(announcement.id);
      navigate('/admin/announcements');
    } catch (err) {
      setDialogError(err instanceof ApiError ? err.message : 'お知らせの削除に失敗しました。');
    }
  }

  return (
    <div>
      <Link to="/admin/announcements" className={styles.backLink}>
        ← お知らせ一覧に戻る
      </Link>
      <PageHeader
        title={announcement.title}
        description={`公開日: ${formatDate(announcement.publishedAt)}`}
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
            <dt>カテゴリ</dt>
            <dd>
              <Badge tone={announcementCategoryTone[announcement.category]}>{announcement.category}</Badge>
            </dd>
          </div>
          <div>
            <dt>公開日</dt>
            <dd>{formatDate(announcement.publishedAt)}</dd>
          </div>
          <div>
            <dt>緊急バナー表示</dt>
            <dd>
              {announcement.bannerEnabled ? <Badge tone="danger">表示中</Badge> : <Badge tone="neutral">なし</Badge>}
            </dd>
          </div>
          {announcement.bannerEnabled && (
            <div>
              <dt>バナー表示期間</dt>
              <dd>
                {announcement.bannerStartDate
                  ? announcement.bannerEndDate
                    ? formatDateRange(announcement.bannerStartDate, announcement.bannerEndDate)
                    : `${formatDate(announcement.bannerStartDate)} 〜 無期限`
                  : '未設定'}
              </dd>
            </div>
          )}
        </dl>
        <p className={styles.body}>{announcement.body}</p>
      </Card>

      {dialogMode === 'edit' && (
        <Modal title="お知らせを編集" onClose={() => setDialogMode(null)}>
          <form className={styles.form} onSubmit={handleSave}>
            {dialogError && <FormError message={dialogError} />}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>タイトル</span>
              <input
                type="text"
                className={styles.input}
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>本文</span>
              <textarea
                className={styles.textarea}
                rows={4}
                value={form.body}
                onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>カテゴリ</span>
              <select
                className={styles.input}
                value={form.category}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, category: event.target.value as AnnouncementCategory }))
                }
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>公開日</span>
              <input
                type="date"
                className={styles.input}
                value={form.publishedAt}
                onChange={(event) => setForm((prev) => ({ ...prev, publishedAt: event.target.value }))}
                required
              />
            </label>
            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={form.bannerEnabled}
                onChange={(event) => setForm((prev) => ({ ...prev, bannerEnabled: event.target.checked }))}
              />
              緊急バナーに表示する
            </label>
            {form.bannerEnabled && (
              <>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>バナー表示開始日</span>
                  <input
                    type="date"
                    className={styles.input}
                    value={form.bannerStartDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, bannerStartDate: event.target.value }))}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>バナー表示終了日（未入力で無期限）</span>
                  <input
                    type="date"
                    className={styles.input}
                    value={form.bannerEndDate}
                    min={form.bannerStartDate || undefined}
                    onChange={(event) => setForm((prev) => ({ ...prev, bannerEndDate: event.target.value }))}
                  />
                </label>
              </>
            )}
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
        <Modal title="お知らせを削除" onClose={() => setDialogMode(null)}>
          {dialogError && <FormError message={dialogError} />}
          <p className={styles.confirmText}>「{announcement.title}」を削除します。よろしいですか？</p>
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
