import random
import uuid
import string
from typing import Optional, Dict
from django.conf import settings
from src.core.security.captcha.cache import CaptchaCacheManager, CaptchaCacheKeys
import logging

logger = logging.getLogger(__name__)

CAPTCHA_DIGITS = string.digits
CAPTCHA_LENGTH = getattr(settings, 'CAPTCHA_LENGTH', 4)


class CaptchaService:

    @classmethod
    def generate_digit_captcha(cls) -> Optional[Dict[str, str]]:
        try:
            challenge_digits = ''.join(random.choices(CAPTCHA_DIGITS, k=CAPTCHA_LENGTH))
            captcha_id = uuid.uuid4().hex
            CaptchaCacheManager.set_captcha(captcha_id, challenge_digits)
            
            return {
                "captcha_id": captcha_id,
                "digits": challenge_digits
            }
            
        except Exception as e:
            logger.error(f"Failed to generate CAPTCHA: {e}")
            return None

    @classmethod
    def verify_captcha(cls, captcha_id: str, user_answer: str) -> bool:
        if not captcha_id or not user_answer:
            return False
        
        try:
            correct_answer = CaptchaCacheManager.get_captcha(captcha_id)
            
            if correct_answer is None:
                return False
            
            CaptchaCacheManager.delete_captcha(captcha_id)
            return user_answer.strip() == correct_answer

        except Exception as e:
            logger.error(f"Exception verifying CAPTCHA: {e}")
            return False
