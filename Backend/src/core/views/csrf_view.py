from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from src.core.responses.response import APIResponse
from src.user.messages import AUTH_SUCCESS

@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFTokenView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        token = get_token(request)
        return APIResponse.success(
            message=AUTH_SUCCESS["csrf_token_retrieved"],
            data={},
            status_code=status.HTTP_200_OK
        )