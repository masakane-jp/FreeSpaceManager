import type {
  Announcement,
  AppUser,
  Area,
  CalendarNote,
  Reservation,
  ReservationHistoryEntry,
  Space,
} from '../../types';
import type {
  ApiAnnouncement,
  ApiArea,
  ApiCalendarNote,
  ApiReservation,
  ApiReservationHistory,
  ApiSpace,
  ApiUser,
} from './types';

export function toAppUser(raw: ApiUser): AppUser {
  return {
    id: String(raw.id),
    employeeNumber: raw.employee_number,
    name: raw.name,
    role: raw.role,
    status: raw.status,
  };
}

export function toArea(raw: ApiArea): Area {
  return {
    id: String(raw.id),
    name: raw.name,
    floor: raw.floor,
    description: raw.description,
  };
}

export function toSpace(raw: ApiSpace): Space {
  return {
    id: String(raw.id),
    areaId: String(raw.area),
    name: raw.name,
    capacity: raw.capacity,
    tags: raw.tags,
    description: raw.description,
    status: raw.status,
    isClosed: raw.is_closed,
  };
}

export function toReservation(raw: ApiReservation): Reservation {
  return {
    id: String(raw.id),
    spaceId: String(raw.space),
    userId: String(raw.user),
    purpose: raw.purpose,
    startDate: raw.start_date,
    endDate: raw.end_date,
    status: raw.status,
    createdAt: raw.created_at.slice(0, 10),
  };
}

export function toReservationHistoryEntry(raw: ApiReservationHistory): ReservationHistoryEntry {
  return {
    id: String(raw.id),
    action: raw.action,
    userName: raw.user_name,
    createdAt: raw.created_at,
  };
}

export function toAnnouncement(raw: ApiAnnouncement): Announcement {
  return {
    id: String(raw.id),
    title: raw.title,
    body: raw.body,
    category: raw.category,
    publishedAt: raw.published_at,
    bannerEnabled: raw.banner_enabled,
    bannerStartDate: raw.banner_start_date ?? undefined,
    bannerEndDate: raw.banner_end_date ?? undefined,
  };
}

export function toCalendarNote(raw: ApiCalendarNote): CalendarNote {
  return {
    id: String(raw.id),
    date: raw.date,
    holidayName: raw.holiday_name || undefined,
    memo: raw.memo || undefined,
  };
}
