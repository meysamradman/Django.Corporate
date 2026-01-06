from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser
from src.core.responses.response import APIResponse
from src.user.serializers.admin.admin_login_serializer import AdminLoginSerializer
from src.user.services.admin.admin_auth_service import AdminAuthService
from src.user.messages import AUTH_ERRORS, AUTH_SUCCESS
from django.middleware.csrf import get_token
from src.core.security.captcha.services import CaptchaService
from src.core.security.captcha.messages import CAPTCHA_ERRORS
from src.core.security.throttling import AdminLoginThrottle
from src.user.access_control import BASE_ADMIN_PERMISSIONS
from src.user.services.admin.admin_session_service import AdminSessionService
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from django.core.exceptions import ValidationError as DjangoValidationError

BASE_ADMIN_PERMISSIONS_SIMPLE = list(BASE_ADMIN_PERMISSIONS.keys())
from src.user.models import AdminUserRole
import os


@method_decorator(csrf_exempt, name='dispatch')
class AdminLoginView(APIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = [AdminLoginThrottle]
    parser_classes = [JSONParser]

    def get(self, request):
        self._cleanup_session(request)
        
        csrf_token = get_token(request)
        response = APIResponse.success(
            message=AUTH_SUCCESS["csrf_token_retrieved"],
            data={'csrf_token': csrf_token}
        )
        
        if hasattr(request, '_session_cleaned') and request._session_cleaned:
            response.delete_cookie(
                'sessionid',
                path=settings.SESSION_COOKIE_PATH,
                domain=settings.SESSION_COOKIE_DOMAIN
            )
            response.delete_cookie(
                'csrftoken',
                path=settings.CSRF_COOKIE_PATH,
                domain=settings.CSRF_COOKIE_DOMAIN
            )
        
        return response
    
    def _cleanup_session(self, request):
        session_key = request.session.session_key
        if session_key:
            try:
                AdminSessionService.destroy_session(session_key)
            except Exception:
                pass
            try:
                request.session.flush()
                request._session_cleaned = True
            except Exception:
                pass

    def post(self, request):
        self._cleanup_session(request)
        
        ip = self._get_client_ip(request)
        mobile = None
        
        try:
            serializer = AdminLoginSerializer(data=request.data)
            
            if not serializer.is_valid():
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_validation_error"],
                    errors=serializer.errors,
                    status_code=400
                )
            
            mobile = serializer.validated_data.get('mobile')
            password = serializer.validated_data.get('password')
            captcha_id = serializer.validated_data.get('captcha_id')
            captcha_answer = serializer.validated_data.get('captcha_answer')
            otp_code = serializer.validated_data.get('otp_code')
            
            if not CaptchaService.verify_captcha(captcha_id, captcha_answer):
                return APIResponse.error(
                    message=CAPTCHA_ERRORS["captcha_invalid"],
                    status_code=400
                )
            
            admin, session_key = AdminAuthService.authenticate_admin(
                mobile=mobile,
                password=password,
                otp_code=otp_code,
                request=request
            )
            
            if admin:
                if not (admin.user_type == 'admin' and 
                        admin.is_staff and 
                        getattr(admin, 'is_admin_active', False)):
                    return APIResponse.error(
                        message="دسترسی رد شد. فقط مدیران فعال می‌توانند وارد شوند.",
                        status_code=403
                    )
                
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
                                if hasattr(admin, 'admin_user_roles'):
                                    user_role_assignments = admin.admin_user_roles.filter(
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
                    except Exception:
                        pass
                
                response = APIResponse.success(
                    message=AUTH_SUCCESS["auth_logged_in"],
                    data={
                        'user_id': admin.id,
                        'is_superuser': admin.is_superuser,
                        'user_type': admin.user_type,
                        'permissions': permissions_data
                    }
                )
                
                session_timeout = settings.ADMIN_SESSION_TIMEOUT_SECONDS
                response.set_cookie(
                    'sessionid',
                    session_key,
                    max_age=session_timeout,
                    httponly=True,
                    samesite='Lax',
                    secure=settings.SESSION_COOKIE_SECURE,
                    path=settings.SESSION_COOKIE_PATH,
                    domain=settings.SESSION_COOKIE_DOMAIN
                )
                
                csrf_token = get_token(request)
                csrf_max_age = settings.ADMIN_SESSION_TIMEOUT_SECONDS
                response.set_cookie(
                    'csrftoken',
                    csrf_token,
                    max_age=csrf_max_age,
                    httponly=False,
                    samesite='Lax',
                    secure=settings.CSRF_COOKIE_SECURE,
                    path=settings.CSRF_COOKIE_PATH,
                    domain=settings.CSRF_COOKIE_DOMAIN
                )
                
                return response
            else:
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_invalid_credentials"],
                    status_code=401
                )
        except AuthenticationFailed as e:
            return APIResponse.error(
                message=str(e) if str(e) else AUTH_ERRORS["auth_invalid_credentials"],
                status_code=401
            )
        except (ValidationError, DjangoValidationError) as e:
            return APIResponse.error(
                message=str(e) if str(e) else AUTH_ERRORS["auth_validation_error"],
                status_code=400
            )
        except Exception as e:
            pass
            return APIResponse.error(
                message=AUTH_ERRORS["auth_invalid_credentials"],
                status_code=500
            )
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        return ip