export type UserRole = 'member' | 'admin';
export type UserStatus = 'active' | 'inactive';

export interface AppUser {
  id: string;
  employeeNumber: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

export interface Area {
  id: string;
  name: string;
  floor: string;
  description: string;
}

export type SpaceStatus = 'available' | 'in_use' | 'reserved' | 'closed';

export interface Space {
  id: string;
  areaId: string;
  name: string;
  capacity: number;
  tags: string[];
  description: string;
  status: SpaceStatus;
}

export type ReservationStatus = 'upcoming' | 'active' | 'ended' | 'cancelled';

export interface Reservation {
  id: string;
  spaceId: string;
  userId: string;
  purpose: string;
  startDate: string;
  endDate: string;
  status: ReservationStatus;
  createdAt: string;
}

export type ReservationHistoryAction = 'created' | 'updated' | 'cancelled';

export interface ReservationHistoryEntry {
  id: string;
  action: ReservationHistoryAction;
  userName: string;
  createdAt: string;
}

export type AnnouncementCategory = 'お知らせ' | 'メンテナンス' | 'イベント' | '運用変更';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  publishedAt: string;
  bannerEnabled: boolean;
  bannerStartDate?: string;
  bannerEndDate?: string;
}

export interface CalendarNote {
  id: string;
  date: string;
  holidayName?: string;
  memo?: string;
}
