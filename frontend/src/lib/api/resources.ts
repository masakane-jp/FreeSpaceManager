import type {
  Announcement,
  AppUser,
  Area,
  CalendarNote,
  Reservation,
  ReservationHistoryEntry,
  Space,
  UserRole,
  UserStatus,
} from '../../types';
import { api } from './client';
import {
  toAnnouncement,
  toAppUser,
  toArea,
  toCalendarNote,
  toReservation,
  toReservationHistoryEntry,
  toSpace,
} from './mappers';
import type {
  ApiAnnouncement,
  ApiArea,
  ApiCalendarNote,
  ApiLoginResponse,
  ApiReservation,
  ApiReservationHistory,
  ApiSpace,
  ApiUser,
} from './types';

// --- auth ---

export async function login(employeeNumber: string, password?: string): Promise<{ token: string; user: AppUser }> {
  const raw = await api.post<ApiLoginResponse>('/auth/login/', {
    employee_number: employeeNumber,
    password: password ?? '',
  });
  return { token: raw.token, user: toAppUser(raw.user) };
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout/');
}

export async function fetchCurrentUser(): Promise<AppUser> {
  const raw = await api.get<ApiUser>('/auth/me/');
  return toAppUser(raw);
}

// --- users ---

export async function listUsers(): Promise<AppUser[]> {
  const raw = await api.get<ApiUser[]>('/users/');
  return raw.map(toAppUser);
}

export async function getUser(id: string): Promise<AppUser> {
  const raw = await api.get<ApiUser>(`/users/${id}/`);
  return toAppUser(raw);
}

export async function createUser(input: {
  name: string;
  employeeNumber: string;
  role: UserRole;
}): Promise<AppUser> {
  const raw = await api.post<ApiUser>('/users/', {
    name: input.name,
    employee_number: input.employeeNumber,
    role: input.role,
    status: 'active',
  });
  return toAppUser(raw);
}

export async function updateUser(
  id: string,
  input: { name: string; employeeNumber: string; role: UserRole; status: UserStatus },
): Promise<AppUser> {
  const raw = await api.patch<ApiUser>(`/users/${id}/`, {
    name: input.name,
    employee_number: input.employeeNumber,
    role: input.role,
    status: input.status,
  });
  return toAppUser(raw);
}

export async function exportUsersCsv(): Promise<Blob> {
  return api.getBlob('/users/export_csv/');
}

export interface ImportUsersCsvResult {
  created: number;
  updated: number;
  errors: string[];
}

export async function importUsersCsv(file: File): Promise<ImportUsersCsvResult> {
  const formData = new FormData();
  formData.append('file', file);
  return api.postForm<ImportUsersCsvResult>('/users/import_csv/', formData);
}

// --- areas ---

export async function listAreas(): Promise<Area[]> {
  const raw = await api.get<ApiArea[]>('/areas/');
  return raw.map(toArea);
}

export async function getArea(id: string): Promise<Area> {
  const raw = await api.get<ApiArea>(`/areas/${id}/`);
  return toArea(raw);
}

export async function createArea(input: { name: string; floor: string; description: string }): Promise<Area> {
  const raw = await api.post<ApiArea>('/areas/', input);
  return toArea(raw);
}

export async function updateArea(
  id: string,
  input: { name: string; floor: string; description: string },
): Promise<Area> {
  const raw = await api.patch<ApiArea>(`/areas/${id}/`, input);
  return toArea(raw);
}

export async function deleteArea(id: string): Promise<void> {
  await api.delete(`/areas/${id}/`);
}

// --- spaces ---

export async function listSpaces(): Promise<Space[]> {
  const raw = await api.get<ApiSpace[]>('/spaces/');
  return raw.map(toSpace);
}

export async function getSpace(id: string): Promise<Space> {
  const raw = await api.get<ApiSpace>(`/spaces/${id}/`);
  return toSpace(raw);
}

export async function createSpace(input: {
  areaId: string;
  name: string;
  capacity: number;
  tags: string[];
  description: string;
  status: Space['status'];
}): Promise<Space> {
  const raw = await api.post<ApiSpace>('/spaces/', {
    area: Number(input.areaId),
    name: input.name,
    capacity: input.capacity,
    tags: input.tags,
    description: input.description,
    status: input.status,
  });
  return toSpace(raw);
}

export async function updateSpace(
  id: string,
  input: {
    areaId: string;
    name: string;
    capacity: number;
    tags: string[];
    description: string;
    status: Space['status'];
  },
): Promise<Space> {
  const raw = await api.patch<ApiSpace>(`/spaces/${id}/`, {
    area: Number(input.areaId),
    name: input.name,
    capacity: input.capacity,
    tags: input.tags,
    description: input.description,
    status: input.status,
  });
  return toSpace(raw);
}

export async function deleteSpace(id: string): Promise<void> {
  await api.delete(`/spaces/${id}/`);
}

// --- reservations ---

export async function listReservations(): Promise<Reservation[]> {
  const raw = await api.get<ApiReservation[]>('/reservations/');
  return raw.map(toReservation);
}

export async function createReservation(input: {
  spaceId: string;
  userId: string;
  purpose: string;
  startDate: string;
  endDate: string;
}): Promise<Reservation> {
  const raw = await api.post<ApiReservation>('/reservations/', {
    space: Number(input.spaceId),
    user: Number(input.userId),
    purpose: input.purpose,
    start_date: input.startDate,
    end_date: input.endDate,
    status: 'upcoming',
  });
  return toReservation(raw);
}

export async function updateReservation(
  id: string,
  input: Partial<{ purpose: string; startDate: string; endDate: string; status: Reservation['status'] }>,
): Promise<Reservation> {
  const raw = await api.patch<ApiReservation>(`/reservations/${id}/`, {
    purpose: input.purpose,
    start_date: input.startDate,
    end_date: input.endDate,
    status: input.status,
  });
  return toReservation(raw);
}

export async function cancelReservation(id: string): Promise<Reservation> {
  return updateReservation(id, { status: 'cancelled' });
}

export async function getReservationHistory(id: string): Promise<ReservationHistoryEntry[]> {
  const raw = await api.get<ApiReservationHistory[]>(`/reservations/${id}/history/`);
  return raw.map(toReservationHistoryEntry);
}

// --- announcements ---

export async function listAnnouncements(): Promise<Announcement[]> {
  const raw = await api.get<ApiAnnouncement[]>('/announcements/');
  return raw.map(toAnnouncement);
}

export async function getAnnouncement(id: string): Promise<Announcement> {
  const raw = await api.get<ApiAnnouncement>(`/announcements/${id}/`);
  return toAnnouncement(raw);
}

interface AnnouncementInput {
  title: string;
  body: string;
  category: Announcement['category'];
  publishedAt: string;
  bannerEnabled: boolean;
  bannerStartDate?: string;
  bannerEndDate?: string;
}

function toAnnouncementPayload(input: AnnouncementInput) {
  return {
    title: input.title,
    body: input.body,
    category: input.category,
    published_at: input.publishedAt,
    banner_enabled: input.bannerEnabled,
    banner_start_date: input.bannerEnabled ? input.bannerStartDate || null : null,
    banner_end_date: input.bannerEnabled ? input.bannerEndDate || null : null,
  };
}

export async function createAnnouncement(input: AnnouncementInput): Promise<Announcement> {
  const raw = await api.post<ApiAnnouncement>('/announcements/', toAnnouncementPayload(input));
  return toAnnouncement(raw);
}

export async function updateAnnouncement(id: string, input: AnnouncementInput): Promise<Announcement> {
  const raw = await api.patch<ApiAnnouncement>(`/announcements/${id}/`, toAnnouncementPayload(input));
  return toAnnouncement(raw);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await api.delete(`/announcements/${id}/`);
}

// --- calendar notes ---

export async function listCalendarNotes(): Promise<CalendarNote[]> {
  const raw = await api.get<ApiCalendarNote[]>('/calendar-notes/');
  return raw.map(toCalendarNote);
}

export async function upsertCalendarNote(input: {
  id?: string;
  date: string;
  holidayName?: string;
  memo?: string;
}): Promise<CalendarNote> {
  const body = {
    date: input.date,
    holiday_name: input.holidayName ?? '',
    memo: input.memo ?? '',
  };
  const raw = input.id
    ? await api.patch<ApiCalendarNote>(`/calendar-notes/${input.id}/`, body)
    : await api.post<ApiCalendarNote>('/calendar-notes/', body);
  return toCalendarNote(raw);
}

export async function deleteCalendarNote(id: string): Promise<void> {
  await api.delete(`/calendar-notes/${id}/`);
}

// --- floor map ---

export async function getFloorMap(): Promise<{ image: string | null }> {
  return api.get<{ image: string | null }>('/floor-map/');
}

export async function uploadFloorMap(file: File): Promise<{ image: string }> {
  const formData = new FormData();
  formData.append('image', file);
  return api.postForm<{ image: string }>('/floor-map/', formData);
}

export async function resetFloorMap(): Promise<void> {
  await api.delete('/floor-map/');
}
