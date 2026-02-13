from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.cache import cache
from django.http import StreamingHttpResponse, HttpResponse
from django.conf import settings

from src.user.access_control import IsSuperAdmin
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.panel.services import PanelSettingsService
from src.panel.services.database_export_service import (
    export_database_to_sql,
    get_database_export_filename,
    get_database_size_info,
)
from src.panel.serializers import PanelSettingsSerializer
from src.core.responses.response import APIResponse
from src.panel.messages.messages import PANEL_SUCCESS, PANEL_ERRORS
from src.panel.utils.cache import PanelCacheKeys, PanelCacheManager

class AdminPanelSettingsViewSet(viewsets.ViewSet):
    authentication_classes = [CSRFExemptSessionAuthentication]

    def get_permissions(self):
        return [IsSuperAdmin()]
    serializer_class = PanelSettingsSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer(self, *args, **kwargs):
        kwargs.setdefault('context', self.get_serializer_context())
        return self.serializer_class(*args, **kwargs)
    
    def get_serializer_context(self):
        return {
            'request': self.request,
            'format': self.format_kwarg,
            'view': self
        }

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
    
    @action(detail=False, methods=['get'], url_path='database-export/info')
    def get_database_export_info(self, request):
        
        try:
            db_info = get_database_size_info()
            
            return APIResponse.success(
                message='Database information retrieved successfully',
                data=db_info,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=f'Error retrieving database information: {str(e)}',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='database-export/download')
    def download_database_export(self, request):
        
        if not getattr(request.user, 'is_admin_full', False):
            from django.core.cache import cache
            export_rate_limit = settings.DATABASE_EXPORT_RATE_LIMIT
            export_rate_window = settings.DATABASE_EXPORT_RATE_LIMIT_WINDOW
            cache_key = f"database_export_limit_{request.user.id}"
            export_count = cache.get(cache_key, 0)
            if export_count >= export_rate_limit:
                return APIResponse.error(
                    message='Database export rate limit exceeded. Please try again later.',
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS
                )
            cache.set(cache_key, export_count + 1, export_rate_window)
        
        try:
            buffer = export_database_to_sql()
            filename = get_database_export_filename()
            
            buffer.seek(0)
            
            def file_iterator(file_object, chunk_size=8192):
                
                while True:
                    chunk = file_object.read(chunk_size)
                    if not chunk:
                        break
                    yield chunk
            
            response = StreamingHttpResponse(
                file_iterator(buffer),
                content_type='application/gzip'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['X-Content-Type-Options'] = 'nosniff'
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            
            return response
            
        except Exception as e:
            return APIResponse.error(
                message=f'Error exporting database: {str(e)}',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )