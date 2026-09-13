from django.contrib.auth import get_user_model

User = get_user_model()


class IDBackend:
    """Authenticate using only the employee number, no password.

    This app runs on a closed internal network, so the employee number
    itself is treated as the sole credential - there is no separate
    password to check.
    """

    def authenticate(self, request, employee_number=None, password=None, **kwargs):
        if not employee_number:
            return None
        try:
            user = User.objects.get(employee_number=employee_number)
        except User.DoesNotExist:
            return None
        if user.status != User.Status.ACTIVE:
            return None
        if user.role == User.Role.ADMIN:
            if not password or not user.check_password(password):
                return None
        return user

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
