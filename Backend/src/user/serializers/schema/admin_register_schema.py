from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample
from src.user.messages import AUTH_SUCCESS
from src.user.serializers.admin import AdminRegisterSerializer


def admin_register_schema(view_func):
    return extend_schema(
        summary="ثبت‌نام ادمین",
        description="این API برای ایجاد یک کاربر ادمین جدید استفاده می‌شود.",
        request=AdminRegisterSerializer,
        responses={
            201: OpenApiResponse(
                description="پاسخ موفقیت‌آمیز در صورت ثبت‌نام موفق",
                examples=[
                    OpenApiExample(
                        name="Successful Response",
                        value={
                            "metaData": {
                                "status": "success",
                                "message": AUTH_SUCCESS["auth_created"],
                                "AppStatusCode": 201,
                            },
                            "data": {
                                "admin": {
                                    "id": 1,
                                    "email": "admin@example.com",
                                    "mobile": "09123456789"
                                },
                                "tokens": {
                                    "access_token": "<your_access_token>",
                                    "refresh_token": "<your_refresh_token>"
                                }
                            }
                        }
                    )
                ]
            ),
            400: OpenApiResponse(
                description="خطاهای اعتبارسنجی در صورت ارسال داده نامعتبر.",
            )
        }
    )(view_func)