from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from src.user.authorization.admin_permission import AdminRolePermission
from src.panel.models import PanelSettings
from src.panel.serializers import PanelSettingsSerializer
from src.core.responses.response import APIResponse


class AdminPanelSettingsViewSet(viewsets.ModelViewSet):
    queryset = PanelSettings.objects.select_related('logo', 'favicon').all()
    serializer_class = PanelSettingsSerializer
    permission_classes = [AdminRolePermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def list(self, request, *args, **kwargs):
        instance, _ = PanelSettings.objects.get_or_create()
        serializer = self.get_serializer(instance)
        return APIResponse.success("Panel settings retrieved", serializer.data)

    def update(self, request, *args, **kwargs):
        instance, _ = PanelSettings.objects.get_or_create()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return APIResponse.success("Panel settings updated", serializer.data)


