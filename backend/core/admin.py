from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm as BaseUserCreationForm

from .models import Announcement, Area, CalendarNote, FloorMap, Reservation, ReservationHistory, Space, User


class UserCreationForm(BaseUserCreationForm):
    class Meta(BaseUserCreationForm.Meta):
        model = User
        fields = ('employee_number', 'name')


class UserAdmin(BaseUserAdmin):
    add_form = UserCreationForm
    model = User
    list_display = ('employee_number', 'name', 'role', 'status', 'is_staff')
    list_filter = ('role', 'status', 'is_staff', 'is_superuser')
    search_fields = ('employee_number', 'name')
    ordering = ('employee_number',)
    fieldsets = (
        (None, {'fields': ('employee_number', 'password')}),
        ('個人情報', {'fields': ('name',)}),
        ('権限', {'fields': ('role', 'status', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('その他', {'fields': ('last_login',)}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': ('employee_number', 'name', 'password1', 'password2')}),
    )


admin.site.register(User, UserAdmin)
admin.site.register(Area)
admin.site.register(Space)
admin.site.register(Reservation)
admin.site.register(ReservationHistory)
admin.site.register(Announcement)
admin.site.register(CalendarNote)
admin.site.register(FloorMap)
