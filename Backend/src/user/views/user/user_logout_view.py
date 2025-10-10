from src.user.views.base_logout_view import BaseLogoutView
from src.user.services import BaseLogoutService
from src.user.serializers import BaseLogoutSerializer
from src.user.auth import UserJWTAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication

class UserLogoutView(BaseLogoutView):
    authentication_classes = [UserJWTAuthentication, JWTAuthentication]
    service_class = BaseLogoutService
    serializer_class = BaseLogoutSerializer