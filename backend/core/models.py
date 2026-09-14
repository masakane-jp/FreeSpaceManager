from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, employee_number, name, password=None, **extra_fields):
        if not employee_number:
            raise ValueError('employee_number is required')
        user = self.model(employee_number=employee_number, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, employee_number, name, password=None, **extra_fields):
        extra_fields.setdefault('role', User.Role.ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(employee_number, name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        MEMBER = 'member', '一般メンバー'
        ADMIN = 'admin', '管理者'

    class Status(models.TextChoices):
        ACTIVE = 'active', '在籍中'
        INACTIVE = 'inactive', '退職'

    employee_number = models.CharField('社員番号', max_length=20, unique=True)
    name = models.CharField('氏名', max_length=100)
    role = models.CharField('権限', max_length=10, choices=Role.choices, default=Role.MEMBER)
    status = models.CharField('状態', max_length=10, choices=Status.choices, default=Status.ACTIVE)
    is_staff = models.BooleanField('Django管理サイトへのアクセス', default=False)

    objects = UserManager()

    USERNAME_FIELD = 'employee_number'
    REQUIRED_FIELDS = ['name']

    @property
    def is_active(self):
        # AbstractBaseUserは`is_active = True`という素の属性しか持たないため、
        # Django管理サイトやDRFのTokenAuthenticationが参照する`is_active`を
        # 業務上の在籍状態（status）と同じ意味にするためプロパティで上書きしている。
        # 実DBカラムを別に持たせると status と食い違う状態が発生しうるため、
        # 真実の源は常に status 一本にする。
        return self.status == self.Status.ACTIVE

    class Meta:
        verbose_name = 'ユーザー'
        verbose_name_plural = 'ユーザー'

    def __str__(self):
        return f'{self.name} ({self.employee_number})'


class Area(models.Model):
    name = models.CharField('名称', max_length=100)
    floor = models.CharField('フロア', max_length=50)
    description = models.TextField('説明', blank=True)

    class Meta:
        verbose_name = 'エリア'
        verbose_name_plural = 'エリア'

    def __str__(self):
        return self.name


class Space(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'available', '空き'
        IN_USE = 'in_use', '使用中'
        RESERVED = 'reserved', '予約済み'
        CLOSED = 'closed', '停止中'

    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='spaces', verbose_name='エリア')
    name = models.CharField('名称', max_length=100)
    capacity = models.PositiveIntegerField('定員', default=0)
    tags = models.JSONField('タグ', default=list, blank=True)
    description = models.TextField('説明', blank=True)
    status = models.CharField('状態', max_length=10, choices=Status.choices, default=Status.AVAILABLE)

    class Meta:
        verbose_name = 'スペース'
        verbose_name_plural = 'スペース'

    def __str__(self):
        return self.name


class Reservation(models.Model):
    class Status(models.TextChoices):
        UPCOMING = 'upcoming', '予約中'
        ACTIVE = 'active', '利用中'
        ENDED = 'ended', '利用済み'
        CANCELLED = 'cancelled', 'キャンセル'

    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='reservations', verbose_name='スペース')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reservations', verbose_name='予約者')
    purpose = models.CharField('利用目的', max_length=200)
    start_date = models.DateField('開始日')
    end_date = models.DateField('終了日')
    status = models.CharField('状態', max_length=10, choices=Status.choices, default=Status.UPCOMING)
    created_at = models.DateTimeField('登録日時', auto_now_add=True)

    class Meta:
        verbose_name = '予約'
        verbose_name_plural = '予約'

    def __str__(self):
        return f'{self.purpose} ({self.space})'


class ReservationHistory(models.Model):
    class Action(models.TextChoices):
        CREATED = 'created', '作成'
        UPDATED = 'updated', '編集'
        CANCELLED = 'cancelled', 'キャンセル'

    reservation = models.ForeignKey(
        Reservation, on_delete=models.CASCADE, related_name='history', verbose_name='予約',
    )
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='+', verbose_name='操作者',
    )
    action = models.CharField('操作種別', max_length=10, choices=Action.choices)
    created_at = models.DateTimeField('日時', auto_now_add=True)

    class Meta:
        verbose_name = '予約変更履歴'
        verbose_name_plural = '予約変更履歴'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.reservation} - {self.action} by {self.user}'


class Announcement(models.Model):
    class Category(models.TextChoices):
        NOTICE = 'お知らせ', 'お知らせ'
        MAINTENANCE = 'メンテナンス', 'メンテナンス'
        EVENT = 'イベント', 'イベント'
        OPERATION_CHANGE = '運用変更', '運用変更'

    title = models.CharField('タイトル', max_length=200)
    body = models.TextField('本文')
    category = models.CharField('カテゴリ', max_length=20, choices=Category.choices)
    published_at = models.DateField('公開日')
    banner_enabled = models.BooleanField('緊急バナー表示', default=False)
    banner_start_date = models.DateField('バナー表示開始日', null=True, blank=True)
    banner_end_date = models.DateField('バナー表示終了日', null=True, blank=True)

    class Meta:
        verbose_name = 'お知らせ'
        verbose_name_plural = 'お知らせ'

    def __str__(self):
        return self.title


class CalendarNote(models.Model):
    date = models.DateField('日付', unique=True)
    holiday_name = models.CharField('祝日名', max_length=100, blank=True)
    memo = models.CharField('メモ', max_length=200, blank=True)

    class Meta:
        verbose_name = 'カレンダーメモ'
        verbose_name_plural = 'カレンダーメモ'

    def __str__(self):
        return str(self.date)


class FloorMap(models.Model):
    image = models.FileField('画像', upload_to='floor_map/')
    updated_at = models.DateTimeField('更新日時', auto_now=True)

    class Meta:
        verbose_name = 'フロアマップ'
        verbose_name_plural = 'フロアマップ'

    def __str__(self):
        return self.image.name
