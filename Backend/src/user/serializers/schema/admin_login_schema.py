from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample

from src.user.serializers.admin.admin_login_serializer import AdminLoginSerializer


def admin_login_schema(view_func):
    return extend_schema(
        request=AdminLoginSerializer,
        responses={
            200: OpenApiResponse(description="Admin login successful."),
            400: OpenApiResponse(description="Invalid validation or incorrect captcha."),
            401: OpenApiResponse(description="Invalid credentials or inactive admin."),
            429: OpenApiResponse(description="Too many attempts - rate limit exceeded."),
            503: OpenApiResponse(description="Captcha generation error.")
        },
        description="Admin login with mobile number, password/OTP and captcha.",
        examples=[
            OpenApiExample(
                "Admin Password Login",
                value={
                    "mobile": "09124707989",
                    "password": "1047", 
                    "login_type": "password",
                    "captcha_id": "a1b2c3d4e5f6...",
                    "captcha_answer": "1234"
                }
            ),
            OpenApiExample(
                "Admin OTP Login",
                value={
                    "mobile": "09124707989",
                    "otp": "12345",
                    "login_type": "otp", 
                    "captcha_id": "a1b2c3d4e5f6...",
                    "captcha_answer": "1234"
                }
            )
        ]
    )(view_func)
