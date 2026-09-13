import { Skeleton } from './Skeleton';
import { Card } from '../Card/Card';
import styles from './SkeletonCards.module.css';

interface SkeletonCardsProps {
  count?: number;
}

export function SkeletonCards({ count = 3 }: SkeletonCardsProps) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className={styles.card}>
          <Skeleton height="16px" width="60%" />
          <Skeleton height="12px" width="90%" />
          <Skeleton height="12px" width="75%" />
        </Card>
      ))}
    </div>
  );
}
