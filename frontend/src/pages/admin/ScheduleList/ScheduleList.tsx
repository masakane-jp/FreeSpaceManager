import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { Card } from '../../../components/Card/Card';
import { Badge } from '../../../components/Badge/Badge';
import { EmptyState } from '../../../components/EmptyState/EmptyState';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { SkeletonTable } from '../../../components/Skeleton/SkeletonTable';
import { Pagination } from '../../../components/Pagination/Pagination';
import { useAsync } from '../../../lib/useAsync';
import { listAreas, listReservations, listSpaces, listUsers } from '../../../lib/api/resources';
import { reservationStatusLabel, reservationStatusTone } from '../../../lib/status';
import { formatDateRange } from '../../../lib/date';
import type { ReservationStatus } from '../../../types';
import tableStyles from '../../../components/Table/Table.module.css';
import styles from './ScheduleList.module.css';

const PAGE_SIZE = 10;

const statusOptions: Array<{ value: ReservationStatus | 'all'; label: string }> = [
  { value: 'all', label: 'すべての状態' },
  { value: 'upcoming', label: reservationStatusLabel.upcoming },
  { value: 'active', label: reservationStatusLabel.active },
  { value: 'ended', label: reservationStatusLabel.ended },
  { value: 'cancelled', label: reservationStatusLabel.cancelled },
];

export function ScheduleList() {
  const { data, isLoading, error, reload } = useAsync(
    () => Promise.all([listReservations(), listSpaces(), listAreas(), listUsers()]),
    [],
  );

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const rows = useMemo(() => {
    if (!data) return [];
    const [reservations, spaces, areas, users] = data;
    return reservations
      .map((reservation) => {
        const space = spaces.find((s) => s.id === reservation.spaceId);
        const area = space ? areas.find((a) => a.id === space.areaId) : undefined;
        const user = users.find((u) => u.id === reservation.userId);
        return { reservation, space, area, user };
      })
      .filter(({ reservation, space, area, user }) => {
        const matchesKeyword =
          keyword.trim() === '' ||
          reservation.purpose.includes(keyword) ||
          space?.name.includes(keyword) ||
          user?.name.includes(keyword);
        const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
        const matchesArea = areaFilter === 'all' || area?.id === areaFilter;
        return matchesKeyword && matchesStatus && matchesArea;
      })
      .sort((a, b) => b.reservation.startDate.localeCompare(a.reservation.startDate));
  }, [data, keyword, statusFilter, areaFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const areas = data?.[2] ?? [];

  function handleFilterChange<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setCurrentPage(1);
  }

  return (
    <div>
      <PageHeader
        title="スケジュール一覧"
        description="全スペースの利用予約を一覧で確認できます。キャンセルは各予約の詳細画面から行えます。"
      />

      <div className={styles.filters}>
        <input
          className={styles.search}
          type="text"
          placeholder="スペース名・予約者・目的で検索"
          value={keyword}
          onChange={(event) => handleFilterChange(setKeyword, event.target.value)}
        />
        <select
          className={styles.select}
          value={areaFilter}
          onChange={(event) => handleFilterChange(setAreaFilter, event.target.value)}
        >
          <option value="all">すべてのエリア</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
        <select
          className={styles.select}
          value={statusFilter}
          onChange={(event) => handleFilterChange(setStatusFilter, event.target.value as ReservationStatus | 'all')}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <Card>
        {isLoading ? (
          <SkeletonTable columns={6} />
        ) : error || !data ? (
          <ErrorState onRetry={reload} />
        ) : pageItems.length === 0 ? (
          <EmptyState message="条件に一致する予約が見つかりませんでした。" />
        ) : (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>利用目的</th>
                  <th>スペース</th>
                  <th>エリア</th>
                  <th>予約者</th>
                  <th>期間</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(({ reservation, space, area, user }) => (
                  <tr key={reservation.id}>
                    <td className={styles.purposeCell}>
                      <Link to={`/admin/schedules/${reservation.id}`}>{reservation.purpose}</Link>
                    </td>
                    <td>
                      {space ? (
                        <Link to={`/admin/spaces/${space.id}`}>{space.name}</Link>
                      ) : (
                        '不明'
                      )}
                    </td>
                    <td>
                      {area ? <Link to={`/admin/areas/${area.id}`}>{area.name}</Link> : '-'}
                    </td>
                    <td>
                      {user ? <Link to={`/admin/users/${user.id}`}>{user.name}</Link> : '不明'}
                    </td>
                    <td>{formatDateRange(reservation.startDate, reservation.endDate)}</td>
                    <td>
                      <Badge tone={reservationStatusTone[reservation.status]}>
                        {reservationStatusLabel[reservation.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!isLoading && !error && (
        <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}
    </div>
  );
}
