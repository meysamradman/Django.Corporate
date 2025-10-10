"""
CAPTCHA Serializers for DRF
"""
from rest_framework import serializers


class CaptchaResponseSerializer(serializers.Serializer):
    """Serializer for CAPTCHA generation response."""
    captcha_id = serializers.CharField(max_length=32)
    digits = serializers.CharField(max_length=4)


class CaptchaVerifySerializer(serializers.Serializer):
    """Serializer for CAPTCHA verification request."""
    captcha_id = serializers.CharField(max_length=32)
    user_answer = serializers.CharField(max_length=4)
