import type { Area, Reservation, Space } from '../../types';
import { toISODate } from '../../lib/date';
import { SpaceCard } from '../SpaceCard/SpaceCard';
import styles from './AreaSpaceSection.module.css';

interface AreaSpaceSectionProps {
  area: Area;
  spaces: Space[];
  reservations: Reservation[];
}

export function AreaSpaceSection({ area, spaces, reservations }: AreaSpaceSectionProps) {
  const today = toISODate(new Date());

  return (
    <section className={styles.areaSection}>
      <div className={styles.areaHeading}>
        <h2 className={styles.areaName}>{area.name}</h2>
        <span className={styles.areaMeta}>
          {area.floor} ・ {spaces.length}件
        </span>
      </div>
      <p className={styles.areaDescription}>{area.description}</p>
      <div className={styles.grid}>
        {spaces.map((space) => {
          const sortedByStart = reservations
            .filter((r) => r.spaceId === space.id && r.status !== 'cancelled')
            .sort((a, b) => a.startDate.localeCompare(b.startDate));
          const currentReservation = sortedByStart.find(
            (r) => r.startDate <= today && r.endDate >= today,
          );
          const nextReservation = sortedByStart.find((r) => r.startDate > today);
          return (
            <SpaceCard
              key={space.id}
              space={space}
              linkTo={`/spaces/${space.id}`}
              currentReservation={currentReservation}
              nextReservation={nextReservation}
            />
          );
        })}
      </div>
    </section>
  );
}
