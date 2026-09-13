import styles from './FormError.module.css';

export function FormError({ message }: { message: string }) {
  return <p className={styles.error}>{message}</p>;
}
