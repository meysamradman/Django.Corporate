from django.core.exceptions import ValidationError
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
from src.media.messages.messages import MEDIA_ERRORS

class MediaAdminService:

    @staticmethod
    def get_media_by_id_and_type(media_id, media_type):
        model_map = {
            'image': ImageMedia,
            'video': VideoMedia,
            'audio': AudioMedia,
            'pdf': DocumentMedia,
        }
        
        model = model_map.get(media_type)
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
        model_map = {
            'image': ImageMedia,
            'video': VideoMedia,
            'audio': AudioMedia,
            'pdf': DocumentMedia,
        }
        
        model = model_map.get(media_type)
        if not model:
            raise ValidationError(MEDIA_ERRORS["media_type_unsupported"])
            
        try:
            if model in [VideoMedia, AudioMedia, DocumentMedia]:
                media = model.objects.select_related('cover_image').get(id=media_id)
            else:
                media = model.objects.get(id=media_id)
            
            if (media_type == 'video' or media_type == 'audio' or media_type == 'pdf') and 'cover_image' in data:
                cover_image_value = data['cover_image']
                if isinstance(cover_image_value, int):
                    try:
                        cover_media = ImageMedia.objects.get(id=cover_image_value)
                        media.cover_image = cover_media
                    except ImageMedia.DoesNotExist:
                        media.cover_image = None
                elif isinstance(cover_image_value, ImageMedia):
                    media.cover_image = cover_image_value
                elif cover_image_value is None or cover_image_value == '':
                    media.cover_image = None
                
                data.pop('cover_image', None)
            
            for key, value in data.items():
                if hasattr(media, key):
                    setattr(media, key, value)
                    
            media.save()
            return media
        except model.DoesNotExist:
            raise model.DoesNotExist(MEDIA_ERRORS["media_not_found"])

    @staticmethod
    def delete_media_by_id_and_type(media_id, media_type):
        model_map = {
            'image': ImageMedia,
            'video': VideoMedia,
            'audio': AudioMedia,
            'pdf': DocumentMedia,
        }
        
        model = model_map.get(media_type)
        if not model:
            raise ValidationError(MEDIA_ERRORS["media_type_unsupported"])
            
        try:
            media = model.objects.get(id=media_id)
            media.delete()
            return True
        except model.DoesNotExist:
            raise model.DoesNotExist(MEDIA_ERRORS["media_not_found"])

    @staticmethod
    def create_media(media_type, data):
        model_map = {
            'image': ImageMedia,
            'video': VideoMedia,
            'audio': AudioMedia,
            'pdf': DocumentMedia,
        }
        
        model = model_map.get(media_type)
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
                    
        return deleted_count, failed_items

class MediaPublicService:

    @staticmethod
    def get_media_by_public_id_and_type(public_id, media_type):
        model_map = {
            'image': ImageMedia,
            'video': VideoMedia,
            'audio': AudioMedia,
            'pdf': DocumentMedia,
        }
        
        model = model_map.get(media_type)
        if not model:
            return None
            
        return model.objects.filter(public_id=public_id, is_active=True).first()

    @staticmethod
    def get_all_media_by_type(media_type, is_active=True):
        model_map = {
            'image': ImageMedia,
            'video': VideoMedia,
            'audio': AudioMedia,
            'pdf': DocumentMedia,
        }
        
        model = model_map.get(media_type)
        if not model:
            return []
            
        queryset = model.objects.all()
        if is_active:
            queryset = queryset.filter(is_active=True)
            
        return queryset