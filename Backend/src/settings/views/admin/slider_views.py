from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from src.user.access_control import settings_permission, PermissionRequiredMixin
from src.settings.models import Slider
from src.settings.serializers.admin.slider_serializer import SliderSerializer
from src.settings.utils.cache import SettingsCacheManager

class SliderViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    queryset = Slider.objects.all()
    serializer_class = SliderSerializer
    permission_classes = [settings_permission]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    permission_map = {
        'list': 'settings.manage',
        'retrieve': 'settings.manage',
        'create': 'settings.manage',
        'update': 'settings.manage',
        'partial_update': 'settings.manage',
        'destroy': 'settings.manage',
    }

    def get_queryset(self):
        if self.request.user and self.request.user.is_staff:
            return Slider.objects.all()
        return Slider.objects.filter(is_active=True)

    def perform_create(self, serializer):
        instance = serializer.save()
        SettingsCacheManager.invalidate_branding_public()
        return instance

    def perform_update(self, serializer):
        instance = serializer.save()
        SettingsCacheManager.invalidate_branding_public()
        return instance

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        SettingsCacheManager.invalidate_branding_public()
