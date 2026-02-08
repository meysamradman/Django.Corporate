from rest_framework import viewsets, status
from src.core.responses.response import APIResponse
from ..models.map_settings import MapSettings
from ..serializers.map_settings_serializer import MapSettingsSerializer
from src.user.access_control import PermissionRequiredMixin

class MapSettingsViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    queryset = MapSettings.objects.all()
    serializer_class = MapSettingsSerializer
    
    permission_map = {
        'list': 'settings.manage',
        'retrieve': 'settings.manage',
        'create': 'settings.manage',
        'update': 'settings.manage',
        'partial_update': 'settings.manage',
        'destroy': 'settings.manage',
    }

    def list(self, request, *args, **kwargs):
        settings = MapSettings.objects.first()
        if not settings:
            settings = MapSettings.objects.create(provider='leaflet')
        serializer = self.get_serializer(settings)
        return APIResponse.success(data=serializer.data)

    def update(self, request, *args, **kwargs):
        settings = MapSettings.objects.first()
        if not settings:
            settings = MapSettings.objects.create(provider='leaflet')
        
        serializer = self.get_serializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return APIResponse.success(data=serializer.data)
        return APIResponse.error(errors=serializer.errors)
