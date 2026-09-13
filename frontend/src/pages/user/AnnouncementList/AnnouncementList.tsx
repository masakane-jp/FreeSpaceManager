import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { Card } from '../../../components/Card/Card';
import { Badge } from '../../../components/Badge/Badge';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { Pagination } from '../../../components/Pagination/Pagination';
import { useAsync } from '../../../lib/useAsync';
import { listAnnouncements } from '../../../lib/api/resources';
import { announcementCategoryTone } from '../../../lib/announcement';
import { formatDate } from '../../../lib/date';
import styles from './AnnouncementList.module.css';

const PAGE_SIZE = 10;

export function AnnouncementList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, error, reload } = useAsync(() => listAnnouncements(), []);

  const allAnnouncements = [...(data ?? [])].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const totalPages = Math.max(1, Math.ceil(allAnnouncements.length / PAGE_SIZE));

  const pageParam = Number(searchParams.get('page') ?? '1');
  const currentPage = Number.isFinite(pageParam) ? Math.min(Math.max(1, pageParam), totalPages) : 1;

  const pageItems = allAnnouncements.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handlePageChange(page: number) {
    setSearchParams(page === 1 ? {} : { page: String(page) });
  }

  return (
    <div>
      <PageHeader
        title="お知らせ一覧"
        description={!isLoading && !error ? `全${allAnnouncements.length}件のお知らせがあります。` : undefined}
      />

      <Card>
        {isLoading ? (
          <div className={styles.skeletonPad}>
            <Skeleton height="14px" width="90%" />
            <Skeleton height="14px" width="70%" />
            <Skeleton height="14px" width="80%" />
            <Skeleton height="14px" width="60%" />
          </div>
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : (
          <ul className={styles.list}>
            {pageItems.map((announcement) => (
              <li key={announcement.id} className={styles.item}>
                <Link to={`/announcements/${announcement.id}`} className={styles.link}>
                  <Badge tone={announcementCategoryTone[announcement.category]}>
                    {announcement.category}
                  </Badge>
                  <span className={styles.title}>{announcement.title}</span>
                  <span className={styles.date}>{formatDate(announcement.publishedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {!isLoading && !error && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  );
}
