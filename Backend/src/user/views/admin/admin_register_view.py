from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.core.responses import APIResponse
from src.user.serializers.admin.admin_register_serializer import AdminRegisterSerializer
from src.user.services.admin.admin_register_service import AdminRegisterService
from src.user.messages import AUTH_ERRORS, AUTH_SUCCESS
from src.user.models import User
from src.user.auth.auth_mixin import UserAuthMixin
from src.user.authorization import SimpleAdminPermission


@method_decorator(ensure_csrf_cookie, name='dispatch')
class AdminRegisterView(UserAuthMixin, APIView):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [SimpleAdminPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = AdminRegisterSerializer(data=request.data, context={'admin_user': request.user})
        
        if not serializer.is_valid():
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=serializer.errors
            )
            
        try:
            admin = AdminRegisterService.register_admin_from_serializer(
                validated_data=serializer.validated_data,
                admin_user=request.user
            )
            
            from src.user.serializers.admin.admin_management_serializer import AdminDetailSerializer
            response_serializer = AdminDetailSerializer(admin, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["user_created_successfully"],
                data=response_serializer.data
            )
        except Exception as e:
            return APIResponse.error(message=AUTH_ERRORS["error_occurred"])