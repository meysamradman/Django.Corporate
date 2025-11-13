from django.core.exceptions import ValidationError
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia


class MediaAdminService:

    @staticmethod
    def get_media_by_id_and_type(media_id, media_type):
        """Get media by ID and type"""
        model_map = {
            'image': ImageMedia,
            'video': VideoMedia,
            'audio': AudioMedia,
            'pdf': DocumentMedia,
        }
        
        model = model_map.get(media_type)
        if not model:
            raise ValidationError(f"Unsupported media type: {media_type}")
            
        try:
            return model.objects.get(id=media_id)
        except model.DoesNotExist:
            raise model.DoesNotExist("Media not found")

    @staticmethod
    def update_media_by_id_and_type(media_id, media_type, data):
        """Update media by ID and type"""
        model_map = {
            'image': ImageMedia,
            'video': VideoMedia,
            'audio': AudioMedia,
            'pdf': DocumentMedia,
        }
        
        model = model_map.get(media_type)
        if not model:
            raise ValidationError(f"Unsupported media type: {media_type}")
            
        try:
            media = model.objects.get(id=media_id)
            
            # Handle cover_image for videos, audio, and documents (PDF)
            if (media_type == 'video' or media_type == 'audio' or media_type == 'pdf') and 'cover_image' in data:
                cover_image_value = data['cover_image']
                # If it's an integer ID, try to get the media object
                if isinstance(cover_image_value, int):
                    try:
                        cover_media = ImageMedia.objects.get(id=cover_image_value)
                        media.cover_image = cover_media
                    except ImageMedia.DoesNotExist:
                        # If cover image not found, set to None
                        media.cover_image = None
                # If it's already a media object, use it directly
                elif isinstance(cover_image_value, ImageMedia):
                    media.cover_image = cover_image_value
                # If it's None or empty string, set to None
                elif cover_image_value is None or cover_image_value == '':
                    media.cover_image = None
                
                # Remove cover_image from data to avoid setting it again
                data.pop('cover_image', None)
            
            # Update other fields
            for key, value in data.items():
                if hasattr(media, key):
                    setattr(media, key, value)
                    
            media.save()
            return media
        except model.DoesNotExist:
            raise model.DoesNotExist("Media not found")

    @staticmethod
    def delete_media_by_id_and_type(media_id, media_type):
        """Delete media by ID and type"""
        model_map = {
            'image': ImageMedia,
            'video': VideoMedia,
            'audio': AudioMedia,
            'pdf': DocumentMedia,
        }
        
        model = model_map.get(media_type)
        if not model:
            raise ValidationError(f"Unsupported media type: {media_type}")
            
        try:
            media = model.objects.get(id=media_id)
            media.delete()
            return True
        except model.DoesNotExist:
            raise model.DoesNotExist("Media not found")

    @staticmethod
    def create_media(media_type, data):
        """Create new media based on type"""
        model_map = {
            'image': ImageMedia,
            'video': VideoMedia,
            'audio': AudioMedia,
            'pdf': DocumentMedia,
        }
        
        model = model_map.get(media_type)
        if not model:
            raise ValidationError(f"Unsupported media type: {media_type}")
            
        # Handle cover_image for videos, audio, and pdf
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
        
        # Create the media object
        media = model(**data)
        
        # Set cover image for videos, audio, and pdf
        if (media_type == 'video' or media_type == 'audio' or media_type == 'pdf') and cover_image:
            media.cover_image = cover_image
            
        media.full_clean()
        media.save()
        return media


class MediaPublicService:

    @staticmethod
    def get_media_by_public_id_and_type(public_id, media_type):
        """Get media by public ID and type"""
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
        """Get all media of a specific type"""
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