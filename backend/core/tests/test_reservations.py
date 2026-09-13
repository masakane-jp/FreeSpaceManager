from rest_framework import status

from core.models import Reservation, ReservationHistory
from .base import BaseAPITestCase


class ReservationOverlapTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        Reservation.objects.create(
            space=self.space, user=self.member, purpose='既存予約',
            start_date='2030-06-10', end_date='2030-06-12', status='upcoming',
        )
        self.client.force_authenticate(user=self.member)

    def test_overlapping_reservation_same_space_is_rejected(self):
        response = self.client.post('/api/reservations/', {
            'space': self.space.id,
            'user': self.member.id,
            'purpose': '重複予約',
            'start_date': '2030-06-11',
            'end_date': '2030-06-13',
            'status': 'upcoming',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_overlapping_reservation_same_space_is_allowed(self):
        response = self.client.post('/api/reservations/', {
            'space': self.space.id,
            'user': self.member.id,
            'purpose': '別日程',
            'start_date': '2030-06-20',
            'end_date': '2030-06-21',
            'status': 'upcoming',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_same_dates_different_space_is_allowed(self):
        response = self.client.post('/api/reservations/', {
            'space': self.other_space.id,
            'user': self.member.id,
            'purpose': '別スペース',
            'start_date': '2030-06-10',
            'end_date': '2030-06-12',
            'status': 'upcoming',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_cancelled_reservation_does_not_block_overlap(self):
        Reservation.objects.filter(purpose='既存予約').update(status='cancelled')
        response = self.client.post('/api/reservations/', {
            'space': self.space.id,
            'user': self.member.id,
            'purpose': '再予約',
            'start_date': '2030-06-11',
            'end_date': '2030-06-13',
            'status': 'upcoming',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class ReservationHistoryTests(BaseAPITestCase):
    def test_create_records_history(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post('/api/reservations/', {
            'space': self.space.id,
            'user': self.member.id,
            'purpose': '履歴テスト',
            'start_date': '2030-07-01',
            'end_date': '2030-07-02',
            'status': 'upcoming',
        })
        reservation_id = response.data['id']
        history = ReservationHistory.objects.filter(reservation_id=reservation_id)
        self.assertEqual(history.count(), 1)
        self.assertEqual(history.first().action, ReservationHistory.Action.CREATED)
        self.assertEqual(history.first().user, self.member)

    def test_edit_records_updated_action(self):
        reservation = Reservation.objects.create(
            space=self.space, user=self.member, purpose='編集前',
            start_date='2030-08-01', end_date='2030-08-02', status='upcoming',
        )
        self.client.force_authenticate(user=self.member)
        self.client.patch(f'/api/reservations/{reservation.id}/', {'purpose': '編集後'})
        entry = ReservationHistory.objects.filter(reservation=reservation).latest('created_at')
        self.assertEqual(entry.action, ReservationHistory.Action.UPDATED)
        self.assertEqual(entry.user, self.member)

    def test_cancel_records_cancelled_action_by_admin(self):
        reservation = Reservation.objects.create(
            space=self.space, user=self.member, purpose='キャンセル対象',
            start_date='2030-09-01', end_date='2030-09-02', status='upcoming',
        )
        self.client.force_authenticate(user=self.admin)
        self.client.patch(f'/api/reservations/{reservation.id}/', {'status': 'cancelled'})
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
            'status': 'upcoming',
        })
        reservation_id = create_response.data['id']
        self.client.patch(f'/api/reservations/{reservation_id}/', {'purpose': '履歴確認2'})
        response = self.client.get(f'/api/reservations/{reservation_id}/history/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        actions = [row['action'] for row in response.data]
        self.assertEqual(actions, ['updated', 'created'])
