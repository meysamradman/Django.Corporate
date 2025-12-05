from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from django.core.exceptions import ValidationError

from src.core.responses.response import APIResponse
from src.form.serializers import ContactFormSubmissionCreateSerializer
from src.form.services.contact_form_submission_service import create_contact_form_submission
from src.form.messages.messages import FORM_SUBMISSION_SUCCESS, FORM_SUBMISSION_ERRORS


class ContactFormSubmissionViewSet(viewsets.ModelViewSet):
    
    serializer_class = ContactFormSubmissionCreateSerializer
    
    def get_permissions(self):
        return [AllowAny()]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        try:
            create_contact_form_submission(serializer.validated_data, request=request)
            
            return APIResponse.success(
                message=FORM_SUBMISSION_SUCCESS['submission_created'],
                status_code=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            error_msg = str(e)
            if isinstance(e.args[0], dict):
                return APIResponse.error(
                    message=FORM_SUBMISSION_ERRORS['validation_error'],
                    errors=e.args[0],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            else:
                return APIResponse.error(
                    message=FORM_SUBMISSION_ERRORS['validation_error'],
                    errors=serializer.errors if hasattr(serializer, 'errors') else None,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return APIResponse.error(
                message=FORM_SUBMISSION_ERRORS['submission_create_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

