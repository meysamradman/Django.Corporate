from rest_framework import viewsets
from rest_framework.parsers import JSONParser

from src.user.access_control import settings_permission, PermissionRequiredMixin
from src.settings.models import FooterSection
from src.settings.serializers.admin.footer_section_serializer import FooterSectionSerializer
from src.settings.utils.cache import SettingsCacheManager

class FooterSectionViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    queryset = FooterSection.objects.all()
    serializer_class = FooterSectionSerializer
    permission_classes = [settings_permission]
    parser_classes = [JSONParser]

    permission_map = {
        'list': 'settings.manage',
        'retrieve': 'settings.manage',
        'create': 'settings.manage',
        'update': 'settings.manage',
        'partial_update': 'settings.manage',
        'destroy': 'settings.manage',
    }

    def perform_create(self, serializer):
        instance = serializer.save()
        SettingsCacheManager.invalidate_footer_public()
        return instance

    def perform_update(self, serializer):
        instance = serializer.save()
        SettingsCacheManager.invalidate_footer_public()
        return instance

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        SettingsCacheManager.invalidate_footer_public()
