from rest_framework import viewsets, status
from django.core.exceptions import ValidationError
from django.core.cache import cache

from src.core.responses.response import APIResponse
from src.page.models import TermsPage
from src.page.serializers import (
    TermsPageSerializer,
    TermsPageUpdateSerializer,
)
from src.page.services.terms_page_service import (
    get_terms_page,
    update_terms_page,
)
from src.page.messages.messages import TERMS_PAGE_SUCCESS, TERMS_PAGE_ERRORS
from src.user.access_control import RequirePermission
from src.page.utils.cache import PageCacheKeys, PageCacheManager


class TermsPageViewSet(viewsets.ModelViewSet):
    
    queryset = TermsPage.objects.all()
    serializer_class = TermsPageSerializer
    
    def get_permissions(self):
        return [RequirePermission('pages.manage')]
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return TermsPageUpdateSerializer
        return TermsPageSerializer
    
    def list(self, request, *args, **kwargs):
        try:
            cache_key = PageCacheKeys.terms_page()
            cached_data = cache.get(cache_key)
            
            if cached_data is not None:
                return APIResponse.success(
                    message=TERMS_PAGE_SUCCESS['terms_page_retrieved'],
                    data=cached_data,
                    status_code=status.HTTP_200_OK
                )
            
            page = get_terms_page()
            serializer = self.get_serializer(page)
            serialized_data = serializer.data
            
            cache.set(cache_key, serialized_data, 300)
            
            return APIResponse.success(
                message=TERMS_PAGE_SUCCESS['terms_page_retrieved'],
                data=serialized_data,
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            error_msg = str(e)
            if error_msg == "terms_page_retrieve_failed":
                message = TERMS_PAGE_ERRORS['terms_page_retrieve_failed']
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            else:
                message = TERMS_PAGE_ERRORS.get('terms_page_not_found', TERMS_PAGE_ERRORS['terms_page_retrieve_failed'])
                status_code = status.HTTP_404_NOT_FOUND
            
            return APIResponse.error(
                message=message,
                status_code=status_code
            )
        except Exception as e:
            return APIResponse.error(
                message=TERMS_PAGE_ERRORS['terms_page_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data, partial=kwargs.get('partial', False))
            serializer.is_valid(raise_exception=True)
            
            updated_page = update_terms_page(serializer.validated_data)
            PageCacheManager.invalidate_terms_page()
            response_serializer = TermsPageSerializer(updated_page)
            
            return APIResponse.success(
                message=TERMS_PAGE_SUCCESS['terms_page_updated'],
                data=response_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            error_msg = str(e)
            if error_msg == "terms_page_update_failed":
                message = TERMS_PAGE_ERRORS['terms_page_update_failed']
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            elif "validation" in error_msg.lower() or "invalid" in error_msg.lower():
                message = TERMS_PAGE_ERRORS['validation_error']
                status_code = status.HTTP_400_BAD_REQUEST
            else:
                message = TERMS_PAGE_ERRORS['terms_page_update_failed']
                status_code = status.HTTP_400_BAD_REQUEST
            
            return APIResponse.error(
                message=message,
                errors=serializer.errors if hasattr(serializer, 'errors') else None,
                status_code=status_code
            )
        except Exception as e:
            return APIResponse.error(
                message=TERMS_PAGE_ERRORS['terms_page_update_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        return APIResponse.error(
            message=TERMS_PAGE_ERRORS['terms_page_not_found'],
            status_code=status.HTTP_405_METHOD_NOT_ALLOWED
        )

