import defaultFloorMapImage from '../../assets/floor-map.svg';
import { useAsync } from '../../lib/useAsync';
import { getFloorMap } from '../../lib/api/resources';
import { Skeleton } from '../Skeleton/Skeleton';
import styles from './FloorMap.module.css';

interface FloorMapProps {
  className?: string;
}

export function FloorMap({ className }: FloorMapProps) {
  const { data, isLoading } = useAsync(() => getFloorMap(), []);

  return (
    <div className={[styles.frame, className].filter(Boolean).join(' ')}>
      {isLoading ? (
        <Skeleton width="100%" height="100%" />
      ) : (
        <img src={data?.image ?? defaultFloorMapImage} alt="オフィスフロアマップ" className={styles.image} />
      )}
    </div>
  );
}
