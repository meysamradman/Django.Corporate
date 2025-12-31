from datetime import datetime
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models.deletion import ProtectedError
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
        
        if not file_type or file_type == 'all':
            image_qs = ImageMedia.objects.all()
            video_qs = VideoMedia.objects.select_related('cover_image').all()
            audio_qs = AudioMedia.objects.select_related('cover_image').all()
            document_qs = DocumentMedia.objects.select_related('cover_image').all()
        elif file_type == 'image':
            image_qs = ImageMedia.objects.all()
            video_qs = VideoMedia.objects.none()
            audio_qs = AudioMedia.objects.none()
            document_qs = DocumentMedia.objects.none()
        elif file_type == 'video':
            image_qs = ImageMedia.objects.none()
            video_qs = VideoMedia.objects.select_related('cover_image').all()
            audio_qs = AudioMedia.objects.none()
            document_qs = DocumentMedia.objects.none()
        elif file_type == 'audio':
            image_qs = ImageMedia.objects.none()
            video_qs = VideoMedia.objects.none()
            audio_qs = AudioMedia.objects.select_related('cover_image').all()
            document_qs = DocumentMedia.objects.none()
        elif file_type in ['document', 'pdf']:
            image_qs = ImageMedia.objects.none()
            video_qs = VideoMedia.objects.none()
            audio_qs = AudioMedia.objects.none()
            document_qs = DocumentMedia.objects.select_related('cover_image').all()
        else:
            image_qs = ImageMedia.objects.none()
            video_qs = VideoMedia.objects.none()
            audio_qs = AudioMedia.objects.none()
            document_qs = DocumentMedia.objects.none()
        
        if search_term:
            image_qs = image_qs.filter(title__icontains=search_term)
            video_qs = video_qs.filter(title__icontains=search_term)
            audio_qs = audio_qs.filter(title__icontains=search_term)
            document_qs = document_qs.filter(title__icontains=search_term)
        
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            image_qs = image_qs.filter(is_active=is_active_bool)
            video_qs = video_qs.filter(is_active=is_active_bool)
            audio_qs = audio_qs.filter(is_active=is_active_bool)
            document_qs = document_qs.filter(is_active=is_active_bool)
        
        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
                image_qs = image_qs.filter(created_at__date__gte=date_from_obj)
                video_qs = video_qs.filter(created_at__date__gte=date_from_obj)
                audio_qs = audio_qs.filter(created_at__date__gte=date_from_obj)
                document_qs = document_qs.filter(created_at__date__gte=date_from_obj)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
                image_qs = image_qs.filter(created_at__date__lte=date_to_obj)
                video_qs = video_qs.filter(created_at__date__lte=date_to_obj)
                audio_qs = audio_qs.filter(created_at__date__lte=date_to_obj)
                document_qs = document_qs.filter(created_at__date__lte=date_to_obj)
            except ValueError:
                pass
        
        all_media = []
        
        if not file_type or file_type == 'all':
            all_media = list(image_qs) + list(video_qs) + list(audio_qs) + list(document_qs)
        elif file_type == 'image':
            all_media = list(image_qs)
        elif file_type == 'video':
            all_media = list(video_qs)
        elif file_type == 'audio':
            all_media = list(audio_qs)
        elif file_type in ['document', 'pdf']:
            all_media = list(document_qs)
        
        all_media.sort(key=lambda x: x.created_at, reverse=True)
        
        page = self.paginate_queryset(all_media)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(all_media, many=True)
        return APIResponse.success(
            message=MEDIA_SUCCESS["media_list_success"],
            data=serializer.data
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
        media = None
        
        for model in [ImageMedia, VideoMedia, AudioMedia, DocumentMedia]:
            try:
                if model in [VideoMedia, AudioMedia, DocumentMedia]:
                    media = model.objects.select_related('cover_image').get(id=media_id)
                else:
                    media = model.objects.get(id=media_id)
                break
            except model.DoesNotExist:
                continue
        
        if media:
            serializer = self.get_serializer(media)
            return APIResponse.success(
                message=MEDIA_SUCCESS["media_retrieved"],
                data=serializer.data
            )
        else:
            return APIResponse.error(
                message=MEDIA_ERRORS["media_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )

    def update(self, request, *args, **kwargs):
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
            updated_media = MediaAdminService.update_media_by_id_and_type(media_id, media_type, request.data)
            serializer = self.get_serializer(updated_media)
            return APIResponse.success(
                message=MEDIA_SUCCESS["media_updated"],
                data=serializer.data
            )
        except (ImageMedia.DoesNotExist, VideoMedia.DoesNotExist, AudioMedia.DoesNotExist, DocumentMedia.DoesNotExist):
            return APIResponse.error(
                message=MEDIA_ERRORS["media_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError:
            return APIResponse.error(
                message=MEDIA_ERRORS["media_data_invalid"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
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
        if not media_data:
            return APIResponse.error(
                message=MEDIA_ERRORS["media_data_invalid"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(media_data, list):
            return APIResponse.error(
                message=MEDIA_ERRORS["media_data_invalid"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        MAX_BULK_DELETE = 100
        if len(media_data) > MAX_BULK_DELETE:
            return APIResponse.error(
                message=MEDIA_ERRORS["bulk_delete_limit_exceeded"].format(max_items=MAX_BULK_DELETE),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        deleted_count = 0
        failed_items = []
        
        with transaction.atomic():
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
            message=MEDIA_SUCCESS["media_bulk_deleted"],
            data={
                'deleted_count': deleted_count,
                'total_requested': len(media_data),
                'failed_items': failed_items
            }
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
        
        if not file_type or file_type == 'all':
            image_qs = ImageMedia.objects.filter(is_active=True).only('id', 'public_id', 'title', 'file', 'file_size', 'mime_type', 'alt_text', 'is_active', 'created_at', 'updated_at')
            video_qs = VideoMedia.objects.select_related('cover_image').filter(is_active=True).only('id', 'public_id', 'title', 'file', 'file_size', 'mime_type', 'alt_text', 'is_active', 'created_at', 'updated_at', 'duration', 'cover_image__id', 'cover_image__file', 'cover_image__title')
            audio_qs = AudioMedia.objects.select_related('cover_image').filter(is_active=True).only('id', 'public_id', 'title', 'file', 'file_size', 'mime_type', 'alt_text', 'is_active', 'created_at', 'updated_at', 'duration', 'cover_image__id', 'cover_image__file', 'cover_image__title')
            document_qs = DocumentMedia.objects.select_related('cover_image').filter(is_active=True).only('id', 'public_id', 'title', 'file', 'file_size', 'mime_type', 'alt_text', 'is_active', 'created_at', 'updated_at', 'cover_image__id', 'cover_image__file', 'cover_image__title')
        elif file_type == 'image':
            image_qs = ImageMedia.objects.filter(is_active=True).only('id', 'public_id', 'title', 'file', 'file_size', 'mime_type', 'alt_text', 'is_active', 'created_at', 'updated_at')
            video_qs = VideoMedia.objects.none()
            audio_qs = AudioMedia.objects.none()
            document_qs = DocumentMedia.objects.none()
        elif file_type == 'video':
            image_qs = ImageMedia.objects.none()
            video_qs = VideoMedia.objects.select_related('cover_image').filter(is_active=True).only('id', 'public_id', 'title', 'file', 'file_size', 'mime_type', 'alt_text', 'is_active', 'created_at', 'updated_at', 'duration', 'cover_image__id', 'cover_image__file', 'cover_image__title')
            audio_qs = AudioMedia.objects.none()
            document_qs = DocumentMedia.objects.none()
        elif file_type == 'audio':
            image_qs = ImageMedia.objects.none()
            video_qs = VideoMedia.objects.none()
            audio_qs = AudioMedia.objects.select_related('cover_image').filter(is_active=True).only('id', 'public_id', 'title', 'file', 'file_size', 'mime_type', 'alt_text', 'is_active', 'created_at', 'updated_at', 'duration', 'cover_image__id', 'cover_image__file', 'cover_image__title')
            document_qs = DocumentMedia.objects.none()
        elif file_type in ['document', 'pdf']:
            image_qs = ImageMedia.objects.none()
            video_qs = VideoMedia.objects.none()
            audio_qs = AudioMedia.objects.none()
            document_qs = DocumentMedia.objects.select_related('cover_image').filter(is_active=True).only('id', 'public_id', 'title', 'file', 'file_size', 'mime_type', 'alt_text', 'is_active', 'created_at', 'updated_at', 'cover_image__id', 'cover_image__file', 'cover_image__title')
        else:
            image_qs = ImageMedia.objects.none()
            video_qs = VideoMedia.objects.none()
            audio_qs = AudioMedia.objects.none()
            document_qs = DocumentMedia.objects.none()
        
        if search_term:
            image_qs = image_qs.filter(title__icontains=search_term)
            video_qs = video_qs.filter(title__icontains=search_term)
            audio_qs = audio_qs.filter(title__icontains=search_term)
            document_qs = document_qs.filter(title__icontains=search_term)
        
        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
                image_qs = image_qs.filter(created_at__date__gte=date_from_obj)
                video_qs = video_qs.filter(created_at__date__gte=date_from_obj)
                audio_qs = audio_qs.filter(created_at__date__gte=date_from_obj)
                document_qs = document_qs.filter(created_at__date__gte=date_from_obj)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
                image_qs = image_qs.filter(created_at__date__lte=date_to_obj)
                video_qs = video_qs.filter(created_at__date__lte=date_to_obj)
                audio_qs = audio_qs.filter(created_at__date__lte=date_to_obj)
                document_qs = document_qs.filter(created_at__date__lte=date_to_obj)
            except ValueError:
                pass
        
        all_media = []
        
        if not file_type or file_type == 'all':
            all_media = list(image_qs) + list(video_qs) + list(audio_qs) + list(document_qs)
        elif file_type == 'image':
            all_media = list(image_qs)
        elif file_type == 'video':
            all_media = list(video_qs)
        elif file_type == 'audio':
            all_media = list(audio_qs)
        elif file_type in ['document', 'pdf']:
            all_media = list(document_qs)
        
        all_media.sort(key=lambda x: x.created_at, reverse=True)
        
        page = self.paginate_queryset(all_media)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(all_media, many=True)
        return APIResponse.success(
            message=MEDIA_SUCCESS["media_list_success"],
            data=serializer.data
        )

    def retrieve(self, request, *args, **kwargs):
        public_id = kwargs.get("pk")
        media_type = request.query_params.get('type', 'image')
        
        media = MediaPublicService.get_media_by_public_id_and_type(public_id, media_type)
        if media:
            serializer = self.get_serializer(media)
            return APIResponse.success(
                message=MEDIA_SUCCESS["media_retrieved"],
                data=serializer.data
            )

        return APIResponse.error(
            message=MEDIA_ERRORS["media_not_found"],
            status_code=status.HTTP_404_NOT_FOUND
        )

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        media_type = request.query_params.get('type', 'image')
        is_active = request.query_params.get('is_active', 'true').lower() == 'true'
        
        media_list = MediaPublicService.get_all_media_by_type(media_type, is_active)
        
        if media_list:
            page = self.paginate_queryset(media_list)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(media_list, many=True)
            return APIResponse.success(
                message=MEDIA_SUCCESS["media_list_success"],
                data=serializer.data
            )
        else:
            return APIResponse.success(
                message=MEDIA_SUCCESS["media_list_success"],
                data={'results': [], 'count': 0, 'next': None, 'previous': None}
            )