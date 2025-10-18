from rest_framework import serializers
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia


class MediaCoverSerializer(serializers.ModelSerializer):
    """Serializer for cover image media objects"""
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ImageMedia
        fields = [
            'id', 'public_id', 'title', 'file_url', 
            'alt_text', 'is_active', 'created_at'
        ]
    
    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class BaseMediaSerializer(serializers.ModelSerializer):
    """Base serializer for all media types"""
    file_url = serializers.SerializerMethodField()
    media_type = serializers.SerializerMethodField()  # Add media_type field
    
    class Meta:
        fields = [
            'id', 'public_id', 'title', 'file_url', 
            'file_size', 'mime_type', 'alt_text', 'is_active', 'created_at', 'updated_at', 'media_type'
        ]
        read_only_fields = ['file_size', 'mime_type', 'created_at', 'updated_at', 'media_type']

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None
    
    def get_media_type(self, obj):
        """Get media type based on instance class"""
        if isinstance(obj, ImageMedia):
            return 'image'
        elif isinstance(obj, VideoMedia):
            return 'video'
        elif isinstance(obj, AudioMedia):
            return 'audio'
        elif isinstance(obj, DocumentMedia):
            return 'document'
        return 'file'  # fallback


class ImageMediaSerializer(BaseMediaSerializer):
    """Serializer for image media"""
    media_type = serializers.SerializerMethodField()  # Add media_type field
    
    class Meta(BaseMediaSerializer.Meta):
        model = ImageMedia
        fields = BaseMediaSerializer.Meta.fields + ['media_type']
    
    def get_media_type(self, obj):
        return 'image'


class VideoMediaSerializer(BaseMediaSerializer):
    """Serializer for video media"""
    cover_image = MediaCoverSerializer(read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    media_type = serializers.SerializerMethodField()  # Add media_type field
    
    class Meta(BaseMediaSerializer.Meta):
        model = VideoMedia
        fields = BaseMediaSerializer.Meta.fields + ['cover_image', 'cover_image_url', 'duration', 'media_type']

    def get_cover_image_url(self, obj):
        if obj.cover_image:
            return obj.cover_image.file.url
        return None
    
    def get_media_type(self, obj):
        return 'video'


class AudioMediaSerializer(BaseMediaSerializer):
    """Serializer for audio media"""
    cover_image = MediaCoverSerializer(read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    media_type = serializers.SerializerMethodField()  # Add media_type field
    
    class Meta(BaseMediaSerializer.Meta):
        model = AudioMedia
        fields = BaseMediaSerializer.Meta.fields + ['cover_image', 'cover_image_url', 'duration', 'media_type']

    def get_cover_image_url(self, obj):
        if obj.cover_image:
            return obj.cover_image.file.url
        return None
    
    def get_media_type(self, obj):
        return 'audio'


class DocumentMediaSerializer(BaseMediaSerializer):
    """Serializer for document media"""
    cover_image = MediaCoverSerializer(read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    media_type = serializers.SerializerMethodField()  # Add media_type field
    
    class Meta(BaseMediaSerializer.Meta):
        model = DocumentMedia
        fields = BaseMediaSerializer.Meta.fields + ['cover_image', 'cover_image_url', 'media_type']

    def get_cover_image_url(self, obj):
        if obj.cover_image:
            return obj.cover_image.file.url
        return None
    
    def get_media_type(self, obj):
        return 'document'


class MediaAdminSerializer(serializers.Serializer):
    """Admin serializer that can handle all media types"""
    id = serializers.IntegerField(read_only=True)
    public_id = serializers.UUIDField(read_only=True)
    title = serializers.CharField(required=False, allow_blank=True)
    file_url = serializers.SerializerMethodField()
    file_size = serializers.IntegerField(read_only=True)
    mime_type = serializers.CharField(read_only=True)
    alt_text = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(default=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    cover_image = MediaCoverSerializer(read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    duration = serializers.IntegerField(required=False, allow_null=True)
    media_type = serializers.SerializerMethodField()  # Add media_type field
    
    def get_media_type(self, obj):
        """Get media type based on instance class"""
        if isinstance(obj, ImageMedia):
            return 'image'
        elif isinstance(obj, VideoMedia):
            return 'video'
        elif isinstance(obj, AudioMedia):
            return 'audio'
        elif isinstance(obj, DocumentMedia):
            return 'document'
        return 'file'  # fallback
    
    def get_file_url(self, obj):
        if hasattr(obj, 'file') and obj.file:
            return obj.file.url
        return None

    def get_cover_image_url(self, obj):
        if hasattr(obj, 'cover_image') and obj.cover_image:
            return obj.cover_image.file.url
        return None

    def to_representation(self, instance):
        """Convert instance to appropriate serializer based on media type"""
        # Determine media type based on instance class
        if isinstance(instance, ImageMedia):
            return ImageMediaSerializer(instance, context=self.context).data
        elif isinstance(instance, VideoMedia):
            return VideoMediaSerializer(instance, context=self.context).data
        elif isinstance(instance, AudioMedia):
            return AudioMediaSerializer(instance, context=self.context).data
        elif isinstance(instance, DocumentMedia):
            return DocumentMediaSerializer(instance, context=self.context).data
        return super().to_representation(instance)


class MediaPublicSerializer(serializers.Serializer):
    """Public serializer that can handle all media types"""
    public_id = serializers.UUIDField(read_only=True)
    title = serializers.CharField(required=False, allow_blank=True)
    file_url = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    cover_image = MediaCoverSerializer(read_only=True)
    alt_text = serializers.CharField(required=False, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)
    duration = serializers.IntegerField(required=False, allow_null=True)
    media_type = serializers.SerializerMethodField()  # Add media_type field
    
    def get_media_type(self, obj):
        """Get media type based on instance class"""
        if isinstance(obj, ImageMedia):
            return 'image'
        elif isinstance(obj, VideoMedia):
            return 'video'
        elif isinstance(obj, AudioMedia):
            return 'audio'
        elif isinstance(obj, DocumentMedia):
            return 'document'
        return 'file'  # fallback
    
    def get_file_url(self, obj):
        if hasattr(obj, 'file') and obj.file:
            return obj.file.url
        return None

    def get_cover_image_url(self, obj):
        if hasattr(obj, 'cover_image') and obj.cover_image:
            return obj.cover_image.file.url
        return None

    def to_representation(self, instance):
        """Convert instance to appropriate serializer based on media type"""
        # Determine media type based on instance class
        if isinstance(instance, ImageMedia):
            return ImageMediaSerializer(instance, context=self.context).data
        elif isinstance(instance, VideoMedia):
            return VideoMediaSerializer(instance, context=self.context).data
        elif isinstance(instance, AudioMedia):
            return AudioMediaSerializer(instance, context=self.context).data
        elif isinstance(instance, DocumentMedia):
            return DocumentMediaSerializer(instance, context=self.context).data
        return super().to_representation(instance)