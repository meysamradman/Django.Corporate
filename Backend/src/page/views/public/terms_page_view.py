from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from src.core.responses.response import APIResponse
from src.page.messages.messages import TERMS_PAGE_ERRORS, TERMS_PAGE_SUCCESS
from src.page.serializers.public.terms_page_serializer import PublicTermsPageSerializer
from src.page.services.public.terms_page_service import get_public_terms_page, get_public_terms_page_data

class PublicTermsPageView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            page = get_public_terms_page()
            if not page.is_active:
                return APIResponse.error(
                    message=TERMS_PAGE_ERRORS['terms_page_not_found'],
                    status_code=status.HTTP_404_NOT_FOUND,
                )

            return APIResponse.success(
                message=TERMS_PAGE_SUCCESS['terms_page_retrieved'],
                data=get_public_terms_page_data(PublicTermsPageSerializer),
                status_code=status.HTTP_200_OK,
            )
        except ValidationError:
            return APIResponse.error(
                message=TERMS_PAGE_ERRORS['terms_page_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception:
            return APIResponse.error(
                message=TERMS_PAGE_ERRORS['terms_page_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
