from datetime import date

from django.utils import timezone
from rest_framework import serializers

from .models import Announcement, Area, CalendarNote, Reservation, ReservationHistory, Space, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'employee_number', 'name', 'role', 'status']


class LoginSerializer(serializers.Serializer):
    employee_number = serializers.CharField()
    password = serializers.CharField(required=False, allow_blank=True, default='')


class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = ['id', 'name', 'floor', 'description']


class SpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Space
        fields = ['id', 'area', 'name', 'capacity', 'tags', 'description', 'status', 'is_closed']
        read_only_fields = ['status']


class ReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = [
            'id', 'space', 'user', 'purpose', 'start_date', 'end_date', 'status', 'is_cancelled', 'created_at',
        ]
        read_only_fields = ['status', 'created_at']

    def validate(self, attrs):
        def field(name):
            if name in attrs:
                return attrs[name]
            return getattr(self.instance, name, None)

        if 'start_date' in attrs and attrs['start_date'] < timezone.localdate():
            raise serializers.ValidationError('開始日には本日以降の日付を指定してください。')

        start = field('start_date')
        end = field('end_date')
        if start is not None and end is not None and end < start:
            raise serializers.ValidationError('終了日は開始日以降の日付を指定してください。')

        if field('is_cancelled'):
            return attrs

        space = field('space')

        others = Reservation.objects.filter(space=space, is_cancelled=False)
        if self.instance:
            others = others.exclude(pk=self.instance.pk)

        for other in others:
            if start <= other.end_date and other.start_date <= end:
                raise serializers.ValidationError(
                    f'この期間は「{other.purpose}」（{other.start_date}〜{other.end_date}）と重複しています。'
                )

        return attrs


class ReservationHistorySerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = ReservationHistory
        fields = ['id', 'action', 'user_name', 'created_at']

    def get_user_name(self, obj):
        return obj.user.name if obj.user else '不明なユーザー'


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'body', 'category', 'published_at',
            'banner_enabled', 'banner_start_date', 'banner_end_date',
        ]

    def validate(self, attrs):
        def field(name):
            if name in attrs:
                return attrs[name]
            return getattr(self.instance, name, None)

        banner_start = field('banner_start_date')
        banner_end = field('banner_end_date')
        if banner_start is not None and banner_end is not None and banner_end < banner_start:
            raise serializers.ValidationError('バナー表示終了日は開始日以降の日付を指定してください。')

        if not field('banner_enabled'):
            return attrs

        my_start = banner_start or date.min
        my_end = banner_end or date.max

        others = Announcement.objects.filter(banner_enabled=True)
        if self.instance:
            others = others.exclude(pk=self.instance.pk)

        for other in others:
            other_start = other.banner_start_date or date.min
            other_end = other.banner_end_date or date.max
            if my_start <= other_end and other_start <= my_end:
                raise serializers.ValidationError(
                    f'バナー表示期間が「{other.title}」と重複しています。'
                )

        return attrs


class CalendarNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarNote
        fields = ['id', 'date', 'holiday_name', 'memo']
