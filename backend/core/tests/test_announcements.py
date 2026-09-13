from rest_framework import status

from core.models import Announcement
from .base import BaseAPITestCase


class AnnouncementBannerOverlapTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        Announcement.objects.create(
            title='既存告知', body='本文', category='お知らせ', published_at='2030-01-01',
            banner_enabled=True, banner_start_date='2030-06-10', banner_end_date='2030-06-20',
        )
        self.client.force_authenticate(user=self.admin)

    def test_overlapping_banner_period_is_rejected(self):
        response = self.client.post('/api/announcements/', {
            'title': '重複告知', 'body': '本文', 'category': 'お知らせ', 'published_at': '2030-01-01',
            'banner_enabled': True, 'banner_start_date': '2030-06-15', 'banner_end_date': '2030-06-25',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_overlapping_banner_period_is_allowed(self):
        response = self.client.post('/api/announcements/', {
            'title': '別期間告知', 'body': '本文', 'category': 'お知らせ', 'published_at': '2030-01-01',
            'banner_enabled': True, 'banner_start_date': '2030-07-01', 'banner_end_date': '2030-07-10',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_banner_disabled_ignores_overlap(self):
        response = self.client.post('/api/announcements/', {
            'title': '非表示告知', 'body': '本文', 'category': 'お知らせ', 'published_at': '2030-01-01',
            'banner_enabled': False,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_indefinite_banner_blocks_all_future_dates(self):
        Announcement.objects.filter(title='既存告知').update(banner_end_date=None)
        response = self.client.post('/api/announcements/', {
            'title': '将来告知', 'body': '本文', 'category': 'お知らせ', 'published_at': '2030-01-01',
            'banner_enabled': True, 'banner_start_date': '2031-01-01', 'banner_end_date': '2031-01-02',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
