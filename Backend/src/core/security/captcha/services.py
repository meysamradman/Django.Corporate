"""
CAPTCHA Service - Django Compatible
"""
import random
import uuid
import string
from typing import Optional, Dict
from django.conf import settings
from src.core.security.captcha.cache import CaptchaCacheManager, CaptchaCacheKeys
import logging

logger = logging.getLogger(__name__)

# CAPTCHA settings
CAPTCHA_DIGITS = string.digits  # "0123456789"
CAPTCHA_LENGTH = getattr(settings, 'CAPTCHA_LENGTH', 4)  # Number of digits


class CaptchaService:
    """
    Django-compatible service for generating and verifying simple digit CAPTCHAs.
    Uses Django's cache framework with Redis backend.
    """

    @classmethod
    def generate_digit_captcha(cls) -> Optional[Dict[str, str]]:
        """
        Generate a random digit CAPTCHA and store in Redis cache.
        
        Returns:
            Dict with captcha_id and digits, or None if failed
        """
        try:
            # Generate random digits
            challenge_digits = ''.join(random.choices(CAPTCHA_DIGITS, k=CAPTCHA_LENGTH))
            
            # Generate unique ID
            captcha_id = uuid.uuid4().hex
            
            # ✅ Use Cache Manager for standardized cache storage
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
        """
        Verify user's CAPTCHA answer against stored challenge.
        
        Args:
            captcha_id: The CAPTCHA challenge ID
            user_answer: User's input answer
            
        Returns:
            True if answer is correct, False otherwise
        """
        if not captcha_id or not user_answer:
            return False
        
        try:
            # ✅ Use Cache Manager for standardized cache operations
            correct_answer = CaptchaCacheManager.get_captcha(captcha_id)
            
            if correct_answer is None:
                # CAPTCHA expired or doesn't exist
                return False
            
            # Delete after use (one-time verification)
            CaptchaCacheManager.delete_captcha(captcha_id)
            
            # Compare answers (strip whitespace)
            return user_answer.strip() == correct_answer

        except Exception as e:
            logger.error(f"Exception verifying CAPTCHA: {e}")
            return False
