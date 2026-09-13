from rest_framework.test import APITestCase

from core.models import Area, Space, User


class BaseAPITestCase(APITestCase):
    def create_user(
        self,
        employee_number,
        name='Test User',
        role=User.Role.MEMBER,
        status=User.Status.ACTIVE,
        password=None,
    ):
        user = User.objects.create_user(employee_number=employee_number, name=name, password=password)
        user.role = role
        user.status = status
        user.save()
        return user

    def setUp(self):
        self.admin = self.create_user(
            '90001', '管理者太郎', role=User.Role.ADMIN, password='adminpass123',
        )
        self.member = self.create_user('90002', '一般花子')
        self.other_member = self.create_user('90003', '一般次郎')
        self.area = Area.objects.create(name='テストエリア', floor='1F', description='')
        self.space = Space.objects.create(
            area=self.area, name='テストスペース', capacity=4, tags=[], description='', status='available',
        )
        self.other_space = Space.objects.create(
            area=self.area, name='テストスペース2', capacity=4, tags=[], description='', status='available',
        )
