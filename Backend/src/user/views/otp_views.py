from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from src.core.responses import APIResponse
from src.user.auth import UserCookie
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
from src.user.serializers import SendOTPSerializer, VerifyOTPSerializer
from src.user.services import OTPService
from src.core.security.throttling import CaptchaThrottle

from src.user.utils.otp_validator import get_otp_length


class SendOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [CaptchaThrottle]  # Enable throttling to reduce spam attempts

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if serializer.is_valid():
            identifier = serializer.validated_data['identifier']
            try:
                OTPService().send_otp(identifier)
                return APIResponse.success(
                    message=AUTH_SUCCESS["otp_sent"],
                    status_code=200
                )
            except Exception as e:
                return APIResponse.error(
                    message=AUTH_ERRORS["otp_send_failed"],
                    status_code=400
                )
        return APIResponse.error(
            message=AUTH_ERRORS["auth_validation_error"],
            errors=serializer.errors,
            status_code=400
        )

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            identifier = serializer.validated_data['identifier']
            otp = serializer.validated_data['otp']
            try:
                user = OTPService().verify_otp(identifier, otp)
                tokens = OTPService().get_tokens(user)
                
                response_data = {
                    "user": {
                        "id": user.id,
                        "mobile": user.mobile,
                        "email": user.email,
                        "is_active": user.is_active,
                    },
                    "access_token": tokens["access_token"],
                    "refresh_token": tokens["refresh_token"]
                }

                response = APIResponse.success(
                    message=AUTH_SUCCESS["otp_verified"],
                    data=response_data
                )

                UserCookie.set_auth_cookies(response, tokens["access_token"], tokens["refresh_token"])

                return response
            except Exception as e:
                return APIResponse.error(
                    message=AUTH_ERRORS["otp_invalid"],
                    status_code=400
                )
        return APIResponse.error(
            message=AUTH_ERRORS["auth_validation_error"],
            errors=serializer.errors,
            status_code=400
        )

class OTPSettingsView(APIView):

    permission_classes = [AllowAny]
    
    def get(self, request):

        otp_settings = {
            "otp_length": get_otp_length()
        }
        return APIResponse.success(
            message=AUTH_SUCCESS["otp_settings_retrieved_successfully"],
            data=otp_settings
        )