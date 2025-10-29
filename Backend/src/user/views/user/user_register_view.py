from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from src.core.responses import APIResponse
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
from src.user.auth.user_cookies import UserCookie
from src.user.serializers.user.user_register_serializer import UserRegisterSerializer
from src.user.services.user.user_register_service import UserRegisterService


class UserRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            identifier = serializer.validated_data["identifier"]
            password = serializer.validated_data["password"]

            try:
                user = UserRegisterService.register_user_from_serializer(
                    validated_data=serializer.validated_data,
                    admin_user=None
                )
                tokens = UserRegisterService.get_tokens(user)

                response_data = {
                    "user": {
                        "id": user.id,
                        "mobile": user.mobile,
                        "email": user.email,
                        "is_active": user.is_active,
                    },
                    "access_token": tokens["access_token"],
                    "refresh_token": tokens["refresh_token"],
                }

                response = APIResponse.success(
                    message=AUTH_SUCCESS["auth_created"],
                    data=response_data
                )

                UserCookie.set_auth_cookies(response, tokens["access_token"], tokens["refresh_token"])

                return response

            except ValidationError as e:
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_validation_error"],
                    status_code=400,
                )

        return APIResponse.error(
            message=AUTH_ERRORS["auth_validation_error"],
            errors=serializer.errors,
            status_code=400,
        )