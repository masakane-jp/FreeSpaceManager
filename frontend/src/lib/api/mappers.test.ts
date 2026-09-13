import { describe, expect, it } from 'vitest';
import {
  toAnnouncement,
  toAppUser,
  toArea,
  toCalendarNote,
  toReservation,
  toReservationHistoryEntry,
  toSpace,
} from './mappers';

describe('toAppUser', () => {
  it('maps snake_case fields and stringifies the numeric id', () => {
    const result = toAppUser({
      id: 1,
      employee_number: '10001',
      name: '田中 太郎',
      role: 'admin',
      status: 'active',
    });
    expect(result).toEqual({
      id: '1',
      employeeNumber: '10001',
      name: '田中 太郎',
      role: 'admin',
      status: 'active',
    });
  });
});

describe('toSpace', () => {
  it('stringifies both the id and the area foreign key', () => {
    const result = toSpace({
      id: 5,
      area: 2,
      name: '会議室501',
      capacity: 8,
      tags: ['プロジェクター'],
      description: '',
      status: 'available',
    });
    expect(result.id).toBe('5');
    expect(result.areaId).toBe('2');
  });
});

describe('toReservation', () => {
  it('truncates the created_at timestamp to a plain date', () => {
    const result = toReservation({
      id: 1,
      space: 2,
      user: 3,
      purpose: 'テスト',
      start_date: '2026-09-13',
      end_date: '2026-09-14',
      status: 'upcoming',
      created_at: '2026-09-10T10:05:56.956144Z',
    });
    expect(result.createdAt).toBe('2026-09-10');
    expect(result.spaceId).toBe('2');
    expect(result.userId).toBe('3');
  });
});

describe('toReservationHistoryEntry', () => {
  it('maps user_name to userName', () => {
    const result = toReservationHistoryEntry({
      id: 1,
      action: 'cancelled',
      user_name: '田中 太郎',
      created_at: '2026-09-13T12:00:00Z',
    });
    expect(result).toEqual({
      id: '1',
      action: 'cancelled',
      userName: '田中 太郎',
      createdAt: '2026-09-13T12:00:00Z',
    });
  });
});

describe('toAnnouncement', () => {
  it('converts null banner dates to undefined', () => {
    const result = toAnnouncement({
      id: 1,
      title: 'お知らせ',
      body: '本文',
      category: 'お知らせ',
      published_at: '2026-09-13',
      banner_enabled: false,
      banner_start_date: null,
      banner_end_date: null,
    });
    expect(result.bannerStartDate).toBeUndefined();
    expect(result.bannerEndDate).toBeUndefined();
  });

  it('keeps banner dates when present', () => {
    const result = toAnnouncement({
      id: 1,
      title: 'お知らせ',
      body: '本文',
      category: 'お知らせ',
      published_at: '2026-09-13',
      banner_enabled: true,
      banner_start_date: '2026-09-13',
      banner_end_date: '2026-09-20',
    });
    expect(result.bannerStartDate).toBe('2026-09-13');
    expect(result.bannerEndDate).toBe('2026-09-20');
  });
});

describe('toCalendarNote', () => {
  it('converts empty strings to undefined', () => {
    const result = toCalendarNote({ id: 1, date: '2026-09-21', holiday_name: '', memo: '' });
    expect(result.holidayName).toBeUndefined();
    expect(result.memo).toBeUndefined();
  });

  it('keeps non-empty holiday name and memo', () => {
    const result = toCalendarNote({
      id: 1,
      date: '2026-09-21',
      holiday_name: '敬老の日',
      memo: '',
    });
    expect(result.holidayName).toBe('敬老の日');
    expect(result.memo).toBeUndefined();
  });
});

describe('toArea', () => {
  it('maps floor and description straight through', () => {
    const area = toArea({ id: 3, name: '本社', floor: '3F', description: '説明' });
    expect(area).toEqual({ id: '3', name: '本社', floor: '3F', description: '説明' });
  });
});
