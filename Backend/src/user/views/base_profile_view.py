from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from src.core.responses import APIResponse
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS
from src.user.authorization import AdminRolePermission
from src.user.auth.auth_mixin import UserAuthMixin

class BaseProfileView(UserAuthMixin, APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = None
    service_class = None

    def get(self, request):
        try:
            user = self.service_class.get_user_profile(request.user.id)
            serializer = self.serializer_class(user, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["auth_retrieved_successfully"],
                data=serializer.data
            )
        except Exception as e:
            return APIResponse.error(
                message=str(e),
                status_code=500
            )

    def put(self, request):
        try:
            user = self.service_class.get_user_profile(request.user.id)
            serializer = self.serializer_class(user, data=request.data, context={'request': request}, partial=True)
            if serializer.is_valid():
                serializer.save()
                return APIResponse.success(
                    message=AUTH_SUCCESS["auth_profile_updated"],
                    data=serializer.data
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
