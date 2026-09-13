import csv
import io

from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth_backends import IDBackend
from .models import Announcement, Area, CalendarNote, FloorMap, Reservation, ReservationHistory, Space, User
from .permissions import IsAdminRoleOrReadOnly, IsOwnerOrAdmin
from .serializers import (
    AnnouncementSerializer,
    AreaSerializer,
    CalendarNoteSerializer,
    LoginSerializer,
    ReservationHistorySerializer,
    ReservationSerializer,
    SpaceSerializer,
    UserSerializer,
)


class UserViewSet(viewsets.ModelViewSet):
    # Exclude true Django superusers (e.g. the one used to log into /admin/ directly):
    # those are a separate concept from this app's business "admin" role and should
    # never appear in the business user list.
    queryset = User.objects.filter(is_superuser=False)
    serializer_class = UserSerializer
    permission_classes = [IsAdminRoleOrReadOnly]

    @action(detail=False, methods=['get'], url_path='export_csv')
    def export_csv(self, request):
        if request.user.role != User.Role.ADMIN:
            return Response(status=status.HTTP_403_FORBIDDEN)

        response = HttpResponse(content_type='text/csv')
        response.write('﻿')  # BOM, so Excel opens it as UTF-8
        response['Content-Disposition'] = 'attachment; filename="users.csv"'
        writer = csv.writer(response)
        writer.writerow(['employee_number', 'name', 'role', 'status'])
        for user in self.get_queryset():
            writer.writerow([user.employee_number, user.name, user.role, user.status])
        return response

    @action(detail=False, methods=['post'], url_path='import_csv', parser_classes=[MultiPartParser])
    def import_csv(self, request):
        if request.user.role != User.Role.ADMIN:
            return Response(status=status.HTTP_403_FORBIDDEN)

        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'CSVファイルが必要です。'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded = file.read().decode('utf-8-sig')
        except UnicodeDecodeError:
            return Response(
                {'detail': 'ファイルの文字コードを読み取れませんでした。UTF-8で保存してください。'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reader = csv.DictReader(io.StringIO(decoded))
        created = 0
        updated = 0
        errors = []

        for row_number, row in enumerate(reader, start=2):
            employee_number = (row.get('employee_number') or '').strip()
            name = (row.get('name') or '').strip()
            role = (row.get('role') or '').strip() or User.Role.MEMBER
            row_status = (row.get('status') or '').strip() or User.Status.ACTIVE

            if not employee_number or not name:
                errors.append(f'{row_number}行目: employee_number と name は必須です。')
                continue
            if role not in User.Role.values:
                errors.append(f'{row_number}行目: role の値が不正です（{role}）。')
                continue
            if row_status not in User.Status.values:
                errors.append(f'{row_number}行目: status の値が不正です（{row_status}）。')
                continue
            if User.objects.filter(employee_number=employee_number, is_superuser=True).exists():
                errors.append(f'{row_number}行目: この社員番号は使用できません（{employee_number}）。')
                continue

            _, is_created = User.objects.update_or_create(
                employee_number=employee_number,
                defaults={'name': name, 'role': role, 'status': row_status},
            )
            if is_created:
                created += 1
            else:
                updated += 1

        return Response({'created': created, 'updated': updated, 'errors': errors})


class AreaViewSet(viewsets.ModelViewSet):
    queryset = Area.objects.all()
    serializer_class = AreaSerializer
    permission_classes = [IsAdminRoleOrReadOnly]


class SpaceViewSet(viewsets.ModelViewSet):
    queryset = Space.objects.all()
    serializer_class = SpaceSerializer
    permission_classes = [IsAdminRoleOrReadOnly]


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [IsOwnerOrAdmin]

    def perform_create(self, serializer):
        if self.request.user.role == 'admin' and 'user' in self.request.data:
            instance = serializer.save()
        else:
            instance = serializer.save(user=self.request.user)
        ReservationHistory.objects.create(
            reservation=instance, user=self.request.user, action=ReservationHistory.Action.CREATED,
        )

    def perform_update(self, serializer):
        is_cancel = serializer.validated_data.get('status') == Reservation.Status.CANCELLED
        instance = serializer.save()
        ReservationHistory.objects.create(
            reservation=instance,
            user=self.request.user,
            action=ReservationHistory.Action.CANCELLED if is_cancel else ReservationHistory.Action.UPDATED,
        )

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        reservation = self.get_object()
        serializer = ReservationHistorySerializer(reservation.history.all(), many=True)
        return Response(serializer.data)


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAdminRoleOrReadOnly]


class CalendarNoteViewSet(viewsets.ModelViewSet):
    queryset = CalendarNote.objects.all()
    serializer_class = CalendarNoteSerializer
    permission_classes = [IsAdminRoleOrReadOnly]


class FloorMapView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAdminRoleOrReadOnly]

    def get(self, request):
        floor_map = FloorMap.objects.first()
        image_url = request.build_absolute_uri(floor_map.image.url) if floor_map and floor_map.image else None
        return Response({'image': image_url})

    def post(self, request):
        file = request.FILES.get('image')
        if not file:
            return Response({'detail': '画像ファイルが必要です。'}, status=status.HTTP_400_BAD_REQUEST)
        floor_map = FloorMap.objects.first() or FloorMap()
        floor_map.image = file
        floor_map.save()
        return Response({'image': request.build_absolute_uri(floor_map.image.url)})

    def delete(self, request):
        FloorMap.objects.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employee_number = serializer.validated_data['employee_number']
        password = serializer.validated_data['password']

        candidate = User.objects.filter(employee_number=employee_number).first()
        if candidate and candidate.role == User.Role.ADMIN and not password:
            return Response(
                {'detail': '管理者アカウントはパスワードの入力が必要です。'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Use IDBackend directly, not django.contrib.auth.authenticate(): the generic
        # dispatcher also tries ModelBackend as a fallback, which knows nothing about
        # our `status` field and would let an inactive user with a set password in.
        user = IDBackend().authenticate(request, employee_number=employee_number, password=password)
        if user is None:
            return Response(
                {'detail': '社員番号またはパスワードが正しくないか、利用できません。'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
