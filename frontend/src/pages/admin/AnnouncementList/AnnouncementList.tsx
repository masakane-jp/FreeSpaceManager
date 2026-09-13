import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { Card } from '../../../components/Card/Card';
import { Badge } from '../../../components/Badge/Badge';
import { Button } from '../../../components/Button/Button';
import { Modal } from '../../../components/Modal/Modal';
import { FormError } from '../../../components/FormError/FormError';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { SkeletonTable } from '../../../components/Skeleton/SkeletonTable';
import { Pagination } from '../../../components/Pagination/Pagination';
import { useAsync } from '../../../lib/useAsync';
import { ApiError } from '../../../lib/api/client';
import { createAnnouncement, listAnnouncements } from '../../../lib/api/resources';
import { announcementCategoryTone } from '../../../lib/announcement';
import { formatDate, toISODate } from '../../../lib/date';
import type { AnnouncementCategory } from '../../../types';
import tableStyles from '../../../components/Table/Table.module.css';
import styles from './AnnouncementList.module.css';

const PAGE_SIZE = 10;

const categoryOptions: AnnouncementCategory[] = ['お知らせ', 'メンテナンス', 'イベント', '運用変更'];

export function AnnouncementList() {
  const { data, isLoading, error, reload } = useAsync(() => listAnnouncements(), []);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    body: '',
    category: 'お知らせ' as AnnouncementCategory,
    publishedAt: toISODate(new Date()),
    bannerEnabled: false,
    bannerStartDate: '',
    bannerEndDate: '',
  });

  const allAnnouncements = [...(data ?? [])].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const totalPages = Math.max(1, Math.ceil(allAnnouncements.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = allAnnouncements.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function openAdd() {
    setForm({
      title: '',
      body: '',
      category: 'お知らせ',
      publishedAt: toISODate(new Date()),
      bannerEnabled: false,
      bannerStartDate: '',
      bannerEndDate: '',
    });
    setFormError(null);
    setIsAdding(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createAnnouncement(form);
      setIsAdding(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'お知らせの追加に失敗しました。');
    }
  }

  return (
    <div>
      <PageHeader
        title="お知らせ一覧"
        description="社内向けお知らせの登録状況を管理します。"
        actions={
          <Button variant="primary" onClick={openAdd}>
<Plus size={14} /> お知らせを追加
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <SkeletonTable columns={4} />
        ) : error || !data ? (
          <ErrorState onRetry={reload} />
        ) : (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>タイトル</th>
                  <th>カテゴリ</th>
                  <th>公開日</th>
                  <th>バナー表示</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((announcement) => (
                  <tr key={announcement.id}>
                    <td className={styles.titleCell}>
                      <Link to={`/admin/announcements/${announcement.id}`}>{announcement.title}</Link>
                    </td>
                    <td>
                      <Badge tone={announcementCategoryTone[announcement.category]}>
                        {announcement.category}
                      </Badge>
                    </td>
                    <td>{formatDate(announcement.publishedAt)}</td>
                    <td>
                      {announcement.bannerEnabled ? (
                        <Badge tone="danger">表示中</Badge>
                      ) : (
                        <Badge tone="neutral">なし</Badge>
                      )}
                    </td>
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
        <Modal title="お知らせを追加" onClose={() => setIsAdding(false)}>
          <form className={styles.form} onSubmit={handleSave}>
            {formError && <FormError message={formError} />}
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
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>
                閉じる
              </Button>
              <Button type="submit">追加する</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
