# Third-party (Django, DRF)
from rest_framework import viewsets, status
from django.core.exceptions import ValidationError

# Project core
from src.core.responses.response import APIResponse

# Project models
from src.page.models import TermsPage

# Project serializers
from src.page.serializers import (
    TermsPageSerializer,
    TermsPageUpdateSerializer,
)

# Project services
from src.page.services.terms_page_service import (
    get_terms_page,
    update_terms_page,
)

# Project messages
from src.page.messages.messages import TERMS_PAGE_SUCCESS, TERMS_PAGE_ERRORS
from src.user.authorization.admin_permission import PagesManagerAccess
from src.user.permissions import PermissionValidator


class TermsPageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Terms Page (Singleton Pattern)"""
    
    queryset = TermsPage.objects.all()
    serializer_class = TermsPageSerializer
    permission_classes = [PagesManagerAccess]
    
    def get_serializer_class(self):
        """انتخاب serializer مناسب بر اساس action"""
        if self.action in ['update', 'partial_update']:
            return TermsPageUpdateSerializer
        return TermsPageSerializer
    
    def list(self, request, *args, **kwargs):
        """دریافت صفحه قوانین و مقررات (Singleton)"""
        # استراتژی کلی: یک permission برای همه عملیات (pages.manage)
        # RouteGuard چک می‌کند که کاربر pages.manage دارد
        try:
            page = get_terms_page()
            serializer = self.get_serializer(page)
            
            return APIResponse.success(
                message=TERMS_PAGE_SUCCESS['terms_page_retrieved'],
                data=serializer.data,
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
        """دریافت صفحه قوانین و مقررات (Singleton)"""
        return self.list(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """به‌روزرسانی صفحه قوانین و مقررات"""
        if not PermissionValidator.has_permission(request.user, 'pages.manage'):
            return APIResponse.error(
                message=TERMS_PAGE_ERRORS.get("terms_page_not_authorized", "You don't have permission to update pages"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        try:
            serializer = self.get_serializer(data=request.data, partial=kwargs.get('partial', False))
            serializer.is_valid(raise_exception=True)
            
            updated_page = update_terms_page(serializer.validated_data)
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
                message = TERMS_PAGE_ERRORS.get('terms_page_update_failed', TERMS_PAGE_ERRORS['validation_error'])
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
        """ایجاد - استفاده از list برای Singleton"""
        return self.list(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """حذف - غیرفعال برای Singleton"""
        return APIResponse.error(
            message=TERMS_PAGE_ERRORS.get('terms_page_not_found', 'حذف صفحه قوانین و مقررات امکان‌پذیر نیست'),
            status_code=status.HTTP_405_METHOD_NOT_ALLOWED
        )

