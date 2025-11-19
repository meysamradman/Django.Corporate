from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.core.responses import APIResponse
from src.user.serializers.admin.admin_login_serializer import AdminLoginSerializer
from src.user.services.admin.admin_auth_service import AdminAuthService
from src.user.messages import AUTH_ERRORS, AUTH_SUCCESS
from django.middleware.csrf import get_token
from src.core.security.captcha.services import CaptchaService
from src.core.security.captcha.messages import CAPTCHA_ERRORS
from src.core.security.throttling import AdminLoginThrottle
from src.user.permissions.config import BASE_ADMIN_PERMISSIONS

# For backward compatibility - simple version
BASE_ADMIN_PERMISSIONS_SIMPLE = list(BASE_ADMIN_PERMISSIONS.keys())
from src.user.models import AdminUserRole
import os


@method_decorator(csrf_exempt, name='dispatch')
class AdminLoginView(APIView):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = []
    throttle_classes = [AdminLoginThrottle]  # Enable throttling for additional security
    parser_classes = [JSONParser]

    def get(self, request):
        """Return CSRF token for the login form."""
        csrf_token = get_token(request)
        return APIResponse.success(
            message="CSRF token generated successfully",
            data={'csrf_token': csrf_token}
        )

    def post(self, request):
        """Authenticate admin via mobile/password or OTP."""
        serializer = AdminLoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=serializer.errors
            )
            
        try:
            mobile = serializer.validated_data.get('mobile')
            password = serializer.validated_data.get('password')
            captcha_id = serializer.validated_data.get('captcha_id')
            captcha_answer = serializer.validated_data.get('captcha_answer')
            otp_code = serializer.validated_data.get('otp_code')
            
            # Validate CAPTCHA when enabled for additional security
            if not CaptchaService.verify_captcha(captcha_id, captcha_answer):
                return APIResponse.error(
                    message=CAPTCHA_ERRORS.get("captcha_invalid"),
                    status_code=400
                )
            
            admin, session_key = AdminAuthService.authenticate_admin(
                mobile=mobile,
                password=password,
                otp_code=otp_code,
                request=request
            )
            
            if admin:
                permissions_data = None
                if admin.user_type == 'admin' or admin.is_staff:
                    try:
                        is_superadmin = bool(
                            getattr(admin, "is_superuser", False) or getattr(admin, "is_admin_full", False)
                        )
                        
                        if is_superadmin:
                            permissions_data = {
                                "access_level": "super_admin",
                                "roles": ["super_admin"],
                                "permissions_count": "unlimited",
                                "has_permissions": True,
                                "base_permissions": []
                            }
                        else:
                            assigned_roles = []
                            try:
                                if hasattr(admin, 'adminuserrole_set'):
                                    user_role_assignments = AdminUserRole.objects.filter(
                                        user=admin,
                                        is_active=True
                                    ).select_related('role')
                                    assigned_roles = [ur.role.name for ur in user_role_assignments]
                            except Exception:
                                pass
                            
                            permissions_data = {
                                "access_level": "admin",
                                "roles": assigned_roles,
                                "permissions_count": len(assigned_roles) * 10 if assigned_roles else 0,
                                "has_permissions": len(assigned_roles) > 0,
                                "base_permissions": BASE_ADMIN_PERMISSIONS_SIMPLE
                            }
                    except Exception as e:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.error(f"Error getting permissions for admin {admin.id}: {e}", exc_info=True)
                
                # Set session cookie
                response = APIResponse.success(
                    message=AUTH_SUCCESS["auth_logged_in"],
                    data={
                        'user_id': admin.id,
                        'is_superuser': admin.is_superuser,
                        'user_type': admin.user_type,
                        'permissions': permissions_data  # فقط برای ادمین‌ها
                    }
                )
                
                # Issue CSRF token only after successful authentication
                csrf_token = get_token(request)
                response.set_cookie(
                    'csrftoken',
                    csrf_token,
                    max_age=3600,  # 1 hour
                    httponly=False,  # Frontend needs to read this
                    samesite='Strict',
                    secure=not os.getenv('DEBUG', 'True').lower() == 'true'
                )
                
                return response
            else:
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_invalid_credentials"],
                    status_code=401
                )
        except Exception as e:
            return APIResponse.error(message=AUTH_ERRORS["auth_invalid_credentials"])