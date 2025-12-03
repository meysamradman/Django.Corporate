from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample
from src.user.messages import AUTH_SUCCESS
from src.user.serializers.admin import AdminRegisterSerializer


def admin_register_schema(view_func):
    return extend_schema(
        summary="Admin Registration",
        description="This API is used to create a new admin user.",
        request=AdminRegisterSerializer,
        responses={
            201: OpenApiResponse(
                description="Successful response if registration is successful",
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
                description="Validation errors if invalid data is sent.",
            )
        }
    )(view_func)