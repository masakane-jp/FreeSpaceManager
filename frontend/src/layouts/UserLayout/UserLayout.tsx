import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { UserMenu } from '../../components/UserMenu/UserMenu';
import { EmergencyBanner } from '../../components/EmergencyBanner/EmergencyBanner';
import styles from './UserLayout.module.css';

const navItems = [
  { to: '/', label: 'ホーム' },
  { to: '/areas', label: 'エリア一覧' },
  { to: '/announcements', label: 'お知らせ' },
];

export function UserLayout() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.brandMark}>FS</span>
            <span className={styles.brandName}>フリースペース管理</span>
          </div>
          <nav className={styles.nav}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className={styles.userMenu}>
            <UserMenu user={user} />
          </div>
        </div>
      </header>
      <EmergencyBanner />
      <main className={styles.main}>
        <div className={styles.mainInner}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
