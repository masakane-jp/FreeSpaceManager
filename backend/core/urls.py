from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register('users', views.UserViewSet)
router.register('areas', views.AreaViewSet)
router.register('spaces', views.SpaceViewSet)
router.register('reservations', views.ReservationViewSet)
router.register('announcements', views.AnnouncementViewSet)
router.register('calendar-notes', views.CalendarNoteViewSet)

urlpatterns = router.urls + [
    path('auth/login/', views.LoginView.as_view()),
    path('auth/logout/', views.LogoutView.as_view()),
    path('auth/me/', views.MeView.as_view()),
    path('floor-map/', views.FloorMapView.as_view()),
]
