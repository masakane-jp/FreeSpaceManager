import { Link } from 'react-router-dom';
import { Card } from '../../../components/Card/Card';
import { Badge } from '../../../components/Badge/Badge';
import { EmptyState } from '../../../components/EmptyState/EmptyState';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { SkeletonCards } from '../../../components/Skeleton/SkeletonCards';
import { FloorMap } from '../../../components/FloorMap/FloorMap';
import {
  reservationStatusLabel,
  reservationStatusTone,
  spaceStatusLabel,
  spaceStatusTone,
} from '../../../lib/status';
import { announcementCategoryTone } from '../../../lib/announcement';
import { formatDate, formatDateRange } from '../../../lib/date';
import { useAuth } from '../../../lib/AuthContext';
import { useAsync } from '../../../lib/useAsync';
import { listAnnouncements, listAreas, listReservations, listSpaces } from '../../../lib/api/resources';
import styles from './Home.module.css';

export function Home() {
  const { user } = useAuth();
  const { data, isLoading, error, reload } = useAsync(
    () => Promise.all([listAreas(), listSpaces(), listReservations(), listAnnouncements()]),
    [],
  );

  if (!user) return null;

  const [areas, spaces, reservations, announcements] = data ?? [[], [], [], []];

  const myReservations = reservations
    .filter((r) => r.userId === user.id && (r.status === 'upcoming' || r.status === 'active'))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const latestAnnouncements = [...announcements]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3);

  return (
    <div>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>お知らせ</h2>
          <Link to="/announcements">お知らせ一覧を見る →</Link>
        </div>
        <Card>
          {isLoading ? (
            <div className={styles.sectionSkeletonPad}>
              <Skeleton height="14px" width="80%" />
              <Skeleton height="14px" width="65%" />
              <Skeleton height="14px" width="70%" />
            </div>
          ) : error ? (
            <ErrorState onRetry={reload} />
          ) : (
            <ul className={styles.announcementList}>
              {latestAnnouncements.map((announcement) => (
                <li key={announcement.id} className={styles.announcementItem}>
                  <Link to={`/announcements/${announcement.id}`} className={styles.announcementLink}>
                    <Badge tone={announcementCategoryTone[announcement.category]}>
                      {announcement.category}
                    </Badge>
                    <span className={styles.announcementTitle}>{announcement.title}</span>
                    <span className={styles.announcementDate}>{formatDate(announcement.publishedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>あなたの直近の予約</h2>
          <Link to="/reservations">予約一覧を見る →</Link>
        </div>
        <Card>
          {isLoading ? (
            <div className={styles.sectionSkeletonPad}>
              <Skeleton height="14px" width="75%" />
              <Skeleton height="14px" width="60%" />
              <Skeleton height="14px" width="68%" />
            </div>
          ) : error ? (
            <ErrorState onRetry={reload} />
          ) : myReservations.length === 0 ? (
            <EmptyState message="現在予約はありません。エリア一覧からスペースを探してみましょう。" />
          ) : (
            <ul className={styles.reservationList}>
              {myReservations.map((reservation) => {
                const space = spaces.find((s) => s.id === reservation.spaceId);
                return (
                  <li key={reservation.id} className={styles.reservationItem}>
                    <div>
                      <p className={styles.reservationSpace}>
                        {space ? (
                          <Link to={`/spaces/${space.id}`}>{space.name}</Link>
                        ) : (
                          '不明なスペース'
                        )}
                      </p>
                      <p className={styles.reservationPurpose}>{reservation.purpose}</p>
                    </div>
                    <div className={styles.reservationMeta}>
                      <span className={styles.reservationDate}>
                        {formatDateRange(reservation.startDate, reservation.endDate)}
                      </span>
                      <Badge tone={reservationStatusTone[reservation.status]}>
                        {reservationStatusLabel[reservation.status]}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>エリアから探す</h2>
          <Link to="/areas">エリア一覧を見る →</Link>
        </div>
        <FloorMap />
        {isLoading ? (
          <SkeletonCards count={3} />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : (
          areas.map((area) => (
            <div key={area.id} className={styles.areaBlock}>
              <h3 className={styles.areaBlockTitle}>{area.name}</h3>
              <div className={styles.spaceGrid}>
                {spaces
                  .filter((space) => space.areaId === area.id)
                  .map((space) => (
                    <Link key={space.id} to={`/spaces/${space.id}`} className={styles.spaceGridItem}>
                      <span className={styles.spaceGridName}>{space.name}</span>
                      <Badge tone={spaceStatusTone[space.status]}>{spaceStatusLabel[space.status]}</Badge>
                    </Link>
                  ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
