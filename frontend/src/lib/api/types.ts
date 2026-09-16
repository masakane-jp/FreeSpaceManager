// Raw shapes as returned by the DRF API (snake_case, numeric FK ids).

export interface ApiUser {
  id: number;
  employee_number: string;
  name: string;
  role: 'member' | 'admin';
  status: 'active' | 'inactive';
}

export interface ApiArea {
  id: number;
  name: string;
  floor: string;
  description: string;
}

export interface ApiSpace {
  id: number;
  area: number;
  name: string;
  capacity: number;
  tags: string[];
  description: string;
  status: 'available' | 'reserved' | 'closed';
  is_closed: boolean;
}

export interface ApiReservation {
  id: number;
  space: number;
  user: number;
  purpose: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'ended' | 'cancelled';
  created_at: string;
}

export interface ApiReservationHistory {
  id: number;
  action: 'created' | 'updated' | 'cancelled';
  user_name: string;
  created_at: string;
}

export interface ApiAnnouncement {
  id: number;
  title: string;
  body: string;
  category: 'お知らせ' | 'メンテナンス' | 'イベント' | '運用変更';
  published_at: string;
  banner_enabled: boolean;
  banner_start_date: string | null;
  banner_end_date: string | null;
}

export interface ApiCalendarNote {
  id: number;
  date: string;
  holiday_name: string;
  memo: string;
}

export interface ApiLoginResponse {
  token: string;
  user: ApiUser;
}
