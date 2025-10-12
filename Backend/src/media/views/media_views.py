from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models.deletion import ProtectedError
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from src.core.pagination.pagination import StandardLimitPagination
from src.core.responses import APIResponse, PaginationAPIResponse
from src.media.filters.media_filters import MediaFilter
from src.media.messages import MEDIA_SUCCESS, MEDIA_ERRORS
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
from src.media.serializers.media_serializer import MediaAdminSerializer, MediaPublicSerializer
from src.media.services.media_services import MediaAdminService, MediaPublicService
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication


# -------------------- ViewSet BY ID --------------------
class MediaAdminViewSet(viewsets.ModelViewSet):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    serializer_class = MediaAdminSerializer
    pagination_class = StandardLimitPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = MediaFilter
    search_fields = ['title', 'is_active']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Return a placeholder queryset
        # The actual implementation is in the list method
        return ImageMedia.objects.none()

    def list(self, request, *args, **kwargs):
        # Override the list method to combine all media types
        # This ensures we show all media types in the admin panel
        
        # Fetch all media types
        image_media = list(ImageMedia.objects.all())
        video_media = list(VideoMedia.objects.all())
        audio_media = list(AudioMedia.objects.all())
        document_media = list(DocumentMedia.objects.all())
        
        # Combine all media objects
        all_media = image_media + video_media + audio_media + document_media
        
        # Apply filtering manually since we can't use Django FilterSet with multiple models
        # Filter by title if provided
        search_title = request.query_params.get('title', None)
        if search_title:
            all_media = [media for media in all_media if search_title.lower() in (media.title or '').lower()]
        
        # Filter by is_active if provided
        is_active = request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            all_media = [media for media in all_media if media.is_active == is_active_bool]
        
        # Sort by created_at (newest first)
        all_media.sort(key=lambda x: x.created_at, reverse=True)
        
        # Apply pagination
        paginator = self.pagination_class()
        paginated_data = paginator.paginate_queryset(all_media, request)
        
        # Serialize the data
        serializer = self.get_serializer(paginated_data, many=True)
        
        return PaginationAPIResponse.paginated_success(
            MEDIA_SUCCESS["media_list_success"],
            {
                'results': serializer.data,
                'count': len(all_media),
                'next': paginator.get_next_link(),
                'previous': paginator.get_previous_link()
            }
        )

    def create(self, request, *args, **kwargs):
        # Auto-detect media type from file extension
        file = request.FILES.get('file') or request.FILES.get('files')
        if not file:
            return APIResponse.error(
                message="No file provided",
                errors=None,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        file_ext = file.name.lower().split('.')[-1] if '.' in file.name else ''
        media_type = 'image'  # Default
        
        # Simple type detection
        if file_ext in ['mp4', 'webm', 'mov']:
            media_type = 'video'
        elif file_ext in ['mp3', 'ogg', 'aac', 'm4a']:
            media_type = 'audio'
        elif file_ext == 'pdf':
            media_type = 'pdf'
        
        try:
            # Use the service to create the media
            media = MediaAdminService.create_media(media_type, {
                'file': file,
                'title': request.data.get('title', file.name),
                'alt_text': request.data.get('alt_text', ''),
            })
            
            # Handle cover image for videos
            if media_type == 'video':
                cover_image_file = request.FILES.get('cover_image')
                if cover_image_file:
                    cover_media = MediaAdminService.create_media('image', {
                        'file': cover_image_file,
                        'title': f"Cover for {file.name}",
                        'alt_text': f"Cover image for {file.name}",
                    })
                    media.cover_image = cover_media
                    media.save(update_fields=['cover_image'])
            
            # Return the serialized media object
            serializer = self.get_serializer(media)
            return APIResponse.success(
                MEDIA_SUCCESS["media_created"],
                serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            return APIResponse.error(
                message=f"Failed to create media: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def retrieve(self, request, *args, **kwargs):
        # We need to determine the media type to retrieve the correct object
        # For now, we'll try to find it in each model
        media_id = kwargs.get("pk")
        media = None
        
        for model in [ImageMedia, VideoMedia, AudioMedia, DocumentMedia]:
            try:
                media = model.objects.get(id=media_id)
                break
            except model.DoesNotExist:
                continue
        
        if media:
            serializer = self.get_serializer(media)
            return APIResponse.success(MEDIA_SUCCESS["media_retrieved"], serializer.data)
        else:
            return APIResponse.error(MEDIA_ERRORS["media_not_found"], status_code=status.HTTP_404_NOT_FOUND)

    def update(self, request, *args, **kwargs):
        try:
            # Get the media object
            media_id = kwargs.get("pk")
            
            # We need to determine the media type to update the correct object
            media = None
            media_type = None
            
            model_map = {
                'image': ImageMedia,
                'video': VideoMedia,
                'audio': AudioMedia,
                'pdf': DocumentMedia,
            }
            
            for mtype, model in model_map.items():
                try:
                    media = model.objects.get(id=media_id)
                    media_type = mtype
                    break
                except model.DoesNotExist:
                    continue
            
            if not media:
                return APIResponse.error(MEDIA_ERRORS["media_not_found"], status_code=status.HTTP_404_NOT_FOUND)
            
            # Use the service to update the media
            updated_media = MediaAdminService.update_media_by_id_and_type(media_id, media_type, request.data)
            
            # Return the serialized media object
            serializer = self.get_serializer(updated_media)
            return APIResponse.success(MEDIA_SUCCESS["media_updated"], serializer.data)
        except Exception as e:
            print(f"Error in update: {e}")  # Debug print
            return APIResponse.error(message=MEDIA_ERRORS["media_update_failed"], status_code=400)

    def partial_update(self, request, *args, **kwargs):
        try:
            # Get the media object
            media_id = kwargs.get("pk")
            
            # We need to determine the media type to update the correct object
            media = None
            media_type = None
            
            model_map = {
                'image': ImageMedia,
                'video': VideoMedia,
                'audio': AudioMedia,
                'pdf': DocumentMedia,
            }
            
            for mtype, model in model_map.items():
                try:
                    media = model.objects.get(id=media_id)
                    media_type = mtype
                    break
                except model.DoesNotExist:
                    continue
            
            if not media:
                return APIResponse.error(MEDIA_ERRORS["media_not_found"], status_code=status.HTTP_404_NOT_FOUND)
            
            # Use the service to update the media
            updated_media = MediaAdminService.update_media_by_id_and_type(media_id, media_type, request.data)
            
            # Return the serialized media object
            serializer = self.get_serializer(updated_media)
            return APIResponse.success(MEDIA_SUCCESS["media_updated"], serializer.data)
        except Exception as e:
            print(f"Error in partial_update: {e}")  # Debug print
            return APIResponse.error(message=MEDIA_ERRORS["media_update_failed"], status_code=400)

    def destroy(self, request, *args, **kwargs):
        try:
            # Get the media object
            media_id = kwargs.get("pk")
            
            # We need to determine the media type to delete the correct object
            media = None
            media_type = None
            
            model_map = {
                'image': ImageMedia,
                'video': VideoMedia,
                'audio': AudioMedia,
                'pdf': DocumentMedia,
            }
            
            for mtype, model in model_map.items():
                try:
                    media = model.objects.get(id=media_id)
                    media_type = mtype
                    break
                except model.DoesNotExist:
                    continue
            
            if not media:
                return APIResponse.error(MEDIA_ERRORS["media_not_found"], status_code=status.HTTP_404_NOT_FOUND)
            
            # Use the service to delete the media
            MediaAdminService.delete_media_by_id_and_type(media_id, media_type)
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

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """Bulk delete media files"""
        try:
            media_data = request.data.get('media_data', [])
            if not media_data:
                return APIResponse.error(
                    message="No media data provided",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            if not isinstance(media_data, list):
                return APIResponse.error(
                    message="media_data must be a list of {id, type} objects",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # Delete media files
            deleted_count = 0
            failed_items = []
            for item in media_data:
                try:
                    media_id = item.get('id')
                    media_type = item.get('type')
                    if not media_id or not media_type:
                        failed_items.append(item)
                        continue
                    
                    MediaAdminService.delete_media_by_id_and_type(media_id, media_type)
                    deleted_count += 1
                except ProtectedError:
                    failed_items.append(item)
                    continue
                except Exception:
                    failed_items.append(item)
                    continue
            
            return APIResponse.success(
                message=f"Successfully deleted {deleted_count} media files",
                data={
                    'deleted_count': deleted_count, 
                    'total_requested': len(media_data),
                    'failed_items': failed_items
                },
                status_code=status.HTTP_200_OK
            )
            
        except Exception as e:
            return APIResponse.error(
                message=f"Bulk delete failed: {str(e)}",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# -------------------- ViewSet BY Public ID --------------------
class MediaPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = MediaPublicSerializer
    pagination_class = StandardLimitPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = MediaFilter
    search_fields = ['title', 'is_active']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        # For public viewset, we'll return images by default
        # Other types can be filtered
        return ImageMedia.objects.none()

    def list(self, request, *args, **kwargs):
        # Override the list method to combine all media types
        # This ensures we show all media types in the public view
        
        # Fetch all media types that are active
        image_media = list(ImageMedia.objects.filter(is_active=True))
        video_media = list(VideoMedia.objects.filter(is_active=True))
        audio_media = list(AudioMedia.objects.filter(is_active=True))
        document_media = list(DocumentMedia.objects.filter(is_active=True))
        
        # Combine all media objects
        all_media = image_media + video_media + audio_media + document_media
        
        # Apply filtering manually since we can't use Django FilterSet with multiple models
        # Filter by title if provided
        search_title = request.query_params.get('title', None)
        if search_title:
            all_media = [media for media in all_media if search_title.lower() in (media.title or '').lower()]
        
        # Filter by is_active if provided (always true for public view)
        is_active = request.query_params.get('is_active', 'true')
        if is_active.lower() == 'true':
            all_media = [media for media in all_media if media.is_active]
        
        # Sort by created_at (newest first)
        all_media.sort(key=lambda x: x.created_at, reverse=True)
        
        # Apply pagination
        paginator = self.pagination_class()
        paginated_data = paginator.paginate_queryset(all_media, request)
        
        # Serialize the data
        serializer = self.get_serializer(paginated_data, many=True)
        
        return PaginationAPIResponse.paginated_success(
            MEDIA_SUCCESS["media_list_success"],
            {
                'results': serializer.data,
                'count': len(all_media),
                'next': paginator.get_next_link(),
                'previous': paginator.get_previous_link()
            }
        )

    def retrieve(self, request, *args, **kwargs):
        public_id = kwargs.get("pk")
        media_type = request.query_params.get('type', 'image')
        
        media = MediaPublicService.get_media_by_public_id_and_type(public_id, media_type)
        if media:
            serializer = self.get_serializer(media)
            return APIResponse.success(message=MEDIA_SUCCESS["media_retrieved"], data=serializer.data)

        return APIResponse.error(MEDIA_ERRORS["media_not_found"], status_code=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get media by type"""
        media_type = request.query_params.get('type', 'image')
        is_active = request.query_params.get('is_active', 'true').lower() == 'true'
        
        media_list = MediaPublicService.get_all_media_by_type(media_type, is_active)
        
        if media_list:
            paginator = self.pagination_class()
            paginated_data = paginator.paginate_queryset(media_list, request)
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
