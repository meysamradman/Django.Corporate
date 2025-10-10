from src.media.models.media import Media

class MediaAdminService:

    @staticmethod
    def get_media_id(media_id):
        try:
            return Media.objects.get(id=media_id)
        except Media.DoesNotExist:
            raise Exception("Media not found")

    @staticmethod
    def update_media_id(media_id, data):
        try:
            media = Media.objects.get(id=media_id)
            
            # Handle cover_image properly
            # If cover_image is an ID, we need to get the actual media object
            if 'cover_image' in data:
                cover_image_value = data['cover_image']
                # If it's an integer ID, try to get the media object
                if isinstance(cover_image_value, int):
                    try:
                        cover_media = Media.objects.get(id=cover_image_value)
                        media.cover_image = cover_media
                    except Media.DoesNotExist:
                        # If cover image not found, set to None
                        media.cover_image = None
                # If it's already a media object, use it directly
                elif isinstance(cover_image_value, Media):
                    media.cover_image = cover_image_value
                # If it's None or empty string, set to None
                elif cover_image_value is None or cover_image_value == '':
                    media.cover_image = None
                # If it's a file, let the model handle it
                
            # Update other fields
            for key, value in data.items():
                # Skip cover_image as we've already handled it
                if key != 'cover_image' and hasattr(media, key):
                    setattr(media, key, value)
                    
            media.save()
            return media
        except Media.DoesNotExist:
            raise Exception("Media not found")

    @staticmethod
    def delete_media_id(media_id):
        try:
            media = Media.objects.get(id=media_id)
            media.delete()
            return True
        except Media.DoesNotExist:
            raise Exception("Media not found")


class MediaPublicService:

    @staticmethod
    def get_media_slug(slug):
        return Media.objects.filter(slug=slug, is_active=True).first()

    @staticmethod
    def get_media_by_public_id(public_id):
        return Media.objects.filter(public_id=public_id, is_active=True).first()