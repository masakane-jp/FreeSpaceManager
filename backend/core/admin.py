from django.contrib import admin

from .models import Announcement, Area, CalendarNote, FloorMap, Reservation, ReservationHistory, Space, User

admin.site.register(User)
admin.site.register(Area)
admin.site.register(Space)
admin.site.register(Reservation)
admin.site.register(ReservationHistory)
admin.site.register(Announcement)
admin.site.register(CalendarNote)
admin.site.register(FloorMap)
