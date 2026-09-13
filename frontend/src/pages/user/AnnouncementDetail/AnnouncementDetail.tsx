import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { Card } from '../../../components/Card/Card';
import { Badge } from '../../../components/Badge/Badge';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { useAsync } from '../../../lib/useAsync';
import { listAnnouncements } from '../../../lib/api/resources';
import { announcementCategoryTone } from '../../../lib/announcement';
import { formatDate } from '../../../lib/date';
import styles from './AnnouncementDetail.module.css';

export function AnnouncementDetail() {
  const { announcementId } = useParams<{ announcementId: string }>();
  const { data, isLoading, error, reload } = useAsync(() => listAnnouncements(), []);

  if (isLoading) {
    return (
      <div>
        <Link to="/announcements" className={styles.backLink}>
          ← お知らせ一覧に戻る
        </Link>
        <Card className={styles.card}>
          <Skeleton height="16px" width="20%" />
          <Skeleton height="20px" width="60%" />
          <Skeleton height="14px" width="90%" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link to="/announcements" className={styles.backLink}>
          ← お知らせ一覧に戻る
        </Link>
        <ErrorState onRetry={reload} />
      </div>
    );
  }

  const sorted = [...(data ?? [])].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const index = sorted.findIndex((a) => a.id === announcementId);
  const announcement = index >= 0 ? sorted[index] : undefined;

  if (!announcement) {
    return (
      <div>
        <PageHeader title="お知らせが見つかりません" />
        <Link to="/announcements">← お知らせ一覧に戻る</Link>
      </div>
    );
  }

  const previous = index > 0 ? sorted[index - 1] : undefined;
  const next = index < sorted.length - 1 ? sorted[index + 1] : undefined;

  return (
    <div>
      <Link to="/announcements" className={styles.backLink}>
        ← お知らせ一覧に戻る
      </Link>

      <Card className={styles.card}>
        <div className={styles.meta}>
          <Badge tone={announcementCategoryTone[announcement.category]}>{announcement.category}</Badge>
          <span className={styles.date}>{formatDate(announcement.publishedAt)}</span>
        </div>
        <h1 className={styles.title}>{announcement.title}</h1>
        <p className={styles.body}>{announcement.body}</p>
      </Card>

      <div className={styles.adjacentNav}>
        <div className={styles.adjacentItem}>
          {previous && (
            <Link to={`/announcements/${previous.id}`} className={styles.adjacentLink}>
              <span className={styles.adjacentLabel}>← 前の記事</span>
              <span className={styles.adjacentTitle}>{previous.title}</span>
            </Link>
          )}
        </div>
        <div className={`${styles.adjacentItem} ${styles.adjacentItemRight}`}>
          {next && (
            <Link to={`/announcements/${next.id}`} className={styles.adjacentLink}>
              <span className={styles.adjacentLabel}>次の記事 →</span>
              <span className={styles.adjacentTitle}>{next.title}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
