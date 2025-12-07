from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from src.core.responses.response import APIResponse
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
from src.user.access_control import AdminRolePermission
from src.user.auth.auth_mixin import UserAuthMixin
from src.user.serializers.user.user_profile_serializer import UserProfileSerializer, UserProfileUpdateSerializer
from src.user.services.user.user_profile_service import UserProfileService
from src.user.auth import UserJWTAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication


class UserProfileView(UserAuthMixin, APIView):
    authentication_classes = [UserJWTAuthentication, JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = UserProfileSerializer

    def get(self, request):
        try:
            user = UserProfileService.get_user_profile(request.user)
            serializer = self.serializer_class(user, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["auth_retrieved_successfully"],
                data=serializer.data
            )
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS["error_occurred"],
                status_code=500
            )

    def put(self, request):
        try:
            user = UserProfileService.get_user_profile(request.user)
            serializer = UserProfileUpdateSerializer(user, data=request.data, context={'request': request, 'user_id': request.user.id}, partial=True)
            if serializer.is_valid(raise_exception=True):
                updated_profile = UserProfileService.update_user_profile(request.user, serializer.validated_data)
                response_serializer = self.serializer_class(updated_profile, context={'request': request})
                return APIResponse.success(
                    message=AUTH_SUCCESS["auth_profile_updated"],
                    data=response_serializer.data
                )
            return APIResponse.error(
                message=AUTH_ERRORS["auth_profile_failed"],
                errors=serializer.errors,
                status_code=400
            )
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS["error_occurred"],
                status_code=500
            )