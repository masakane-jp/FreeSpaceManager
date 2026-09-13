import type { AnnouncementCategory } from '../types';

export const announcementCategoryTone: Record<AnnouncementCategory, 'success' | 'warning' | 'info' | 'neutral' | 'danger'> = {
  'お知らせ': 'info',
  'メンテナンス': 'warning',
  'イベント': 'success',
  '運用変更': 'neutral',
};

export const announcementCategoryBannerColor: Record<AnnouncementCategory, string> = {
  'お知らせ': 'var(--color-info)',
  'メンテナンス': 'var(--color-warning)',
  'イベント': 'var(--color-success)',
  '運用変更': 'var(--color-text-muted)',
};
