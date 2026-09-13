import type { ReservationStatus, SpaceStatus } from '../types';

export const spaceStatusLabel: Record<SpaceStatus, string> = {
  available: '空き',
  in_use: '使用中',
  reserved: '予約済み',
  closed: '停止中',
};

export const spaceStatusTone: Record<SpaceStatus, 'success' | 'warning' | 'info' | 'neutral'> = {
  available: 'success',
  in_use: 'warning',
  reserved: 'info',
  closed: 'neutral',
};

export const reservationStatusLabel: Record<ReservationStatus, string> = {
  upcoming: '予約中',
  active: '利用中',
  ended: '利用済み',
  cancelled: 'キャンセル',
};

export const reservationStatusTone: Record<ReservationStatus, 'success' | 'warning' | 'info' | 'neutral' | 'danger'> = {
  upcoming: 'info',
  active: 'warning',
  ended: 'neutral',
  cancelled: 'danger',
};
