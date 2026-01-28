from rest_framework import serializers

class CaptchaResponseSerializer(serializers.Serializer):
    captcha_id = serializers.CharField(max_length=32)
    digits = serializers.CharField(max_length=4)

class CaptchaVerifySerializer(serializers.Serializer):
    captcha_id = serializers.CharField(max_length=32)
    user_answer = serializers.CharField(max_length=4)
