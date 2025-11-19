from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from src.user.authorization import PanelManagerAccess
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.user.permissions import PermissionValidator
from src.panel.models import PanelSettings
from src.panel.serializers import PanelSettingsSerializer
from src.core.responses.response import APIResponse


class AdminPanelSettingsViewSet(viewsets.ModelViewSet):
    queryset = PanelSettings.objects.select_related('logo', 'favicon').all()
    serializer_class = PanelSettingsSerializer
    permission_classes = [PanelManagerAccess]
    authentication_classes = [CSRFExemptSessionAuthentication]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def list(self, request, *args, **kwargs):
        # استراتژی کلی: یک permission برای همه عملیات (panel.manage)
        # RouteGuard چک می‌کند که کاربر panel.manage دارد
        instance, _ = PanelSettings.objects.get_or_create()
        serializer = self.get_serializer(instance)
        # Return response using DRF Response - renderer will format it
        return Response({
            "metaData": {
                "status": "success",
                "message": "Panel settings retrieved",
                "AppStatusCode": 200,
                "timestamp": "2025-10-14T21:56:49.556Z"
            },
            "data": serializer.data
        })

    def update(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'panel.manage'):
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "You don't have permission to update panel settings",
                    "AppStatusCode": 403,
                    "timestamp": "2025-10-14T21:56:49.556Z"
                },
                "data": None
            }, status=status.HTTP_403_FORBIDDEN)
        instance, _ = PanelSettings.objects.get_or_create()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Return response using DRF Response - renderer will format it
        return Response({
            "metaData": {
                "status": "success",
                "message": "Panel settings updated",
                "AppStatusCode": 200,
                "timestamp": "2025-10-14T21:56:49.556Z"
            },
            "data": serializer.data
        })

    @action(detail=False, methods=['put', 'patch'], url_path='update', parser_classes=[MultiPartParser, FormParser])
    def update_settings(self, request, *args, **kwargs):
        """Custom action to update panel settings at the collection level"""
        if not PermissionValidator.has_permission(request.user, 'panel.manage'):
            return Response({
                "metaData": {
                    "status": "error",
                    "message": "You don't have permission to update panel settings",
                    "AppStatusCode": 403,
                    "timestamp": "2025-10-14T21:56:49.556Z"
                },
                "data": None
            }, status=status.HTTP_403_FORBIDDEN)
        instance, _ = PanelSettings.objects.get_or_create()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Return response using DRF Response - renderer will format it
        return Response({
            "metaData": {
                "status": "success",
                "message": "Panel settings updated",
                "AppStatusCode": 200,
                "timestamp": "2025-10-14T21:56:49.556Z"
            },
            "data": serializer.data
        })