import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import { useAuth } from '../../lib/AuthContext';
import { ApiError } from '../../lib/api/client';
import styles from './Login.module.css';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(employeeNumber, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ログインに失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>FS</span>
          <span className={styles.brandName}>フリースペース管理</span>
        </div>
        <p className={styles.lead}>社内メンバー用アカウントでログインしてください</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>社員番号</span>
            <input
              type="text"
              className={styles.input}
              placeholder="例：10001"
              value={employeeNumber}
              onChange={(event) => setEmployeeNumber(event.target.value)}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>パスワード（管理者のみ必須）</span>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'ログイン中…' : 'ログイン'}
          </Button>
        </form>
      </div>
    </div>
  );
}
