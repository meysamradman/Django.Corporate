from rest_framework import serializers
from src.media.models.media import Media


class MediaCoverSerializer(serializers.ModelSerializer):
    """Serializer for cover image media objects"""
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Media
        fields = [
            'id', 'public_id', 'title', 'media_type', 'file_url', 
            'alt_text', 'is_active', 'created_at'
        ]
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class MediaAdminSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    cover_image = MediaCoverSerializer(read_only=True)
    # Make file and media_type optional for updates
    file = serializers.FileField(required=False)
    media_type = serializers.CharField(required=False)

    class Meta:
        model = Media
        fields = [
            'id', 'public_id', 'title', 'media_type', 'file', 'file_url', 
            'file_size', 'mime_type', 'cover_image', 'cover_image_url', 
            'alt_text', 'is_active', 'created_at', 'updated_at'
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def get_cover_image_url(self, obj):
        request = self.context.get('request')
        if obj.cover_image and request:
            return request.build_absolute_uri(obj.cover_image.file.url)
        return None


class MediaPublicSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    cover_image = MediaCoverSerializer(read_only=True)

    class Meta:
        model = Media
        fields = [
            'public_id', 'title', 'media_type', 'file_url', 'cover_image_url',
            'cover_image', 'alt_text', 'created_at',
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def get_cover_image_url(self, obj):
        request = self.context.get('request')
        if obj.cover_image and request:
            return request.build_absolute_uri(obj.cover_image.file.url)
        return None