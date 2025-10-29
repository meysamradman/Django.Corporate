from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.core.responses import APIResponse
from src.user.serializers.admin.admin_management_serializer import (
    AdminListSerializer,
    AdminDetailSerializer,
    AdminUpdateSerializer,
    AdminFilterSerializer,
    BulkDeleteSerializer
)
from src.user.services.admin.admin_management_service import AdminManagementService
from src.user.messages import AUTH_ERRORS, AUTH_SUCCESS
from src.user.models import User
from src.user.auth.auth_mixin import UserAuthMixin
from src.user.authorization import (
    AdminRolePermission,
    SimpleAdminPermission,
    require_admin_roles,
    SuperAdminOnly,
    UserManagerAccess
)
from src.core.pagination.pagination import StandardLimitPagination
# Throttling removed for admin operations - admins can work freely


@method_decorator(ensure_csrf_cookie, name='dispatch')
class AdminManagementView(UserAuthMixin, APIView):
    authentication_classes = [CSRFExemptSessionAuthentication]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = StandardLimitPagination
    # No throttling for admin operations - admins can work freely

    def get_permissions(self):
        """دسترسی بر اساس action - مدیریت ادمین‌ها"""
        # برای مدیریت ادمین‌ها، فقط Super Admin دسترسی دارد
        return [SuperAdminOnly()]

    def get(self, request, admin_id=None):
        """دریافت لیست ادمین‌ها یا جزئیات یک ادمین"""
        try:
            if admin_id:
                try:
                    admin = AdminManagementService.get_admin_detail(admin_id)
                    serializer = AdminDetailSerializer(admin, context={'request': request})
                    return APIResponse.success(
                        message=AUTH_SUCCESS["user_retrieved_successfully"],
                        data=serializer.data
                    )
                except Exception as e:
                    return APIResponse.error(message=AUTH_ERRORS["error_occurred"])

            filter_serializer = AdminFilterSerializer(data=request.query_params)
            if not filter_serializer.is_valid():
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_validation_error"],
                    errors=filter_serializer.errors
                )

            validated_filters = filter_serializer.validated_data
            search_value = validated_filters.get('search')
            is_active_filter = validated_filters.get('is_active')
            # حذف user_type چون سرویس ادمین اون رو نیاز نداره

            try:
                admins_data = AdminManagementService.get_admins_list(
                    search=search_value,
                    is_active=is_active_filter,
                    is_superuser=validated_filters.get('is_superuser'),
                    request=request
                )
                
                if isinstance(admins_data, dict) and 'admins' in admins_data:
                    admins = admins_data['admins']
                elif isinstance(admins_data, tuple) and len(admins_data) == 2:
                    admins, _ = admins_data
                else:
                    admins = admins_data
                
                paginator = self.pagination_class()
                paginated_admins = paginator.paginate_queryset(admins, request)
                
                serializer = AdminListSerializer(paginated_admins, many=True, context={'request': request})
                
                return paginator.get_paginated_response(serializer.data)
            except Exception as e:
                return APIResponse.error(
                    message=AUTH_ERRORS["error_fetching_users"],
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except PermissionDenied as e:
            return APIResponse.error(
                message=AUTH_ERRORS["auth_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS["error_occurred"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @staticmethod
    def get_by_public_id(request, public_id=None):
        """دریافت ادمین بر اساس public_id"""
        try:
            admin = AdminManagementService.get_admin_detail(public_id)
            serializer = AdminDetailSerializer(admin, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["user_retrieved_successfully"],
                data=serializer.data
            )
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS.get("error_occurred"),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, *args, **kwargs):
        """مدیریت درخواست‌های POST - ایجاد ادمین یا حذف دسته‌ای"""
        bulk_action = kwargs.get('action')
        
        if bulk_action == 'bulk-delete':
            return self.bulk_delete_post(request)
        else:
            return self.create_admin_post(request)

    def create_admin_post(self, request):
        """مدیریت درخواست POST برای ایجاد ادمین جدید"""
        from src.user.serializers.admin.admin_register_serializer import AdminRegisterSerializer
        serializer = AdminRegisterSerializer(data=request.data, context={'admin_user': request.user})
        
        if not serializer.is_valid():
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=serializer.errors
            )
            
        try:
            # استفاده از سرویس ثبت‌نام ادمین
            from src.user.services.admin.admin_register_service import AdminRegisterService
            admin = AdminRegisterService.register_admin_from_serializer(
                validated_data=serializer.validated_data,
                admin_user=request.user
            )
            
            response_serializer = AdminDetailSerializer(admin, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["user_created_successfully"],
                data=response_serializer.data
            )
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS.get("error_occurred"),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def bulk_delete_post(self, request):
        """مدیریت حذف دسته‌ای ادمین‌ها"""
        serializer = BulkDeleteSerializer(data=request.data)
        if not serializer.is_valid():
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=serializer.errors
            )
            
        admin_ids = serializer.validated_data.get('ids', [])
        
        try:
            deleted_count = AdminManagementService.bulk_delete_admins(admin_ids, admin_user=request.user)
            
            return APIResponse.success(
                message=AUTH_SUCCESS["users_deleted_successfully"].format(count=deleted_count),
                data={'deleted_count': deleted_count}
            )
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS.get("error_occurred"),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request, admin_id):
        """مدیریت به‌روزرسانی ادمین"""
        try:
            admin = AdminManagementService.get_admin_detail(admin_id)
            
            serializer = AdminUpdateSerializer(
                data=request.data, 
                context={'user_id': admin_id, 'admin_user': request.user, 'request': request}
            )
            
            if not serializer.is_valid():
                return APIResponse.error(
                    message=AUTH_ERRORS["auth_validation_error"],
                    errors=serializer.errors
                )
            
            updated_admin = AdminManagementService.update_admin(admin_id, serializer.validated_data, request.user)
            
            response_serializer = AdminDetailSerializer(updated_admin, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["user_updated_successfully"],
                data=response_serializer.data
            )
            
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS.get("error_occurred"),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, admin_id):
        """حذف ادمین"""
        try:
            admin = AdminManagementService.get_admin_detail(admin_id)
            
            AdminManagementService.delete_admin(admin_id, admin_user=request.user)
            
            return APIResponse.success(
                message=AUTH_SUCCESS["user_deleted_successfully"]
            )
            
        except Exception as e:
            return APIResponse.error(
                message=AUTH_ERRORS.get("error_occurred"),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )