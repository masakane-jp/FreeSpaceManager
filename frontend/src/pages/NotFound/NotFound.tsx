import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';

export function NotFound() {
  return (
    <div className={styles.wrapper}>
      <p className={styles.code}>404</p>
      <p className={styles.message}>お探しのページは見つかりませんでした。</p>
      <Link to="/">ホームへ戻る</Link>
    </div>
  );
}
