import { Link } from 'react-router-dom';
import { useAsync } from '../../lib/useAsync';
import { listAnnouncements } from '../../lib/api/resources';
import { announcementCategoryBannerColor } from '../../lib/announcement';
import { toISODate } from '../../lib/date';
import styles from './EmergencyBanner.module.css';

export function EmergencyBanner() {
  const { data } = useAsync(() => listAnnouncements(), []);
  const today = toISODate(new Date());

  const announcement = [...(data ?? [])]
    .filter(
      (a) =>
        a.bannerEnabled &&
        (!a.bannerStartDate || a.bannerStartDate <= today) &&
        (!a.bannerEndDate || a.bannerEndDate >= today),
    )
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];

  if (!announcement) {
    return null;
  }

  return (
    <Link
      to={`/announcements/${announcement.id}`}
      className={styles.banner}
      style={{ background: announcementCategoryBannerColor[announcement.category] }}
    >
      <span className={styles.text}>{announcement.title}</span>
    </Link>
  );
}
