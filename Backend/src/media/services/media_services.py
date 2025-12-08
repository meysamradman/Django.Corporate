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