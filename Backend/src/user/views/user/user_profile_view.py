from src.user.views.base_profile_view import BaseProfileView
from src.user.serializers.base_profile_serializer import UserProfileSerializer, UserProfileUpdateSerializer # Import new serializers
from src.user.services import BaseProfileService
from src.user.auth import UserJWTAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication

class UserProfileView(BaseProfileView):
    authentication_classes = [UserJWTAuthentication, JWTAuthentication]
    serializer_class = UserProfileSerializer # Changed to UserProfileSerializer for GET
    service_class = BaseProfileService

    def put(self, request, *args, **kwargs):
        try:
            user = self.service_class.get_user_profile(request.user)
            serializer = UserProfileUpdateSerializer(user, data=request.data, context={'request': request}, partial=True)
            if serializer.is_valid(raise_exception=True):
                updated_profile = self.service_class.update_user_profile(request.user, serializer.validated_data)
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
                message=str(e),
                status_code=500
            )
