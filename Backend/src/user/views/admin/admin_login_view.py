from django.contrib.auth import authenticate, login
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from src.core.security.captcha import CaptchaRequiredMixin
from src.core.security.throttling import AdminLoginThrottle
from src.user.serializers.schema.admin_login_schema import admin_login_schema
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
from src.user.serializers.admin.admin_login_serializer import AdminLoginSerializer
from src.user.models import User


@method_decorator(ensure_csrf_cookie, name='dispatch')
class AdminLoginView(CaptchaRequiredMixin, APIView):
    permission_classes = [AllowAny]
    authentication_classes = [SessionAuthentication]
    throttle_classes = [AdminLoginThrottle]

    @admin_login_schema
    def post(self, request):
        # Validate CAPTCHA first for admin login
        captcha_error = self.captcha_required(request.data)
        if captcha_error:
            return captcha_error
            
        serializer = AdminLoginSerializer(data=request.data)
        if serializer.is_valid():
            mobile = serializer.validated_data['mobile']
            password = serializer.validated_data.get('password')
            login_type = serializer.validated_data.get('login_type', 'password')

            try:
                # Admin login only with mobile number
                try:
                    user_to_auth = User.objects.get(
                        mobile=mobile, 
                        is_staff=True,
                        user_type='admin',
                        is_admin_active=True
                    )
                except User.DoesNotExist:
                    raise AuthenticationFailed(AUTH_ERRORS["auth_invalid_credentials"])
                except User.MultipleObjectsReturned:
                    raise AuthenticationFailed(AUTH_ERRORS["auth_invalid_credentials"])

                # Handle different login types
                if login_type == 'password':
                    user = authenticate(request, username=user_to_auth.mobile, password=password)
                elif login_type == 'otp':
                    # OTP verification would happen here
                    # For now, we'll assume OTP is verified
                    otp = serializer.validated_data.get('otp')
                    # TODO: Implement OTP verification
                    user = user_to_auth  # Placeholder
                else:
                    raise AuthenticationFailed(AUTH_ERRORS["auth_invalid_login_type"])

                if user is not None and user.is_staff and user.has_admin_access():
                    if user.is_active:
                        login(request, user)
                        # Remove csrf_token from response for security
                        response_data = {
                            "user": {
                                "id": user.id,
                                "mobile": user.mobile,
                                "email": user.email,
                                "is_staff": user.is_staff,
                                "is_superuser": user.is_superuser,
                            }
                        }
                        # Now using standard DRF Response - renderer will format it
                        return Response(response_data, status=status.HTTP_200_OK)
                    else:
                        raise AuthenticationFailed(AUTH_ERRORS["auth_inactive_account"])

            except AuthenticationFailed as e:
                # Renderer will format this error response
                return Response({"detail": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
            except Exception as e:
                # Renderer will format this error response
                return Response({"detail": "Internal server error."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Renderer will format this validation error response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)