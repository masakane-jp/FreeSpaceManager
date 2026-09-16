from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdminRoleOrReadOnly(BasePermission):
    """Any authenticated user can read; only role='admin' users can write."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role == 'admin'


class IsOwnerOrAdmin(BasePermission):
    """Any authenticated user can list/create (space occupancy display needs to show
    other users' reservations); viewing, editing or cancelling a specific reservation
    (including its history) requires being its own user or an admin."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user.id or request.user.role == 'admin'
