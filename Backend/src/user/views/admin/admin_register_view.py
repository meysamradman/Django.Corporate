from rest_framework.exceptions import ValidationError, AuthenticationFailed
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.middleware.csrf import get_token
from src.core.responses import APIResponse
from src.user.serializers.schema.admin_register_schema import admin_register_schema
from src.user.serializers.admin.admin_register_serializer import AdminRegisterSerializer
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
from src.user.services import BaseRegisterService


class AdminRegisterView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Support for file uploads

    @admin_register_schema
    def post(self, request):
        serializer = AdminRegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = BaseRegisterService.register_user_from_serializer(
                    validated_data=serializer.validated_data,
                    admin_user=request.user
                )

                response_data = {
                    "user": {
                        "id": user.id,
                        "mobile": user.mobile,
                        "email": user.email,
                        "is_active": user.is_active,
                        "is_staff": user.is_staff,
                        "is_superuser": user.is_superuser
                    },
                    "csrf_token": get_token(request)
                }

                return APIResponse.success(
                    message=AUTH_SUCCESS["auth_created"],
                    data=response_data
                )

            except (ValidationError, AuthenticationFailed) as e:
                return APIResponse.error(
                    message=str(e),
                    status_code=400,
                )

        return APIResponse.error(
            message=AUTH_ERRORS["auth_validation_error"],
            errors=serializer.errors,
            status_code=400,
        )