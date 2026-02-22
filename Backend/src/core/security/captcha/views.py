from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.utils import extend_schema, OpenApiResponse
from src.core.security.throttling import CaptchaThrottle
from src.core.responses.response import APIResponse
from src.core.security.messages import CAPTCHA_SUCCESS, CAPTCHA_ERRORS
from .services import CaptchaService
from .serializers import CaptchaResponseSerializer, CaptchaVerifySerializer

@method_decorator(csrf_exempt, name='dispatch')
class CaptchaGenerateView(APIView):
    
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [CaptchaThrottle]
    
    def initial(self, request, *args, **kwargs):
        
        self.format_kwarg = self.get_format_suffix(**kwargs)
        neg = self.perform_content_negotiation(request)
        request.accepted_renderer, request.accepted_media_type = neg
        version, scheme = self.determine_version(request, *args, **kwargs)
        request.version, request.versioning_scheme = version, scheme
        self.check_throttles(request)
    
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
                return APIResponse.error(
                    message=CAPTCHA_ERRORS["captcha_generation_failed"],
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            return APIResponse.success(
                message=CAPTCHA_SUCCESS["captcha_generated"],
                data=challenge_data,
                status_code=status.HTTP_200_OK
            )
            
        except Exception:
            return APIResponse.error(
                message=CAPTCHA_ERRORS["captcha_server_error"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@method_decorator(csrf_exempt, name='dispatch')
class CaptchaVerifyView(APIView):
    
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [CaptchaThrottle]
    
    def initial(self, request, *args, **kwargs):
        
        self.format_kwarg = self.get_format_suffix(**kwargs)
        neg = self.perform_content_negotiation(request)
        request.accepted_renderer, request.accepted_media_type = neg
        version, scheme = self.determine_version(request, *args, **kwargs)
        request.version, request.versioning_scheme = version, scheme
        self.check_throttles(request)
    
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
            return APIResponse.error(
                message=CAPTCHA_ERRORS["captcha_invalid_data"],
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            captcha_id = serializer.validated_data['captcha_id']
            user_answer = serializer.validated_data['user_answer']
            
            is_valid = CaptchaService.verify_captcha(captcha_id, user_answer)
            
            if is_valid:
                return APIResponse.success(
                    message=CAPTCHA_SUCCESS["captcha_verified"],
                    data={"verified": True},
                    status_code=status.HTTP_200_OK
                )
            else:
                return APIResponse.error(
                    message=CAPTCHA_ERRORS["captcha_invalid"],
                    data={"verified": False},
                    status_code=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception:
            return APIResponse.error(
                message=CAPTCHA_ERRORS["captcha_server_error"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
