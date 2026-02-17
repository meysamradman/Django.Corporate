from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from django.core.exceptions import ValidationError

from src.core.responses.response import APIResponse
from src.form.messages.messages import (
    FORM_FIELD_SUCCESS,
    FORM_FIELD_ERRORS,
    FORM_SUBMISSION_SUCCESS,
    FORM_SUBMISSION_ERRORS,
)
from src.form.serializers.public import (
    PublicContactFormFieldSerializer,
    PublicContactFormSubmissionCreateSerializer,
)
from src.form.services.public import (
    get_public_contact_form_fields_data,
    create_public_contact_form_submission,
)


class PublicContactFormFieldsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        platform = request.query_params.get('platform', 'website')

        if platform not in ['website', 'mobile_app']:
            return APIResponse.error(
                message=FORM_FIELD_ERRORS['invalid_platform'],
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        try:
            return APIResponse.success(
                message=FORM_FIELD_SUCCESS['platform_fields_retrieved'],
                data=get_public_contact_form_fields_data(platform),
                status_code=status.HTTP_200_OK,
            )
        except ValidationError:
            return APIResponse.error(
                message=FORM_FIELD_ERRORS['validation_error'],
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            return APIResponse.error(
                message=FORM_FIELD_ERRORS['platform_fields_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PublicContactFormSubmissionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PublicContactFormSubmissionCreateSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        try:
            create_public_contact_form_submission(serializer.validated_data, request=request)
            return APIResponse.success(
                message=FORM_SUBMISSION_SUCCESS['submission_created'],
                status_code=status.HTTP_201_CREATED,
            )
        except ValidationError as e:
            if isinstance(e.args[0], dict):
                return APIResponse.error(
                    message=FORM_SUBMISSION_ERRORS['validation_error'],
                    errors=e.args[0],
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            return APIResponse.error(
                message=FORM_SUBMISSION_ERRORS['validation_error'],
                errors=serializer.errors if hasattr(serializer, 'errors') else None,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            return APIResponse.error(
                message=FORM_SUBMISSION_ERRORS['submission_create_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
