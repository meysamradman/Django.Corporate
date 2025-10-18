"""
CAPTCHA Mixins for Django Views
"""
from rest_framework import status
from rest_framework.response import Response

from . import CAPTCHA_ERRORS
from .services import CaptchaService

# Remove APIResponse import since we're using standard DRF Response


class CaptchaRequiredMixin:
    """
    Mixin to add CAPTCHA validation to any Django view.
    
    Usage:
        class MyLoginView(APIView, CaptchaRequiredMixin):
            def post(self, request):
                # Validate CAPTCHA first
                captcha_error = self.captcha_required(request.data)
                if captcha_error:
                    return captcha_error
                
                # Continue with your logic...
    """
    
    def validate_captcha(self, request_data):
        """
        Validate CAPTCHA from request data
        
        Args:
            request_data: Request data containing captcha_id and captcha_answer
            
        Returns:
            tuple: (is_valid: bool, error_response: Response or None)
        """
        captcha_id = request_data.get('captcha_id')
        captcha_answer = request_data.get('captcha_answer')
        
        if not captcha_id or not captcha_answer:
            # Use standard DRF Response - renderer will format it
            return False, Response({
                "detail": CAPTCHA_ERRORS["captcha_required"]
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not CaptchaService.verify_captcha(captcha_id, captcha_answer):
            # Use standard DRF Response - renderer will format it
            return False, Response({
                "detail": CAPTCHA_ERRORS["captcha_invalid"]
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return True, None
    
    def captcha_required(self, request_data):
        """
        Check CAPTCHA requirement and return error response if invalid
        
        Args:
            request_data: Request data containing CAPTCHA fields
            
        Returns:
            Response object if CAPTCHA is invalid/missing, None if valid
        """
        is_valid, error_response = self.validate_captcha(request_data)
        if not is_valid:
            return error_response
        return None