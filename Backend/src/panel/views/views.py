from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.cache import cache

from src.user.authorization.admin_permission import RequirePermission
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.panel.services import PanelSettingsService
from src.panel.serializers import PanelSettingsSerializer
from src.core.responses.response import APIResponse
from src.panel.messages.messages import PANEL_SUCCESS, PANEL_ERRORS
from src.panel.utils.cache import PanelCacheKeys, PanelCacheManager


class AdminPanelSettingsViewSet(viewsets.ViewSet):
    authentication_classes = [CSRFExemptSessionAuthentication]
    serializer_class = PanelSettingsSerializer
    
    def get_serializer(self, *args, **kwargs):
        kwargs.setdefault('context', self.get_serializer_context())
        return self.serializer_class(*args, **kwargs)
    
    def get_serializer_context(self):
        return {
            'request': self.request,
            'format': self.format_kwarg,
            'view': self
        }
    
    def get_permissions(self):
        return [RequirePermission('panel.manage')]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def list(self, request, *args, **kwargs):
        instance = PanelSettingsService.get_panel_settings()
        serializer = self.get_serializer(instance)
        
        return APIResponse.success(
            message=PANEL_SUCCESS["settings_retrieved"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )

    def update(self, request, *args, **kwargs):
        instance = PanelSettingsService.get_panel_settings()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        remove_logo = request.data.get('remove_logo') == 'true'
        remove_favicon = request.data.get('remove_favicon') == 'true'

        updated_instance = PanelSettingsService.update_panel_settings(
            instance=instance,
            validated_data=serializer.validated_data,
            remove_logo=remove_logo,
            remove_favicon=remove_favicon
        )
        
        response_serializer = self.get_serializer(updated_instance)
        return APIResponse.success(
            message=PANEL_SUCCESS["settings_updated"],
            data=response_serializer.data,
            status_code=status.HTTP_200_OK
        )

    @action(detail=False, methods=['put', 'patch'], url_path='update', parser_classes=[MultiPartParser, FormParser])
    def update_settings(self, request, *args, **kwargs):
        instance = PanelSettingsService.get_panel_settings()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        remove_logo = request.data.get('remove_logo') == 'true'
        remove_favicon = request.data.get('remove_favicon') == 'true'
        
        updated_instance = PanelSettingsService.update_panel_settings(
            instance=instance,
            validated_data=serializer.validated_data,
            remove_logo=remove_logo,
            remove_favicon=remove_favicon
        )
        
        response_serializer = self.get_serializer(updated_instance)
        return APIResponse.success(
            message=PANEL_SUCCESS["settings_updated"],
            data=response_serializer.data,
            status_code=status.HTTP_200_OK
        )