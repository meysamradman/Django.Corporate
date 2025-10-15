from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFTokenView(APIView):
    """
    This view sends a response with a CSRF token.
    It's useful as an explicit endpoint for refreshing CSRF tokens.
    """
    permission_classes = [IsAuthenticated]  # Only authenticated users can get a token
    
    def get(self, request, *args, **kwargs):
        # Get a new CSRF token
        token = get_token(request)
        
        # Return the token in the response
        # The renderer will automatically format this response
        return Response({"csrf_token": token})