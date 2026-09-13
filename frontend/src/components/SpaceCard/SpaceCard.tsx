import { Link } from 'react-router-dom';
import type { Space } from '../../types';
import { Badge } from '../Badge/Badge';
import { Card } from '../Card/Card';
import { spaceStatusLabel, spaceStatusTone } from '../../lib/status';
import { formatDate, formatDateRange } from '../../lib/date';
import styles from './SpaceCard.module.css';

interface ReservationPreview {
  purpose: string;
  startDate: string;
  endDate: string;
}

interface SpaceCardProps {
  space: Space;
  areaName?: string;
  linkTo: string;
  currentReservation?: ReservationPreview | null;
  nextReservation?: ReservationPreview | null;
}

export function SpaceCard({ space, areaName, linkTo, currentReservation, nextReservation }: SpaceCardProps) {
  return (
    <Card className={styles.card}>
      <div className={styles.top}>
        <div>
          <p className={styles.name}>
            <Link to={linkTo} className={styles.nameLink}>
              {space.name}
            </Link>
          </p>
          {areaName && <p className={styles.area}>{areaName}</p>}
        </div>
        <Badge tone={spaceStatusTone[space.status]}>{spaceStatusLabel[space.status]}</Badge>
      </div>
      <p className={styles.description}>{space.description}</p>
      <dl className={styles.scheduleInfo}>
        <div className={styles.scheduleRow}>
          <dt>現在</dt>
          <dd>
            {currentReservation
              ? `${currentReservation.purpose}（〜${formatDate(currentReservation.endDate)}）`
              : '-'}
          </dd>
        </div>
        <div className={styles.scheduleRow}>
          <dt>次回</dt>
          <dd>
            {nextReservation
              ? `${nextReservation.purpose}（${formatDateRange(nextReservation.startDate, nextReservation.endDate)}）`
              : '-'}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
