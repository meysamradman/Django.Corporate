import logging
from django.core.exceptions import ValidationError
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
from src.media.messages.messages import MEDIA_ERRORS
from src.core.cache import CacheService
from src.media.utils.cache_admin import MediaAdminCacheKeys, MediaAdminCacheManager
from src.media.utils.cache_public import MediaPublicCacheKeys
from src.media.utils.cache_shared import hash_payload
from src.media.utils.cache_ttl import MediaCacheTTL

logger = logging.getLogger(__name__)

class MediaAdminService:

    @staticmethod
    def _model_map():
        return {
            'image': ImageMedia,
            'video': VideoMedia,
            'audio': AudioMedia,
            'pdf': DocumentMedia,
        }

    @staticmethod
    def _serialize_media(media):
        from src.media.serializers.media_serializer import MediaAdminSerializer
        return MediaAdminSerializer(media).data

    @staticmethod
    def _serialize_media_list(media_list):
        from src.media.serializers.media_serializer import MediaAdminSerializer
        return MediaAdminSerializer(media_list, many=True).data

    @staticmethod
    def _admin_list_key(search=None, file_type=None, is_active=None, date_from=None, date_to=None):
        payload = {
            'search': search or '',
            'file_type': file_type or 'all',
            'is_active': '' if is_active is None else str(is_active).lower(),
            'date_from': date_from or '',
            'date_to': date_to or '',
        }
        return MediaAdminCacheKeys.media_list(hash_payload(payload))

    @staticmethod
    def get_media_by_id_and_type(media_id, media_type):
        model = MediaAdminService._model_map().get(media_type)
        if not model:
            raise ValidationError(MEDIA_ERRORS["media_type_unsupported"])
            
        try:
            if model in [VideoMedia, AudioMedia, DocumentMedia]:
                return model.objects.select_related('cover_image').get(id=media_id)
            else:
                return model.objects.get(id=media_id)
        except model.DoesNotExist:
            raise model.DoesNotExist(MEDIA_ERRORS["media_not_found"])

    @staticmethod
    def update_media_by_id_and_type(media_id, media_type, data):
        print(f"\n{'='*80}")
        print(f"📁 [MediaUpdate] Starting update - ID: {media_id}, Type: {media_type}")
        print(f"📁 [MediaUpdate] Data received: {data}")
        print(f"{'='*80}\n")
        
        model = MediaAdminService._model_map().get(media_type)
        if not model:
            print(f"❌ [MediaUpdate] ERROR: Unsupported media type: {media_type}")
            raise ValidationError(MEDIA_ERRORS["media_type_unsupported"])
            
        try:
            if model in [VideoMedia, AudioMedia, DocumentMedia]:
                media = model.objects.select_related('cover_image').get(id=media_id)
                print(f"✅ [MediaUpdate] Found {media_type} media with ID {media_id}, has cover: {bool(media.cover_image)}")
            else:
                media = model.objects.get(id=media_id)
                print(f"✅ [MediaUpdate] Found {media_type} media with ID {media_id}")
            
            if (media_type == 'video' or media_type == 'audio' or media_type == 'pdf') and 'cover_image' in data:
                cover_image_value = data['cover_image']
                print(f"🖼️  [MediaUpdate] Processing cover_image update: {cover_image_value} (type: {type(cover_image_value).__name__})")
                
                if isinstance(cover_image_value, int):
                    try:
                        cover_media = ImageMedia.objects.get(id=cover_image_value)
                        media.cover_image = cover_media
                        print(f"✅ [MediaUpdate] Set cover_image to ImageMedia ID {cover_image_value}")
                    except ImageMedia.DoesNotExist:
                        media.cover_image = None
                        print(f"⚠️  [MediaUpdate] Cover image ID {cover_image_value} not found, set to None")
                elif isinstance(cover_image_value, ImageMedia):
                    media.cover_image = cover_image_value
                    print(f"✅ [MediaUpdate] Set cover_image to ImageMedia object")
                elif cover_image_value is None or cover_image_value == '':
                    media.cover_image = None
                    print(f"🗑️  [MediaUpdate] Removed cover_image")
                
                data.pop('cover_image', None)
            
            updated_fields = []
            print(f"\n📝 [MediaUpdate] Updating fields:")
            for key, value in data.items():
                if hasattr(media, key):
                    old_value = getattr(media, key)
                    setattr(media, key, value)
                    updated_fields.append(f"{key}: '{old_value}' -> '{value}'")
                    print(f"   ✏️  {key}: '{old_value}' -> '{value}'")
                else:
                    print(f"   ⚠️  Field '{key}' does not exist on {media_type} model, skipping")
            
            print(f"\n💾 [MediaUpdate] Saving media ID {media_id} with {len(updated_fields)} field(s) updated")
            media.save()
            MediaAdminCacheManager.invalidate_media_detail(media_id)
            MediaAdminCacheManager.invalidate_type_scope(media_type, str(media.public_id))
            print(f"✅ [MediaUpdate] Successfully saved media ID {media_id}\n")
            return media
        except model.DoesNotExist:
            print(f"❌ [MediaUpdate] ERROR: Media not found - ID: {media_id}, Type: {media_type}")
            raise model.DoesNotExist(MEDIA_ERRORS["media_not_found"])
        except Exception as e:
            print(f"❌ [MediaUpdate] ERROR: Unexpected error updating media ID {media_id}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    @staticmethod
    def delete_media_by_id_and_type(media_id, media_type):
        model = MediaAdminService._model_map().get(media_type)
        if not model:
            raise ValidationError(MEDIA_ERRORS["media_type_unsupported"])
            
        try:
            media = model.objects.get(id=media_id)
            public_id = str(media.public_id)
            media.delete()
            MediaAdminCacheManager.invalidate_media_detail(media_id)
            MediaAdminCacheManager.invalidate_type_scope(media_type, public_id)
            return True
        except model.DoesNotExist:
            raise model.DoesNotExist(MEDIA_ERRORS["media_not_found"])

    @staticmethod
    def create_media(media_type, data):
        model = MediaAdminService._model_map().get(media_type)
        if not model:
            raise ValidationError(MEDIA_ERRORS["media_type_unsupported"])
            
        cover_image = None
        if (media_type == 'video' or media_type == 'audio' or media_type == 'pdf') and 'cover_image' in data:
            cover_image_value = data.pop('cover_image', None)
            if isinstance(cover_image_value, int):
                try:
                    cover_image = ImageMedia.objects.get(id=cover_image_value)
                except ImageMedia.DoesNotExist:
                    pass
            elif isinstance(cover_image_value, ImageMedia):
                cover_image = cover_image_value
        
        media = model(**data)
        
        if (media_type == 'video' or media_type == 'audio' or media_type == 'pdf') and cover_image:
            media.cover_image = cover_image
            
        media.full_clean()
        media.save()
        MediaAdminCacheManager.invalidate_type_scope(media_type)
        return media
    
    @staticmethod
    def get_filtered_media_list(search=None, file_type=None, is_active=None, date_from=None, date_to=None):
        from datetime import datetime
        
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
        
        if search:
            image_qs = image_qs.filter(title__icontains=search)
            video_qs = video_qs.filter(title__icontains=search)
            audio_qs = audio_qs.filter(title__icontains=search)
            document_qs = document_qs.filter(title__icontains=search)
        
        if is_active is not None:
            is_active_bool = str(is_active).lower() == 'true'
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
            
        return all_media

    @staticmethod
    def get_filtered_media_list_data(search=None, file_type=None, is_active=None, date_from=None, date_to=None):
        cache_key = MediaAdminService._admin_list_key(
            search=search,
            file_type=file_type,
            is_active=is_active,
            date_from=date_from,
            date_to=date_to,
        )
        cached = CacheService.get(cache_key)
        if cached is not None:
            return cached

        all_media = MediaAdminService.get_filtered_media_list(
            search=search,
            file_type=file_type,
            is_active=is_active,
            date_from=date_from,
            date_to=date_to,
        )
        all_media.sort(key=lambda x: x.created_at, reverse=True)

        data = list(MediaAdminService._serialize_media_list(all_media))
        CacheService.set(cache_key, data, timeout=MediaCacheTTL.ADMIN_LIST)
        return data

    @staticmethod
    def get_media_detail_data(media_id):
        cache_key = MediaAdminCacheKeys.media_detail(media_id)
        cached = CacheService.get(cache_key)
        if cached is not None:
            return cached

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

        if not media:
            return None

        data = dict(MediaAdminService._serialize_media(media))
        CacheService.set(cache_key, data, timeout=MediaCacheTTL.ADMIN_DETAIL)
        return data

    @staticmethod
    def bulk_delete_media(media_data):
        from django.db import transaction
        from django.db.models.deletion import ProtectedError
        
        if not media_data or not isinstance(media_data, list):
             raise ValidationError(MEDIA_ERRORS["media_data_invalid"])
             
        MAX_BULK_DELETE = 100
        if len(media_data) > MAX_BULK_DELETE:
             raise ValidationError(MEDIA_ERRORS["bulk_delete_limit_exceeded"].format(max_items=MAX_BULK_DELETE))
        
        deleted_count = 0
        failed_items = []
        
        invalidate_scope = False

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
                    invalidate_scope = True
                except ProtectedError:
                    failed_items.append(item)
                    continue
                except Exception:
                    failed_items.append(item)
                    continue

        if invalidate_scope:
            MediaAdminCacheManager.invalidate_all()
                    
        return deleted_count, failed_items

class MediaPublicService:

    @staticmethod
    def _model_map():
        return {
            'image': ImageMedia,
            'video': VideoMedia,
            'audio': AudioMedia,
            'pdf': DocumentMedia,
        }

    @staticmethod
    def _serialize_media(media):
        from src.media.serializers.media_serializer import MediaPublicSerializer
        return MediaPublicSerializer(media).data

    @staticmethod
    def _serialize_media_list(media_list):
        from src.media.serializers.media_serializer import MediaPublicSerializer
        return MediaPublicSerializer(media_list, many=True).data

    @staticmethod
    def _public_list_key(search=None, file_type=None, date_from=None, date_to=None):
        payload = {
            'search': search or '',
            'file_type': file_type or 'all',
            'date_from': date_from or '',
            'date_to': date_to or '',
        }
        return MediaPublicCacheKeys.media_list(hash_payload(payload))

    @staticmethod
    def get_media_by_public_id_and_type(public_id, media_type):
        model = MediaPublicService._model_map().get(media_type)
        if not model:
            return None
            
        return model.objects.filter(public_id=public_id, is_active=True).first()

    @staticmethod
    def get_media_by_public_id_and_type_data(public_id, media_type):
        cache_key = MediaPublicCacheKeys.media_detail(public_id, media_type)
        cached = CacheService.get(cache_key)
        if cached is not None:
            return cached

        media = MediaPublicService.get_media_by_public_id_and_type(public_id, media_type)
        if not media:
            return None

        data = dict(MediaPublicService._serialize_media(media))
        CacheService.set(cache_key, data, timeout=MediaCacheTTL.PUBLIC_DETAIL)
        return data

    @staticmethod
    def get_filtered_media_list_data(search=None, file_type=None, date_from=None, date_to=None):
        from datetime import datetime

        cache_key = MediaPublicService._public_list_key(
            search=search,
            file_type=file_type,
            date_from=date_from,
            date_to=date_to,
        )
        cached = CacheService.get(cache_key)
        if cached is not None:
            return cached

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

        if search:
            image_qs = image_qs.filter(title__icontains=search)
            video_qs = video_qs.filter(title__icontains=search)
            audio_qs = audio_qs.filter(title__icontains=search)
            document_qs = document_qs.filter(title__icontains=search)

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
        data = list(MediaPublicService._serialize_media_list(all_media))
        CacheService.set(cache_key, data, timeout=MediaCacheTTL.PUBLIC_LIST)
        return data

    @staticmethod
    def get_all_media_by_type(media_type, is_active=True):
        model = MediaPublicService._model_map().get(media_type)
        if not model:
            return []
            
        queryset = model.objects.all()
        if is_active:
            queryset = queryset.filter(is_active=True)
            
        return queryset

    @staticmethod
    def get_all_media_by_type_data(media_type, is_active=True):
        cache_key = MediaPublicCacheKeys.media_by_type(media_type, is_active)
        cached = CacheService.get(cache_key)
        if cached is not None:
            return cached

        media_list = MediaPublicService.get_all_media_by_type(media_type, is_active)
        data = list(MediaPublicService._serialize_media_list(media_list))
        CacheService.set(cache_key, data, timeout=MediaCacheTTL.PUBLIC_BY_TYPE)
        return data