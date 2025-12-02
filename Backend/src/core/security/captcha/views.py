from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema, OpenApiResponse
from src.core.security.throttling import CaptchaThrottle
from . import CAPTCHA_ERRORS, CAPTCHA_SUCCESS
from .services import CaptchaService
from .serializers import CaptchaResponseSerializer, CaptchaVerifySerializer

import logging

logger = logging.getLogger(__name__)


class CaptchaGenerateView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [CaptchaThrottle]
    
    @extend_schema(
        operation_id="generate_captcha",
        summary="Generate CAPTCHA",
        description="Generate a new digit CAPTCHA challenge for admin login",
        responses={
            200: OpenApiResponse(
                response=CaptchaResponseSerializer,
                description="CAPTCHA generated successfully"
            ),
            503: OpenApiResponse(description="Service unavailable - failed to generate CAPTCHA")
        },
        tags=["Authentication"]
    )
    def get(self, request):
        try:
            challenge_data = CaptchaService.generate_digit_captcha()
            
            if not challenge_data:
                return Response({
                    "detail": CAPTCHA_ERRORS["captcha_generation_failed"]
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            return Response(challenge_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error generating CAPTCHA: {e}")
            return Response({
                "detail": CAPTCHA_ERRORS["captcha_server_error"]
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CaptchaVerifyView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [CaptchaThrottle]
    
    @extend_schema(
        operation_id="verify_captcha",
        summary="Verify CAPTCHA",
        description="Verify the user's answer to a CAPTCHA challenge",
        request=CaptchaVerifySerializer,
        responses={
            200: OpenApiResponse(description="CAPTCHA verification result"),
            400: OpenApiResponse(description="Invalid request data or incorrect CAPTCHA")
        },
        tags=["Authentication"]
    )
    def post(self, request):
        serializer = CaptchaVerifySerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                "detail": CAPTCHA_ERRORS["captcha_invalid_data"],
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            captcha_id = serializer.validated_data['captcha_id']
            user_answer = serializer.validated_data['user_answer']
            
            is_valid = CaptchaService.verify_captcha(captcha_id, user_answer)
            
            if is_valid:
                return Response({
                    "verified": True
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "detail": CAPTCHA_ERRORS["captcha_invalid"],
                    "verified": False
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error verifying CAPTCHA: {e}")
            return Response({
                "detail": CAPTCHA_ERRORS["captcha_server_error"]
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)