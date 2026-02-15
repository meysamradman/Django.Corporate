from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.permissions import AllowAny
from rest_framework.parsers import JSONParser
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError, AuthenticationFailed

from src.core.responses.response import APIResponse
from src.core.security.captcha.messages import CAPTCHA_ERRORS
from src.core.security.captcha.services import CaptchaService
from src.core.security.throttling import AdminLoginThrottle
from src.core.utils.validation_helpers import extract_validation_message
from src.user.messages import AUTH_ERRORS, AUTH_SUCCESS
from src.user.serializers.admin.admin_password_reset_serializer import (
    AdminPasswordResetRequestSerializer,
    AdminPasswordResetVerifySerializer,
    AdminPasswordResetConfirmSerializer,
)
from src.user.services.admin.admin_password_reset_service import AdminPasswordResetService


@method_decorator(csrf_exempt, name='dispatch')
class AdminPasswordResetRequestOTPView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [AdminLoginThrottle]
    parser_classes = [JSONParser]

    def post(self, request):
        serializer = AdminPasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=serializer.errors,
                status_code=400,
            )

        mobile = serializer.validated_data.get('mobile')
        captcha_id = serializer.validated_data.get('captcha_id')
        captcha_answer = serializer.validated_data.get('captcha_answer')

        if not CaptchaService.verify_captcha(captcha_id, captcha_answer):
            return APIResponse.error(
                message=CAPTCHA_ERRORS["captcha_invalid"],
                status_code=400,
            )

        try:
            AdminPasswordResetService.request_reset_otp(mobile)
            return APIResponse.success(
                message=AUTH_SUCCESS.get("otp_sent"),
                status_code=200,
            )
        except Exception as e:
            return APIResponse.error(
                message=extract_validation_message(e, AUTH_ERRORS.get("otp_send_failed")),
                status_code=400,
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminPasswordResetVerifyOTPView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [AdminLoginThrottle]
    parser_classes = [JSONParser]

    def post(self, request):
        serializer = AdminPasswordResetVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=serializer.errors,
                status_code=400,
            )

        mobile = serializer.validated_data.get('mobile')
        otp_code = serializer.validated_data.get('otp_code')

        try:
            reset_token = AdminPasswordResetService.verify_reset_otp(mobile, otp_code)
            return APIResponse.success(
                message=AUTH_SUCCESS.get("otp_verified"),
                data={"reset_token": reset_token},
                status_code=200,
            )
        except AuthenticationFailed as e:
            return APIResponse.error(
                message=extract_validation_message(e, AUTH_ERRORS["auth_not_authorized"]),
                status_code=403,
            )
        except (ValidationError, DjangoValidationError) as e:
            return APIResponse.error(
                message=extract_validation_message(e, AUTH_ERRORS["otp_invalid"]),
                status_code=400,
            )
        except Exception:
            return APIResponse.error(
                message=AUTH_ERRORS.get("otp_invalid"),
                status_code=400,
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminPasswordResetConfirmView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [AdminLoginThrottle]
    parser_classes = [JSONParser]

    def post(self, request):
        serializer = AdminPasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=serializer.errors,
                status_code=400,
            )

        mobile = serializer.validated_data.get('mobile')
        reset_token = serializer.validated_data.get('reset_token')
        new_password = serializer.validated_data.get('new_password')

        try:
            AdminPasswordResetService.confirm_password_reset(mobile, reset_token, new_password)
            return APIResponse.success(
                message=AUTH_SUCCESS.get("auth_profile_updated"),
                status_code=200,
            )
        except AuthenticationFailed as e:
            return APIResponse.error(
                message=extract_validation_message(e, AUTH_ERRORS["auth_not_authorized"]),
                status_code=403,
            )
        except (ValidationError, DjangoValidationError) as e:
            return APIResponse.error(
                message=extract_validation_message(e, AUTH_ERRORS["auth_invalid_token"]),
                status_code=400,
            )
        except Exception:
            return APIResponse.error(
                message=AUTH_ERRORS.get("auth_invalid_token"),
                status_code=400,
            )
