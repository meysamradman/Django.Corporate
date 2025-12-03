from rest_framework import viewsets, status
from django.core.exceptions import ValidationError
from src.core.responses.response import APIResponse
from src.page.models import AboutPage
from src.page.serializers import (
    AboutPageSerializer,
    AboutPageUpdateSerializer,
)
from src.page.services.about_page_service import (
    get_about_page,
    update_about_page,
)
from src.page.messages.messages import ABOUT_PAGE_SUCCESS, ABOUT_PAGE_ERRORS
from src.user.authorization.admin_permission import RequirePermission


class AboutPageViewSet(viewsets.ModelViewSet):
    
    queryset = AboutPage.objects.all()
    serializer_class = AboutPageSerializer
    
    def get_permissions(self):
        return [RequirePermission('pages.manage')]
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return AboutPageUpdateSerializer
        return AboutPageSerializer
    
    def list(self, request, *args, **kwargs):
        try:
            page = get_about_page()
            serializer = self.get_serializer(page)
            
            return APIResponse.success(
                message=ABOUT_PAGE_SUCCESS['about_page_retrieved'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            error_msg = str(e)
            if error_msg == "about_page_retrieve_failed":
                message = ABOUT_PAGE_ERRORS['about_page_retrieve_failed']
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            else:
                message = ABOUT_PAGE_ERRORS['about_page_not_found']
                status_code = status.HTTP_404_NOT_FOUND
            
            return APIResponse.error(
                message=message,
                status_code=status_code
            )
        except Exception as e:
            return APIResponse.error(
                message=ABOUT_PAGE_ERRORS['about_page_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data, partial=kwargs.get('partial', False))
            serializer.is_valid(raise_exception=True)
            
            updated_page = update_about_page(serializer.validated_data)
            response_serializer = AboutPageSerializer(updated_page)
            
            return APIResponse.success(
                message=ABOUT_PAGE_SUCCESS['about_page_updated'],
                data=response_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            error_msg = str(e)
            if error_msg == "about_page_update_failed":
                message = ABOUT_PAGE_ERRORS['about_page_update_failed']
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            elif "validation" in error_msg.lower() or "invalid" in error_msg.lower():
                message = ABOUT_PAGE_ERRORS['validation_error']
                status_code = status.HTTP_400_BAD_REQUEST
            else:
                message = ABOUT_PAGE_ERRORS['about_page_update_failed']
                status_code = status.HTTP_400_BAD_REQUEST
            
            return APIResponse.error(
                message=message,
                errors=serializer.errors if hasattr(serializer, 'errors') else None,
                status_code=status_code
            )
        except Exception as e:
            return APIResponse.error(
                message=ABOUT_PAGE_ERRORS['about_page_update_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        return APIResponse.error(
            message=ABOUT_PAGE_ERRORS['about_page_not_found'],
            status_code=status.HTTP_405_METHOD_NOT_ALLOWED
        )

