from rest_framework.exceptions import ValidationError, AuthenticationFailed
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status
from django.middleware.csrf import get_token
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
                    }
                    # Remove csrf_token from response for security
                }

                # The renderer will automatically format this response
                return Response(response_data, status=status.HTTP_201_CREATED)

            except (ValidationError, AuthenticationFailed) as e:
                # The renderer will automatically format this error response
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # The renderer will automatically format this validation error response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
