from rest_framework import viewsets, status
from django.core.exceptions import ValidationError
from django.core.cache import cache

from src.core.responses.response import APIResponse
from src.settings.models import GeneralSettings
from src.settings.serializers.general_settings_serializer import GeneralSettingsSerializer
from src.settings.services.general_settings_service import (
    get_general_settings,
    update_general_settings,
)
from src.settings.messages.messages import SETTINGS_SUCCESS, SETTINGS_ERRORS
from src.user.access_control import PermissionRequiredMixin
from src.settings.utils.cache import SettingsCacheKeys, SettingsCacheManager

class GeneralSettingsViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    
    queryset = GeneralSettings.objects.all()
    serializer_class = GeneralSettingsSerializer
    
    permission_map = {
        'list': 'settings.manage',
        'retrieve': 'settings.manage',
        'create': 'settings.manage',
        'update': 'settings.manage',
        'partial_update': 'settings.manage',
        'destroy': 'settings.manage',
    }
    permission_denied_message = SETTINGS_ERRORS.get('permission_denied', 'شما اجازه دسترسی به این بخش را ندارید')
    
    def list(self, request, *args, **kwargs):
        try:
            cache_key = SettingsCacheKeys.general_settings()
            cached_data = cache.get(cache_key)
            
            if cached_data is not None:
                return APIResponse.success(
                    message=SETTINGS_SUCCESS['settings_retrieved'],
                    data=cached_data,
                    status_code=status.HTTP_200_OK
                )
            
            settings = get_general_settings()
            serializer = self.get_serializer(settings)
            serialized_data = serializer.data
            
            cache.set(cache_key, serialized_data, 300)
            
            return APIResponse.success(
                message=SETTINGS_SUCCESS['settings_retrieved'],
                data=serialized_data,
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            error_msg = str(e)
            if error_msg == "database_error":
                message = SETTINGS_ERRORS['settings_table_not_found']
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            elif error_msg == "retrieve_failed":
                message = SETTINGS_ERRORS['settings_retrieve_failed']
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            else:
                message = SETTINGS_ERRORS['settings_not_found']
                status_code = status.HTTP_404_NOT_FOUND
            
            return APIResponse.error(
                message=message,
                status_code=status_code
            )
        except Exception as e:
            return APIResponse.error(
                message=SETTINGS_ERRORS['settings_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, *args, **kwargs):
        try:
            cache_key = SettingsCacheKeys.general_settings()
            cached_data = cache.get(cache_key)
            
            if cached_data is not None:
                return APIResponse.success(
                    message=SETTINGS_SUCCESS['settings_retrieved'],
                    data=cached_data,
                    status_code=status.HTTP_200_OK
                )
            
            settings = get_general_settings()
            serializer = self.get_serializer(settings)
            serialized_data = serializer.data
            
            cache.set(cache_key, serialized_data, 300)
            
            return APIResponse.success(
                message=SETTINGS_SUCCESS['settings_retrieved'],
                data=serialized_data,
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            error_msg = str(e)
            if error_msg == "database_error":
                message = SETTINGS_ERRORS['settings_table_not_found']
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            elif error_msg == "retrieve_failed":
                message = SETTINGS_ERRORS['settings_retrieve_failed']
                status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            else:
                message = SETTINGS_ERRORS['settings_not_found']
                status_code = status.HTTP_404_NOT_FOUND
            
            return APIResponse.error(
                message=message,
                status_code=status_code
            )
    
    def update(self, request, *args, **kwargs):
        try:
            settings = get_general_settings()
            serializer = self.get_serializer(settings, data=request.data, partial=True)
            
            if not serializer.is_valid():
                return APIResponse.error(
                    message=SETTINGS_ERRORS['validation_error'],
                    errors=serializer.errors,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            updated_settings = update_general_settings(serializer.validated_data)
            SettingsCacheManager.invalidate_general_settings()
            response_serializer = self.get_serializer(updated_settings)
            
            return APIResponse.success(
                message=SETTINGS_SUCCESS['settings_updated'],
                data=response_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except ValidationError:
            return APIResponse.error(
                message=SETTINGS_ERRORS['validation_error'],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception:
            return APIResponse.error(
                message=SETTINGS_ERRORS['settings_update_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
