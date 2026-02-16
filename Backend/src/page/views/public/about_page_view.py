from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from src.core.responses.response import APIResponse
from src.page.messages.messages import ABOUT_PAGE_ERRORS, ABOUT_PAGE_SUCCESS
from src.page.serializers.public.about_page_serializer import PublicAboutPageSerializer
from src.page.services.public.about_page_service import get_public_about_page


class PublicAboutPageView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            page = get_public_about_page()
            if not page.is_active:
                return APIResponse.error(
                    message=ABOUT_PAGE_ERRORS['about_page_not_found'],
                    status_code=status.HTTP_404_NOT_FOUND,
                )

            serializer = PublicAboutPageSerializer(page)
            return APIResponse.success(
                message=ABOUT_PAGE_SUCCESS['about_page_retrieved'],
                data=serializer.data,
                status_code=status.HTTP_200_OK,
            )
        except ValidationError:
            return APIResponse.error(
                message=ABOUT_PAGE_ERRORS['about_page_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception:
            return APIResponse.error(
                message=ABOUT_PAGE_ERRORS['about_page_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
