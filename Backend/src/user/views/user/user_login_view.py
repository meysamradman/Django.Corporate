from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from src.core.responses import APIResponse
from rest_framework.exceptions import AuthenticationFailed
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
from src.user.auth.user_cookies import UserCookie
from src.user.serializers.user.user_login_serializer import UserLoginSerializer
from src.user.services import BaseLoginService
from src.user.auth import UserJWTAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication


class UserLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [UserJWTAuthentication, JWTAuthentication]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            identifier = serializer.validated_data['identifier']
            password = serializer.validated_data.get('password')
            otp = serializer.validated_data.get('otp')
            login_type = serializer.validated_data.get('login_type', 'password')

            try:
                user = BaseLoginService.authenticate_user(
                    identifier=identifier,
                    password=password,
                    otp=otp,
                    login_type=login_type,
                    user_type='user'
                )
                tokens = BaseLoginService.get_tokens(user)

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
                    message=str(e),
                    status_code=400
                )

        return APIResponse.error(
            message=AUTH_ERRORS["auth_validation_error"],
            errors=serializer.errors,
            status_code=400
        )
