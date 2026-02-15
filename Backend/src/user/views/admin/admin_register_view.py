from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.core.responses.response import APIResponse
from src.user.serializers.admin.admin_register_serializer import AdminRegisterSerializer
from src.user.serializers.admin.admin_management_serializer import AdminDetailSerializer
from src.user.services.admin.admin_register_service import AdminRegisterService
from src.user.messages import AUTH_ERRORS, AUTH_SUCCESS
from src.user.models import User
from src.user.auth.admin_auth_mixin import AdminAuthMixin
from src.user.access_control import SimpleAdminPermission

@method_decorator(ensure_csrf_cookie, name='dispatch')
class AdminRegisterView(AdminAuthMixin, APIView):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [SimpleAdminPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @staticmethod
    def _normalize_validation_error(error):
        if isinstance(error, DRFValidationError):
            detail = error.detail
            if isinstance(detail, dict):
                return detail
            if isinstance(detail, list):
                return {'non_field_errors': detail}
            return {'non_field_errors': [str(detail)]}

        if isinstance(error, DjangoValidationError):
            if hasattr(error, 'message_dict'):
                return error.message_dict
            if hasattr(error, 'messages'):
                return {'non_field_errors': error.messages}
            return {'non_field_errors': [str(error)]}

        return {'non_field_errors': [str(error)]}

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
            
            response_serializer = AdminDetailSerializer(admin, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["user_created_successfully"],
                data=response_serializer.data
            )
        except (DjangoValidationError, DRFValidationError) as e:
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=self._normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS["error_occurred"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )