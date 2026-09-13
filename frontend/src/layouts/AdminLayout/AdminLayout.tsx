import { NavLink, Outlet } from 'react-router-dom';
import { Building2, Calendar, ClipboardList, Newspaper, Users } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { UserMenu } from '../../components/UserMenu/UserMenu';
import styles from './AdminLayout.module.css';

const navItems = [
  { to: '/admin/schedules', label: 'スケジュール一覧', icon: ClipboardList },
  { to: '/admin/users', label: 'ユーザー一覧', icon: Users },
  { to: '/admin/areas', label: 'エリア・スペース一覧', icon: Building2 },
  { to: '/admin/calendar', label: 'カレンダー', icon: Calendar },
  { to: '/admin/announcements', label: 'お知らせ', icon: Newspaper },
];

export function AdminLayout() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>FS</span>
          <span className={styles.brandName}>管理画面</span>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              <item.icon size={16} className={styles.navIcon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className={styles.body}>
        <header className={styles.header}>
          <span className={styles.headerTitle}>フリースペース管理システム</span>
          <UserMenu user={user} />
        </header>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
