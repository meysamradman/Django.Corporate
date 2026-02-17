import logging
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models.deletion import ProtectedError

logger = logging.getLogger(__name__)
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from src.core.pagination.pagination import StandardLimitPagination
from src.core.responses.response import APIResponse
from src.media.filters.media_filters import MediaFilter
from src.media.messages import MEDIA_ERRORS, MEDIA_SUCCESS
from src.media.models.media import AudioMedia, DocumentMedia, ImageMedia, VideoMedia, detect_media_type_from_extension
from src.media.serializers.media_serializer import MediaAdminSerializer, MediaPublicSerializer
from src.media.services.media_services import MediaAdminService, MediaPublicService
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.user.access_control import media_permission, PermissionRequiredMixin
from src.user.access_control.definitions.validator import PermissionValidator
from src.core.utils.validation_helpers import extract_validation_message

class MediaAdminViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [media_permission]
    
    permission_map = {
        'list': 'media.read',
        'retrieve': 'media.read',
        'create': 'media.upload',
        'update': 'media.update',
        'partial_update': 'media.update',
        'destroy': 'media.delete',
        'bulk_delete': 'media.delete',
        'bulk_update': 'media.update',
        'update_cover': 'media.update',
    }
    permission_denied_message = MEDIA_ERRORS["UPLOAD_PERMISSION_DENIED"]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    serializer_class = MediaAdminSerializer
    pagination_class = StandardLimitPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = MediaFilter
    search_fields = ['title', 'is_active']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return ImageMedia.objects.none()

    def list(self, request, *args, **kwargs):
        search_term = request.query_params.get('search') or request.query_params.get('title')
        file_type = request.query_params.get('file_type')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        is_active = request.query_params.get('is_active')

        all_media_data = MediaAdminService.get_filtered_media_list_data(
            search=search_term,
            file_type=file_type,
            is_active=is_active,
            date_from=date_from,
            date_to=date_to
        )

        page = self.paginate_queryset(all_media_data)
        if page is not None:
            return self.get_paginated_response(page)

        return APIResponse.success(
            message=MEDIA_SUCCESS["media_list_success"],
            data=all_media_data
        )

    def create(self, request, *args, **kwargs):
        file = request.FILES.get('file') or request.FILES.get('files')
        if not file:
            return APIResponse.error(
                message=MEDIA_ERRORS["media_file_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        file_ext = file.name.lower().split('.')[-1] if '.' in file.name else ''
        media_type = detect_media_type_from_extension(file_ext)
        
        context_type = request.data.get('context_type', 'media_library')
        context_action = request.data.get('context_action', 'create')
        
        context = {
            'type': context_type,
            'action': context_action
        } if context_type != 'media_library' else None
        
        has_general_upload = PermissionValidator.has_permission(
            request.user, 
            'media.upload',
            context=context
        )
        
        type_specific_perm = f'media.{media_type}.upload'
        has_type_specific = PermissionValidator.has_permission(
            request.user,
            type_specific_perm,
            context=context
        )
        
        if not (has_general_upload or has_type_specific):
            return APIResponse.error(
                message=MEDIA_ERRORS["UPLOAD_PERMISSION_DENIED"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            cover_image_file = request.FILES.get('cover_image')
            cover_media = None
            
            if (media_type == 'video' or media_type == 'audio' or media_type == 'pdf') and cover_image_file:
                cover_media = MediaAdminService.create_media('image', {
                    'file': cover_image_file,
                    'title': f"Cover for {file.name}",
                    'alt_text': f"Cover image for {file.name}",
                })
            
            media_data = {
                'file': file,
                'title': request.data.get('title', file.name),
                'alt_text': request.data.get('alt_text', ''),
            }
            
            if cover_media:
                media_data['cover_image'] = cover_media
            
            media = MediaAdminService.create_media(media_type, media_data)
            
            serializer = self.get_serializer(media)
            return APIResponse.success(
                message=MEDIA_SUCCESS["media_created"],
                data=serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except ValidationError:
            return APIResponse.error(
                message=MEDIA_ERRORS["media_data_invalid"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return APIResponse.error(
                message=MEDIA_ERRORS["media_create_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def retrieve(self, request, *args, **kwargs):
        media_id = kwargs.get("pk")

        media_data = MediaAdminService.get_media_detail_data(media_id)
        if media_data:
            return APIResponse.success(
                message=MEDIA_SUCCESS["media_retrieved"],
                data=media_data
            )
        else:
            return APIResponse.error(
                message=MEDIA_ERRORS["media_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )

    def update(self, request, *args, **kwargs):
        media_id = kwargs.get("pk")
        print(f"\n{'='*80}")
        print(f"🌐 [MediaView][Update] Received update request for media ID: {media_id}")
        print(f"🌐 [MediaView][Update] Request data: {request.data}")
        print(f"{'='*80}\n")
        
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
                print(f"✅ [MediaView][Update] Found media type: {media_type} for ID: {media_id}")
                break
            except model.DoesNotExist:
                continue
        
        if not media:
            print(f"❌ [MediaView][Update] ERROR: Media not found with ID: {media_id}\n")
            return APIResponse.error(
                message=MEDIA_ERRORS["media_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        try:
            print(f"🔄 [MediaView][Update] Calling service to update media ID {media_id} (type: {media_type})")
            updated_media = MediaAdminService.update_media_by_id_and_type(media_id, media_type, request.data)
            print(f"✅ [MediaView][Update] Service call successful for media ID {media_id}")
            
            serializer = self.get_serializer(updated_media)
            print(f"✅ [MediaView][Update] Serialization successful, returning success response\n")
            return APIResponse.success(
                message=MEDIA_SUCCESS["media_updated"],
                data=serializer.data
            )
        except (ImageMedia.DoesNotExist, VideoMedia.DoesNotExist, AudioMedia.DoesNotExist, DocumentMedia.DoesNotExist) as e:
            print(f"❌ [MediaView][Update] ERROR: Media not found during update: {str(e)}\n")
            return APIResponse.error(
                message=MEDIA_ERRORS["media_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            print(f"❌ [MediaView][Update] ERROR: Validation error: {str(e)}\n")
            return APIResponse.error(
                message=MEDIA_ERRORS["media_data_invalid"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"❌ [MediaView][Update] ERROR: Unexpected error updating media ID {media_id}: {str(e)}")
            import traceback
            traceback.print_exc()
            print()
            return APIResponse.error(
                message=MEDIA_ERRORS["media_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        media_id = kwargs.get("pk")
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
            return APIResponse.error(
                message=MEDIA_ERRORS["media_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        try:
            MediaAdminService.delete_media_by_id_and_type(media_id, media_type)
            return APIResponse.success(
                message=MEDIA_SUCCESS["media_deleted"],
                status_code=status.HTTP_200_OK
            )
        except (ImageMedia.DoesNotExist, VideoMedia.DoesNotExist, AudioMedia.DoesNotExist, DocumentMedia.DoesNotExist):
            return APIResponse.error(
                message=MEDIA_ERRORS["media_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ProtectedError:
            return APIResponse.error(
                message=MEDIA_ERRORS["media_protected"],
                status_code=status.HTTP_409_CONFLICT
            )
        except ValidationError:
            return APIResponse.error(
                message=MEDIA_ERRORS["media_data_invalid"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return APIResponse.error(
                message=MEDIA_ERRORS["media_delete_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        media_data = request.data.get('media_data', [])
        
        try:
             deleted_count, failed_items = MediaAdminService.bulk_delete_media(media_data)
             
             return APIResponse.success(
                message=MEDIA_SUCCESS["media_bulk_deleted"],
                data={
                    'deleted_count': deleted_count,
                    'total_requested': len(media_data),
                    'failed_items': failed_items
                }
            )
        except ValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, MEDIA_ERRORS["media_data_invalid"]),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception:
            return APIResponse.error(
                message=MEDIA_ERRORS["media_delete_failed"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
        return ImageMedia.objects.none()

    def list(self, request, *args, **kwargs):
        search_term = request.query_params.get('search') or request.query_params.get('title')
        file_type = request.query_params.get('file_type')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        all_media_data = MediaPublicService.get_filtered_media_list_data(
            search=search_term,
            file_type=file_type,
            date_from=date_from,
            date_to=date_to,
        )

        page = self.paginate_queryset(all_media_data)
        if page is not None:
            return self.get_paginated_response(page)

        return APIResponse.success(
            message=MEDIA_SUCCESS["media_list_success"],
            data=all_media_data
        )

    def retrieve(self, request, *args, **kwargs):
        public_id = kwargs.get("pk")
        media_type = request.query_params.get('type', 'image')

        media_data = MediaPublicService.get_media_by_public_id_and_type_data(public_id, media_type)
        if media_data:
            return APIResponse.success(
                message=MEDIA_SUCCESS["media_retrieved"],
                data=media_data
            )

        return APIResponse.error(
            message=MEDIA_ERRORS["media_not_found"],
            status_code=status.HTTP_404_NOT_FOUND
        )

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        media_type = request.query_params.get('type', 'image')
        is_active = request.query_params.get('is_active', 'true').lower() == 'true'

        media_list_data = MediaPublicService.get_all_media_by_type_data(media_type, is_active)

        if media_list_data:
            page = self.paginate_queryset(media_list_data)
            if page is not None:
                return self.get_paginated_response(page)

            return APIResponse.success(
                message=MEDIA_SUCCESS["media_list_success"],
                data=media_list_data
            )
        else:
            return APIResponse.success(
                message=MEDIA_SUCCESS["media_list_success"],
                data={'results': [], 'count': 0, 'next': None, 'previous': None}
            )