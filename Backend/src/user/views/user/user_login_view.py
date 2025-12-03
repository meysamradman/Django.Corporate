from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from src.core.responses import APIResponse
from rest_framework.exceptions import AuthenticationFailed
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
from src.user.auth.user_cookies import UserCookie
from src.user.serializers.user.user_login_serializer import UserLoginSerializer
from src.user.services.user.user_auth_service import UserAuthService
from src.user.auth import UserJWTAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from src.core.security.throttling import UserLoginThrottle
from src.core.security.captcha.services import CaptchaService
from src.core.security.captcha.messages import CAPTCHA_ERRORS


class UserLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [UserJWTAuthentication, JWTAuthentication]
    throttle_classes = [UserLoginThrottle]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            identifier = serializer.validated_data['identifier']
            password = serializer.validated_data.get('password')
            otp = serializer.validated_data.get('otp')
            login_type = serializer.validated_data.get('login_type', 'password')
            captcha_id = serializer.validated_data.get('captcha_id')
            captcha_answer = serializer.validated_data.get('captcha_answer')
            
            if not CaptchaService.verify_captcha(captcha_id, captcha_answer):
                return APIResponse.error(
                    message=CAPTCHA_ERRORS["captcha_invalid"],
                    status_code=400
                )

            try:
                user = UserAuthService.authenticate_user(
                    identifier=identifier,
                    password=password,
                    otp=otp,
                    login_type=login_type,
                    user_type='user'
                )
                tokens = UserAuthService.get_tokens(user)

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
                    message=AUTH_SUCCESS["auth_logged_in"],
                    data=response_data
                )

                UserCookie.set_auth_cookies(response, tokens["access_token"], tokens["refresh_token"])

                return response

            except AuthenticationFailed as e:
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_invalid_credentials"],
                    status_code=400
                )

        return APIResponse.error(
            message=AUTH_ERRORS["auth_validation_error"],
            errors=serializer.errors,
            status_code=400
        )