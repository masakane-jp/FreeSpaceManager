import { Button } from '../Button/Button';
import styles from './ErrorState.module.css';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'データの取得に失敗しました。', onRetry }: ErrorStateProps) {
  return (
    <div className={styles.error}>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          再読み込み
        </Button>
      )}
    </div>
  );
}
