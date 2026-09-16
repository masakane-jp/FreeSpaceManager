from datetime import date, timedelta

from rest_framework import status

from core.models import Reservation, ReservationHistory
from .base import BaseAPITestCase


class ReservationOverlapTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        Reservation.objects.create(
            space=self.space, user=self.member, purpose='既存予約',
            start_date='2030-06-10', end_date='2030-06-12',
        )
        self.client.force_authenticate(user=self.member)

    def test_overlapping_reservation_same_space_is_rejected(self):
        response = self.client.post('/api/reservations/', {
            'space': self.space.id,
            'user': self.member.id,
            'purpose': '重複予約',
            'start_date': '2030-06-11',
            'end_date': '2030-06-13',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_overlapping_reservation_same_space_is_allowed(self):
        response = self.client.post('/api/reservations/', {
            'space': self.space.id,
            'user': self.member.id,
            'purpose': '別日程',
            'start_date': '2030-06-20',
            'end_date': '2030-06-21',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_same_dates_different_space_is_allowed(self):
        response = self.client.post('/api/reservations/', {
            'space': self.other_space.id,
            'user': self.member.id,
            'purpose': '別スペース',
            'start_date': '2030-06-10',
            'end_date': '2030-06-12',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_cancelled_reservation_does_not_block_overlap(self):
        Reservation.objects.filter(purpose='既存予約').update(is_cancelled=True)
        response = self.client.post('/api/reservations/', {
            'space': self.space.id,
            'user': self.member.id,
            'purpose': '再予約',
            'start_date': '2030-06-11',
            'end_date': '2030-06-13',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class ReservationPastDateTests(BaseAPITestCase):
    def test_start_date_before_today_is_rejected_on_create(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post('/api/reservations/', {
            'space': self.space.id,
            'user': self.member.id,
            'purpose': '過去予約',
            'start_date': '2020-01-01',
            'end_date': '2020-01-02',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_moving_an_existing_reservation_into_the_past_is_rejected(self):
        reservation = Reservation.objects.create(
            space=self.space, user=self.member, purpose='未来予約',
            start_date='2030-06-10', end_date='2030-06-12',
        )
        self.client.force_authenticate(user=self.member)
        response = self.client.patch(f'/api/reservations/{reservation.id}/', {'start_date': '2020-01-01'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_end_date_before_start_date_is_rejected(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post('/api/reservations/', {
            'space': self.space.id,
            'user': self.member.id,
            'purpose': '逆転予約',
            'start_date': '2030-05-10',
            'end_date': '2030-05-01',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_editing_other_fields_of_an_untouched_past_reservation_is_allowed(self):
        reservation = Reservation.objects.create(
            space=self.space, user=self.member, purpose='編集前',
            start_date='2020-01-01', end_date='2020-01-02',
        )
        self.client.force_authenticate(user=self.member)
        response = self.client.patch(f'/api/reservations/{reservation.id}/', {'purpose': '編集後'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ReservationComputedStatusTests(BaseAPITestCase):
    def test_future_dates_are_upcoming(self):
        today = date.today()
        reservation = Reservation.objects.create(
            space=self.space, user=self.member, purpose='未来',
            start_date=today + timedelta(days=1), end_date=today + timedelta(days=2),
        )
        self.assertEqual(reservation.status, 'upcoming')

    def test_dates_covering_today_are_active(self):
        today = date.today()
        reservation = Reservation.objects.create(
            space=self.space, user=self.member, purpose='本日',
            start_date=today, end_date=today,
        )
        self.assertEqual(reservation.status, 'active')

    def test_past_dates_are_ended(self):
        today = date.today()
        reservation = Reservation.objects.create(
            space=self.space, user=self.member, purpose='過去',
            start_date=today - timedelta(days=2), end_date=today - timedelta(days=1),
        )
        self.assertEqual(reservation.status, 'ended')

    def test_is_cancelled_overrides_date_based_status(self):
        today = date.today()
        reservation = Reservation.objects.create(
            space=self.space, user=self.member, purpose='キャンセル',
            start_date=today, end_date=today, is_cancelled=True,
        )
        self.assertEqual(reservation.status, 'cancelled')


class ReservationHistoryTests(BaseAPITestCase):
    def test_create_records_history(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post('/api/reservations/', {
            'space': self.space.id,
            'user': self.member.id,
            'purpose': '履歴テスト',
            'start_date': '2030-07-01',
            'end_date': '2030-07-02',
        })
        reservation_id = response.data['id']
        history = ReservationHistory.objects.filter(reservation_id=reservation_id)
        self.assertEqual(history.count(), 1)
        self.assertEqual(history.first().action, ReservationHistory.Action.CREATED)
        self.assertEqual(history.first().user, self.member)

    def test_edit_records_updated_action(self):
        reservation = Reservation.objects.create(
            space=self.space, user=self.member, purpose='編集前',
            start_date='2030-08-01', end_date='2030-08-02',
        )
        self.client.force_authenticate(user=self.member)
        self.client.patch(f'/api/reservations/{reservation.id}/', {'purpose': '編集後'})
        entry = ReservationHistory.objects.filter(reservation=reservation).latest('created_at')
        self.assertEqual(entry.action, ReservationHistory.Action.UPDATED)
        self.assertEqual(entry.user, self.member)

    def test_cancel_records_cancelled_action_by_admin(self):
        reservation = Reservation.objects.create(
            space=self.space, user=self.member, purpose='キャンセル対象',
            start_date='2030-09-01', end_date='2030-09-02',
        )
        self.client.force_authenticate(user=self.admin)
        self.client.patch(f'/api/reservations/{reservation.id}/', {'is_cancelled': True})
        entry = ReservationHistory.objects.filter(reservation=reservation).latest('created_at')
        self.assertEqual(entry.action, ReservationHistory.Action.CANCELLED)
        self.assertEqual(entry.user, self.admin)

    def test_history_endpoint_returns_entries_newest_first(self):
        self.client.force_authenticate(user=self.member)
        create_response = self.client.post('/api/reservations/', {
            'space': self.space.id,
            'user': self.member.id,
            'purpose': '履歴確認',
            'start_date': '2030-10-01',
            'end_date': '2030-10-02',
        })
        reservation_id = create_response.data['id']
        self.client.patch(f'/api/reservations/{reservation_id}/', {'purpose': '履歴確認2'})
        response = self.client.get(f'/api/reservations/{reservation_id}/history/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        actions = [row['action'] for row in response.data]
        self.assertEqual(actions, ['updated', 'created'])
