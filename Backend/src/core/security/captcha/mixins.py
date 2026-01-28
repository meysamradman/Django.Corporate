from rest_framework import status
from src.core.responses.response import APIResponse

from . import CAPTCHA_ERRORS
from .services import CaptchaService

class CaptchaRequiredMixin:
    
    def validate_captcha(self, request_data):
        captcha_id = request_data.get('captcha_id')
        captcha_answer = request_data.get('captcha_answer')
        
        if not captcha_id or not captcha_answer:
            return False, APIResponse.error(
                message=CAPTCHA_ERRORS["captcha_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        if not CaptchaService.verify_captcha(captcha_id, captcha_answer):
            return False, APIResponse.error(
                message=CAPTCHA_ERRORS["captcha_invalid"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        return True, None
    
    def captcha_required(self, request_data):
        is_valid, error_response = self.validate_captcha(request_data)
        if not is_valid:
            return error_response
        return None