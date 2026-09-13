from rest_framework import status

from core.models import User
from .base import BaseAPITestCase


class LoginTests(BaseAPITestCase):
    def test_member_login_without_password_succeeds(self):
        response = self.client.post('/api/auth/login/', {'employee_number': self.member.employee_number})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_admin_login_without_password_fails_with_specific_message(self):
        response = self.client.post('/api/auth/login/', {'employee_number': self.admin.employee_number})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('パスワード', response.data['detail'])

    def test_admin_login_with_wrong_password_fails(self):
        response = self.client.post('/api/auth/login/', {
            'employee_number': self.admin.employee_number,
            'password': 'wrong-password',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_login_with_correct_password_succeeds(self):
        response = self.client.post('/api/auth/login/', {
            'employee_number': self.admin.employee_number,
            'password': 'adminpass123',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_unknown_employee_number_fails(self):
        response = self.client.post('/api/auth/login/', {'employee_number': '00000'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_inactive_member_cannot_login(self):
        inactive = self.create_user('90004', '退職済み', status=User.Status.INACTIVE)
        response = self.client.post('/api/auth/login/', {'employee_number': inactive.employee_number})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_inactive_admin_with_correct_password_is_still_rejected(self):
        # Regression test: our own login view must call IDBackend directly rather than
        # django.contrib.auth.authenticate(), which would also try ModelBackend and let
        # an inactive user with a valid password log in (ModelBackend knows nothing
        # about our `status` field).
        inactive_admin = self.create_user(
            '90005', '退職済み管理者', role=User.Role.ADMIN, status=User.Status.INACTIVE, password='somepass',
        )
        response = self.client.post('/api/auth/login/', {
            'employee_number': inactive_admin.employee_number,
            'password': 'somepass',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UnauthenticatedAccessTests(BaseAPITestCase):
    def test_unauthenticated_request_is_rejected(self):
        response = self.client.get('/api/areas/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
