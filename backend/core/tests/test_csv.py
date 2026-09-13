from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from core.models import User
from .base import BaseAPITestCase


def csv_file(content: str) -> SimpleUploadedFile:
    return SimpleUploadedFile('users.csv', content.encode('utf-8-sig'), content_type='text/csv')


class CsvExportTests(BaseAPITestCase):
    def test_export_requires_admin(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.get('/api/users/export_csv/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_export(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/users/export_csv/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.member.employee_number, response.content.decode('utf-8-sig'))


class CsvImportTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(user=self.admin)

    def test_import_requires_admin(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(
            '/api/users/import_csv/',
            {'file': csv_file('employee_number,name,role,status\n90099,New,member,active\n')},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_import_creates_new_user(self):
        response = self.client.post(
            '/api/users/import_csv/',
            {'file': csv_file('employee_number,name,role,status\n90099,新規太郎,member,active\n')},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['created'], 1)
        self.assertEqual(response.data['updated'], 0)
        self.assertTrue(User.objects.filter(employee_number='90099', name='新規太郎').exists())

    def test_import_updates_existing_user_by_employee_number(self):
        content = f'employee_number,name,role,status\n{self.member.employee_number},花子改,member,active\n'
        response = self.client.post('/api/users/import_csv/', {'file': csv_file(content)})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['updated'], 1)
        self.member.refresh_from_db()
        self.assertEqual(self.member.name, '花子改')

    def test_import_rejects_invalid_role(self):
        response = self.client.post(
            '/api/users/import_csv/',
            {'file': csv_file('employee_number,name,role,status\n90099,Bad,superadmin,active\n')},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['created'], 0)
        self.assertEqual(len(response.data['errors']), 1)

    def test_import_rejects_missing_required_fields(self):
        response = self.client.post(
            '/api/users/import_csv/',
            {'file': csv_file('employee_number,name,role,status\n,NoNumber,member,active\n')},
        )
        self.assertEqual(response.data['created'], 0)
        self.assertEqual(len(response.data['errors']), 1)

    def test_import_protects_superuser_employee_number(self):
        User.objects.create_superuser(employee_number='sys-admin', name='System', password='x')
        response = self.client.post(
            '/api/users/import_csv/',
            {'file': csv_file('employee_number,name,role,status\nsys-admin,Hijack,admin,active\n')},
        )
        self.assertEqual(response.data['created'], 0)
        self.assertEqual(response.data['updated'], 0)
        self.assertEqual(len(response.data['errors']), 1)
