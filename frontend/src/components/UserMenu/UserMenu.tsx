import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { AppUser } from '../../types';
import { useAuth } from '../../lib/AuthContext';
import styles from './UserMenu.module.css';

const roleLabel = {
  member: '一般メンバー',
  admin: '管理者',
};

interface UserMenuProps {
  user: AppUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const isAdminArea = location.pathname.startsWith('/admin');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleNavigate(path: string) {
    setOpen(false);
    navigate(path);
  }

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate('/login');
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button type="button" className={styles.trigger} onClick={() => setOpen((prev) => !prev)}>
        <div className={styles.avatar}>{user.name.slice(0, 1)}</div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user.name}</span>
          <span className={styles.userDept}>{roleLabel[user.role]}</span>
        </div>
        <ChevronDown size={14} className={styles.caret} />
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHeader}>
            <p className={styles.menuUserName}>{user.name}</p>
            <p className={styles.menuUserEmail}>
              {user.employeeNumber} ・ {roleLabel[user.role]}
            </p>
          </div>

          {isAdminArea ? (
            <button type="button" className={styles.menuItem} onClick={() => handleNavigate('/')}>
              利用者画面へ
            </button>
          ) : (
            <>
              <button type="button" className={styles.menuItem} onClick={() => handleNavigate('/reservations')}>
                予約一覧
              </button>
              {user.role === 'admin' && (
                <button type="button" className={styles.menuItem} onClick={() => handleNavigate('/admin')}>
                  管理画面へ
                </button>
              )}
            </>
          )}

          <div className={styles.menuDivider} />
          <button type="button" className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
}
