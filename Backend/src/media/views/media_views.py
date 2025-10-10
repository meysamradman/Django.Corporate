from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models.deletion import ProtectedError
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from src.core.pagination.pagination import StandardLimitPagination
from src.core.responses import APIResponse, PaginationAPIResponse
from src.media.filters.media_filters import MediaFilter
from src.media.messages import MEDIA_SUCCESS, MEDIA_ERRORS
from src.media.models.media import Media
from src.media.serializers.media_serializer import MediaAdminSerializer, MediaPublicSerializer
from src.media.services.media_services import MediaAdminService, MediaPublicService
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication


class BaseMediaViewSet(viewsets.GenericViewSet):
    queryset = Media.objects.filter(is_active=True)
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = MediaFilter
    search_fields = ['title', 'is_active']
    ordering_fields = ['created_at', 'media_type']
    ordering = ['-created_at']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        if queryset.exists():
            paginator = self.pagination_class()
            paginated_data = paginator.paginate_queryset(queryset, request)
            serializer = self.get_serializer(paginated_data, many=True)
            return PaginationAPIResponse.paginated_success(
                MEDIA_SUCCESS["media_list_success"],
                {
                    'results': serializer.data,
                    'count': paginator.count,
                    'next': paginator.get_next_link(),
                    'previous': paginator.get_previous_link()
                }
            )
        else:
            return PaginationAPIResponse.paginated_success(
                MEDIA_ERRORS["media_not_found"],
                {
                    'results': [],
                    'count': 0,
                    'next': None,
                    'previous': None
                }
            )

# -------------------- ViewSet BY ID --------------------
class MediaAdminViewSet(BaseMediaViewSet, viewsets.ModelViewSet):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = MediaAdminSerializer
    pagination_class = StandardLimitPagination
    
    def get_queryset(self):
        # Admin users can see all media (including inactive)
        return Media.objects.all().order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Remove created_by since Media model doesn't have this field
        serializer.save()
        return APIResponse.success(
            MEDIA_SUCCESS["media_created"],
            serializer.data,
            status_code=status.HTTP_201_CREATED
        )

    def retrieve(self, request, *args, **kwargs):
        try:
            media = MediaAdminService.get_media_id(kwargs.get("pk"))
            serializer = self.get_serializer(media)
            return APIResponse.success(MEDIA_SUCCESS["media_retrieved"], serializer.data)
        except Exception:
            return APIResponse.error(MEDIA_ERRORS["media_not_found"], status_code=status.HTTP_404_NOT_FOUND)

    def update(self, request, *args, **kwargs):
        try:
            # Get the media object
            media_id = kwargs.get("pk")
            
            # Use the service to update the media
            updated_media = MediaAdminService.update_media_id(media_id, request.data)
            
            # Return the serialized media object with cover_image properly serialized
            serializer = self.get_serializer(updated_media)
            return APIResponse.success(MEDIA_SUCCESS["media_updated"], serializer.data)
        except Exception as e:
            print(f"Error in update: {e}")  # Debug print
            return APIResponse.error(message=MEDIA_ERRORS["media_update_failed"], status_code=400)

    def partial_update(self, request, *args, **kwargs):
        try:
            # Get the media object
            media_id = kwargs.get("pk")
            
            # Use the service to update the media
            updated_media = MediaAdminService.update_media_id(media_id, request.data)
            
            # Return the serialized media object with cover_image properly serialized
            serializer = self.get_serializer(updated_media)
            return APIResponse.success(MEDIA_SUCCESS["media_updated"], serializer.data)
        except Exception as e:
            print(f"Error in partial_update: {e}")  # Debug print
            return APIResponse.error(message=MEDIA_ERRORS["media_update_failed"], status_code=400)

    def destroy(self, request, *args, **kwargs):
        try:
            MediaAdminService.delete_media_id(kwargs.get("pk"))
            return APIResponse.success(MEDIA_SUCCESS["media_deleted"], status_code=status.HTTP_200_OK)
        except ObjectDoesNotExist:
            return APIResponse.error(
                message=MEDIA_ERRORS["media_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ProtectedError:
            return APIResponse.error(
                message="این رسانه در بخش‌های دیگر استفاده شده و قابل حذف نیست.",
                status_code=status.HTTP_409_CONFLICT
            )
        except ValidationError as e:
            return APIResponse.error(
                message=f"خطای اعتبارسنجی حذف: {e}",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return APIResponse.error(
                message=f"حذف رسانه ناموفق بود: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload(self, request):
        """Upload media files"""
        file = request.FILES.get('file') or request.FILES.get('files')
        if not file:
            return APIResponse.error(
                message="No file provided",
                errors=None,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Auto-detect media type from file extension
        file_ext = file.name.lower().split('.')[-1] if '.' in file.name else ''
        media_type = 'image'  # Default
        
        # Simple type detection (Media model will validate)
        if file_ext in ['mp4', 'webm', 'mov']:
            media_type = 'video'
        elif file_ext in ['mp3', 'ogg']:
            media_type = 'audio'
        elif file_ext == 'pdf':
            media_type = 'pdf'
        
        # Prepare initial data for serializer
        serializer_data = {
            'file': file,
            'media_type': media_type,
            'title': request.data.get('title', file.name),
            'alt_text': request.data.get('alt_text', ''),
        }
        
        # Create the main media object first
        serializer = self.get_serializer(data=serializer_data)
        
        if serializer.is_valid():
            media = serializer.save()
            
            # Handle cover image for non-image media types
            cover_image_file = request.FILES.get('cover_image')
            if cover_image_file and media_type != 'image':
                # First, save the cover image as a separate media object
                cover_serializer = self.get_serializer(data={
                    'file': cover_image_file,
                    'media_type': 'image',
                    'title': f"Cover for {file.name}",
                    'alt_text': f"Cover image for {file.name}",
                })
                
                if cover_serializer.is_valid():
                    cover_media = cover_serializer.save()
                    # Update the main media object with the cover image
                    media.cover_image = cover_media
                    media.save(update_fields=['cover_image'])
                else:
                    # Delete the main media object if cover image validation fails
                    media.delete()
                    return APIResponse.error(
                        message="Cover image validation failed",
                        errors=cover_serializer.errors,
                        status_code=status.HTTP_400_BAD_REQUEST
                    )
            
            # Return the serialized media object with cover_image properly serialized
            response_serializer = self.get_serializer(media)
            return APIResponse.success(
                MEDIA_SUCCESS["media_created"],
                response_serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        else:
            return APIResponse.error(
                message="Validation failed",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """Bulk delete media files"""
        try:
            media_ids = request.data.get('media_ids', [])
            if not media_ids:
                return APIResponse.error(
                    message="No media IDs provided",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            if not isinstance(media_ids, list):
                return APIResponse.error(
                    message="media_ids must be a list",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Delete media files
            deleted_count = 0
            failed_ids = []
            for media_id in media_ids:
                try:
                    MediaAdminService.delete_media_id(media_id)
                    deleted_count += 1
                except ProtectedError:
                    failed_ids.append(media_id)
                    continue
                except Exception:
                    failed_ids.append(media_id)
                    continue
            
            return APIResponse.success(
                message=f"Successfully deleted {deleted_count} media files",
                data={
                    'deleted_count': deleted_count, 
                    'total_requested': len(media_ids),
                    'failed_ids': failed_ids
                },
                status_code=status.HTTP_200_OK
            )
            
        except Exception as e:
            return APIResponse.error(
                message=f"Bulk delete failed: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# -------------------- ViewSet BY Public ID --------------------
class MediaPublicViewSet(BaseMediaViewSet, viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = MediaPublicSerializer
    pagination_class = StandardLimitPagination
    lookup_field = 'public_id'
    lookup_url_kwarg = 'public_id'

    def retrieve(self, request, *args, **kwargs):
        media = MediaPublicService.get_media_by_public_id(kwargs.get("public_id"))
        if media:
            serializer = self.get_serializer(media)
            return APIResponse.success(message=MEDIA_SUCCESS["media_retrieved"], data=serializer.data)

        return APIResponse.error(MEDIA_ERRORS["media_not_found"], status_code=status.HTTP_404_NOT_FOUND)