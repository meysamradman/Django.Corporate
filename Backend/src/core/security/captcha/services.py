"""
CAPTCHA Service - Django Compatible
"""
import random
import uuid
import string
from typing import Optional, Dict
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# CAPTCHA settings - can be moved to Django settings if needed
CAPTCHA_EXPIRY_SECONDS = getattr(settings, 'CAPTCHA_EXPIRY_SECONDS', 300)  # 5 minutes
CAPTCHA_REDIS_PREFIX = getattr(settings, 'CAPTCHA_REDIS_PREFIX', "captcha:")
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
            
            # Store in Redis with expiry
            cache_key = f"{CAPTCHA_REDIS_PREFIX}{captcha_id}"
            cache.set(cache_key, challenge_digits, CAPTCHA_EXPIRY_SECONDS)
            
            logger.info(f"Generated CAPTCHA: ID={captcha_id}, Digits='{challenge_digits}'")
            
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

        cache_key = f"{CAPTCHA_REDIS_PREFIX}{captcha_id}"
        
        try:
            # Get stored answer from cache
            correct_answer = cache.get(cache_key)
            
            if correct_answer is None:
                # CAPTCHA expired or doesn't exist
                return False
            
            # Delete after use (one-time verification)
            cache.delete(cache_key)
            
            # Compare answers (strip whitespace)
            return user_answer.strip() == correct_answer

        except Exception as e:
            logger.error(f"Exception verifying CAPTCHA: {e}")
            return False
