from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample

from src.user.serializers.admin.admin_login_serializer import AdminLoginSerializer


def admin_login_schema(view_func):
    return extend_schema(
        request=AdminLoginSerializer,
        responses={
            200: OpenApiResponse(description="ورود ادمین موفقیت‌آمیز بود."),
            400: OpenApiResponse(description="اعتبارسنجی نامعتبر یا کپتچا اشتباه."),
            401: OpenApiResponse(description="اطلاعات ورود نادرست یا ادمین غیرفعال."),
            429: OpenApiResponse(description="تعداد تلاش‌های زیاد - محدودیت نرخ."),
            503: OpenApiResponse(description="خطا در تولید کپتچا.")
        },
        description="ورود ادمین فقط با شماره موبایل، پسورد/OTP و کپتچا.",
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
