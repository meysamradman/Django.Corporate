from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from django.db.models.deletion import ProtectedError
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from src.core.pagination.pagination import StandardLimitPagination
from src.core.responses import APIResponse
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
        
        # Use database-level filtering for better performance
        image_qs = ImageMedia.objects.all()
        video_qs = VideoMedia.objects.all()
        audio_qs = AudioMedia.objects.all()
        document_qs = DocumentMedia.objects.all()
        
        # Apply filtering at the database level
        search_title = request.query_params.get('title', None)
        if search_title:
            image_qs = image_qs.filter(title__icontains=search_title)
            video_qs = video_qs.filter(title__icontains=search_title)
            audio_qs = audio_qs.filter(title__icontains=search_title)
            document_qs = document_qs.filter(title__icontains=search_title)
        
        # Filter by is_active if provided
        is_active = request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            image_qs = image_qs.filter(is_active=is_active_bool)
            video_qs = video_qs.filter(is_active=is_active_bool)
            audio_qs = audio_qs.filter(is_active=is_active_bool)
            document_qs = document_qs.filter(is_active=is_active_bool)
        
        # Combine all media objects with type information
        all_media = list(image_qs) + list(video_qs) + list(audio_qs) + list(document_qs)
        
        # Sort by created_at (newest first) at Python level since we're combining different models
        all_media.sort(key=lambda x: x.created_at, reverse=True)
        
        # Apply pagination
        page = self.paginate_queryset(all_media)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(all_media, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        # Auto-detect media type from file extension
        file = request.FILES.get('file') or request.FILES.get('files')
        if not file:
            return Response(
                {"detail": "No file provided"},
                status=status.HTTP_400_BAD_REQUEST
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
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"detail": f"Failed to create media: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
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
            return Response(serializer.data)
        else:
            return Response(
                {"detail": MEDIA_ERRORS["media_not_found"]},
                status=status.HTTP_404_NOT_FOUND
            )

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
                return Response(
                    {"detail": MEDIA_ERRORS["media_not_found"]},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Use the service to update the media
            updated_media = MediaAdminService.update_media_by_id_and_type(media_id, media_type, request.data)
            
            # Return the serialized media object
            serializer = self.get_serializer(updated_media)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error in update: {e}")  # Debug print
            return Response(
                {"detail": MEDIA_ERRORS["media_update_failed"]},
                status=status.HTTP_400_BAD_REQUEST
            )

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
                return Response(
                    {"detail": MEDIA_ERRORS["media_not_found"]},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Use the service to update the media
            updated_media = MediaAdminService.update_media_by_id_and_type(media_id, media_type, request.data)
            
            # Return the serialized media object
            serializer = self.get_serializer(updated_media)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error in partial_update: {e}")  # Debug print
            return Response(
                {"detail": MEDIA_ERRORS["media_update_failed"]},
                status=status.HTTP_400_BAD_REQUEST
            )

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
                return Response(
                    {"detail": MEDIA_ERRORS["media_not_found"]},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Use the service to delete the media
            MediaAdminService.delete_media_by_id_and_type(media_id, media_type)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ObjectDoesNotExist:
            return Response(
                {"detail": MEDIA_ERRORS["media_not_found"]},
                status=status.HTTP_404_NOT_FOUND
            )
        except ProtectedError:
            return Response(
                {"detail": "این رسانه در بخش‌های دیگر استفاده شده و قابل حذف نیست."},
                status=status.HTTP_409_CONFLICT
            )
        except ValidationError as e:
            return Response(
                {"detail": f"خطای اعتبارسنجی حذف: {e}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": f"حذف رسانه ناموفق بود: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """Bulk delete media files"""
        try:
            media_data = request.data.get('media_data', [])
            if not media_data:
                return Response(
                    {"detail": "No media data provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not isinstance(media_data, list):
                return Response(
                    {"detail": "media_data must be a list of {id, type} objects"},
                    status=status.HTTP_400_BAD_REQUEST
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
            
            return Response({
                "detail": f"Successfully deleted {deleted_count} media files",
                "data": {
                    'deleted_count': deleted_count, 
                    'total_requested': len(media_data),
                    'failed_items': failed_items
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"detail": f"Bulk delete failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
        
        # Use database-level filtering for better performance
        image_qs = ImageMedia.objects.filter(is_active=True)
        video_qs = VideoMedia.objects.filter(is_active=True)
        audio_qs = AudioMedia.objects.filter(is_active=True)
        document_qs = DocumentMedia.objects.filter(is_active=True)
        
        # Apply filtering at the database level
        search_title = request.query_params.get('title', None)
        if search_title:
            image_qs = image_qs.filter(title__icontains=search_title)
            video_qs = video_qs.filter(title__icontains=search_title)
            audio_qs = audio_qs.filter(title__icontains=search_title)
            document_qs = document_qs.filter(title__icontains=search_title)
        
        # Combine all media objects with type information
        all_media = list(image_qs) + list(video_qs) + list(audio_qs) + list(document_qs)
        
        # Sort by created_at (newest first) at Python level since we're combining different models
        all_media.sort(key=lambda x: x.created_at, reverse=True)
        
        # Apply pagination
        page = self.paginate_queryset(all_media)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(all_media, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        public_id = kwargs.get("pk")
        media_type = request.query_params.get('type', 'image')
        
        media = MediaPublicService.get_media_by_public_id_and_type(public_id, media_type)
        if media:
            serializer = self.get_serializer(media)
            return Response(serializer.data)

        return Response(
            {"detail": MEDIA_ERRORS["media_not_found"]},
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get media by type"""
        media_type = request.query_params.get('type', 'image')
        is_active = request.query_params.get('is_active', 'true').lower() == 'true'
        
        media_list = MediaPublicService.get_all_media_by_type(media_type, is_active)
        
        if media_list:
            page = self.paginate_queryset(media_list)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(media_list, many=True)
            return Response(serializer.data)
        else:
            return Response({
                'results': [],
                'count': 0,
                'next': None,
                'previous': None
            })