from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.cache import cache

from src.user.authorization.admin_permission import RequirePermission
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.panel.models import PanelSettings
from src.panel.serializers import PanelSettingsSerializer
from src.core.responses.response import APIResponse
from src.panel.messages.messages import PANEL_SUCCESS, PANEL_ERRORS
from src.panel.utils.cache import PanelCacheKeys, PanelCacheManager


class AdminPanelSettingsViewSet(viewsets.ModelViewSet):
    queryset = PanelSettings.objects.select_related('logo', 'favicon').all()
    serializer_class = PanelSettingsSerializer
    authentication_classes = [CSRFExemptSessionAuthentication]
    
    def get_permissions(self):
        return [RequirePermission('panel.manage')]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def list(self, request, *args, **kwargs):
        cache_key = PanelCacheKeys.panel_settings()
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return APIResponse.success(
                message=PANEL_SUCCESS["settings_retrieved"],
                data=cached_data,
                status_code=status.HTTP_200_OK
            )
        
        instance, _ = PanelSettings.objects.get_or_create()
        serializer = self.get_serializer(instance)
        serialized_data = serializer.data
        
        cache.set(cache_key, serialized_data, 300)
        
        return APIResponse.success(
            message=PANEL_SUCCESS["settings_retrieved"],
            data=serialized_data,
            status_code=status.HTTP_200_OK
        )

    def update(self, request, *args, **kwargs):
        instance, _ = PanelSettings.objects.get_or_create()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        PanelCacheManager.invalidate_panel_settings()
        
        return APIResponse.success(
            message=PANEL_SUCCESS["settings_updated"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )

    @action(detail=False, methods=['put', 'patch'], url_path='update', parser_classes=[MultiPartParser, FormParser])
    def update_settings(self, request, *args, **kwargs):
        instance, _ = PanelSettings.objects.get_or_create()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        PanelCacheManager.invalidate_panel_settings()
        
        return APIResponse.success(
            message=PANEL_SUCCESS["settings_updated"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )