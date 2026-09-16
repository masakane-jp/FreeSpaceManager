from datetime import date, timedelta

from rest_framework import status as http_status

from core.models import Reservation
from .base import BaseAPITestCase


class SpaceComputedStatusTests(BaseAPITestCase):
    def test_space_with_no_reservation_today_is_available(self):
        self.assertEqual(self.space.status, 'available')

    def test_space_with_reservation_covering_today_is_reserved(self):
        today = date.today()
        Reservation.objects.create(
            space=self.space, user=self.member, purpose='本日の予約',
            start_date=today - timedelta(days=1), end_date=today + timedelta(days=1),
        )
        self.assertEqual(self.space.status, 'reserved')

    def test_cancelled_reservation_today_does_not_count(self):
        today = date.today()
        Reservation.objects.create(
            space=self.space, user=self.member, purpose='キャンセル済み',
            start_date=today, end_date=today, is_cancelled=True,
        )
        self.assertEqual(self.space.status, 'available')

    def test_reservation_on_another_day_does_not_count(self):
        today = date.today()
        Reservation.objects.create(
            space=self.space, user=self.member, purpose='別日の予約',
            start_date=today + timedelta(days=5), end_date=today + timedelta(days=6),
        )
        self.assertEqual(self.space.status, 'available')

    def test_is_closed_takes_priority_over_reservation(self):
        today = date.today()
        Reservation.objects.create(
            space=self.space, user=self.member, purpose='本日の予約',
            start_date=today, end_date=today,
        )
        self.space.is_closed = True
        self.space.save()
        self.assertEqual(self.space.status, 'closed')

    def test_status_is_read_only_via_api(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f'/api/spaces/{self.space.id}/', {'status': 'closed'})
        self.assertEqual(response.status_code, http_status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'available')
        self.space.refresh_from_db()
        self.assertFalse(self.space.is_closed)

    def test_is_closed_is_writable_via_api(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f'/api/spaces/{self.space.id}/', {'is_closed': True})
        self.assertEqual(response.status_code, http_status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'closed')
