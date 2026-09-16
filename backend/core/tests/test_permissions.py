from rest_framework import status

from core.models import Reservation, User
from .base import BaseAPITestCase


class AdminRoleOrReadOnlyTests(BaseAPITestCase):
    def test_member_can_read_areas(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.get('/api/areas/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_member_cannot_create_area(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post('/api/areas/', {'name': 'X', 'floor': '1F', 'description': ''})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_area(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/areas/', {'name': 'X', 'floor': '1F', 'description': ''})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class ReservationOwnershipTests(BaseAPITestCase):
    def test_member_can_create_own_reservation(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post('/api/reservations/', {
            'space': self.space.id,
            'user': self.member.id,
            'purpose': 'テスト予約',
            'start_date': '2030-01-01',
            'end_date': '2030-01-02',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_member_cannot_impersonate_another_user_on_create(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post('/api/reservations/', {
            'space': self.space.id,
            'user': self.other_member.id,
            'purpose': 'なりすましテスト',
            'start_date': '2030-02-01',
            'end_date': '2030-02-02',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user'], self.member.id)

    def test_admin_can_create_reservation_for_another_user(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/reservations/', {
            'space': self.space.id,
            'user': self.member.id,
            'purpose': '管理者代理登録',
            'start_date': '2030-03-01',
            'end_date': '2030-03-02',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user'], self.member.id)

    def test_member_cannot_update_others_reservation(self):
        reservation = Reservation.objects.create(
            space=self.space, user=self.other_member, purpose='他人の予約',
            start_date='2030-04-01', end_date='2030-04-02',
        )
        self.client.force_authenticate(user=self.member)
        response = self.client.patch(f'/api/reservations/{reservation.id}/', {'is_cancelled': True})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_update_others_reservation(self):
        reservation = Reservation.objects.create(
            space=self.space, user=self.member, purpose='本人の予約',
            start_date='2030-05-01', end_date='2030-05-02',
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f'/api/reservations/{reservation.id}/', {'is_cancelled': True})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_member_can_list_all_reservations_for_space_occupancy_display(self):
        Reservation.objects.create(
            space=self.space, user=self.other_member, purpose='他人の予約（一覧表示用）',
            start_date='2030-06-01', end_date='2030-06-02',
        )
        self.client.force_authenticate(user=self.member)
        response = self.client.get('/api/reservations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(r['purpose'] == '他人の予約（一覧表示用）' for r in response.data))

    def test_member_cannot_view_single_detail_of_others_reservation(self):
        reservation = Reservation.objects.create(
            space=self.space, user=self.other_member, purpose='他人の予約（詳細）',
            start_date='2030-07-01', end_date='2030-07-02',
        )
        self.client.force_authenticate(user=self.member)
        response = self.client.get(f'/api/reservations/{reservation.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_member_cannot_view_history_of_others_reservation(self):
        reservation = Reservation.objects.create(
            space=self.space, user=self.other_member, purpose='他人の予約（履歴）',
            start_date='2030-07-05', end_date='2030-07-06',
        )
        self.client.force_authenticate(user=self.member)
        response = self.client.get(f'/api/reservations/{reservation.id}/history/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_member_can_view_own_reservation_detail_and_history(self):
        reservation = Reservation.objects.create(
            space=self.space, user=self.member, purpose='自分の予約',
            start_date='2030-07-10', end_date='2030-07-11',
        )
        self.client.force_authenticate(user=self.member)
        detail_response = self.client.get(f'/api/reservations/{reservation.id}/')
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        history_response = self.client.get(f'/api/reservations/{reservation.id}/history/')
        self.assertEqual(history_response.status_code, status.HTTP_200_OK)


class SuperuserVisibilityTests(BaseAPITestCase):
    def test_superuser_is_excluded_from_user_list(self):
        User.objects.create_superuser(employee_number='sys-admin', name='System', password='x')
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/users/')
        employee_numbers = [row['employee_number'] for row in response.data]
        self.assertNotIn('sys-admin', employee_numbers)
