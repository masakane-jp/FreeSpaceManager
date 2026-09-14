from rest_framework import status

from core.models import User
from .base import BaseAPITestCase


class SetPasswordTests(BaseAPITestCase):
    def test_member_cannot_set_password(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(
            f'/api/users/{self.admin.id}/set_password/', {'password': 'newpass123'},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_set_another_admin_password(self):
        other_admin = self.create_user('90004', '管理者次郎', role=User.Role.ADMIN, password='oldpass123')
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f'/api/users/{other_admin.id}/set_password/', {'password': 'newpass456'},
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        other_admin.refresh_from_db()
        self.assertTrue(other_admin.check_password('newpass456'))

    def test_weak_password_is_rejected(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f'/api/users/{self.admin.id}/set_password/', {'password': '123'},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.check_password('adminpass123'))


class IsActivePropertyTests(BaseAPITestCase):
    def test_active_status_is_active(self):
        self.assertTrue(self.member.is_active)

    def test_inactive_status_is_not_active(self):
        self.member.status = User.Status.INACTIVE
        self.member.save()
        self.assertFalse(self.member.is_active)

    def test_inactive_admin_is_rejected_by_token_authentication(self):
        self.admin.status = User.Status.INACTIVE
        self.admin.save()
        from rest_framework.authtoken.models import Token
        token = Token.objects.create(user=self.admin)
        response = self.client.get('/api/areas/', HTTP_AUTHORIZATION=f'Token {token.key}')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
