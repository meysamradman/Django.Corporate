from rest_framework import serializers
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia


class MediaCoverSerializer(serializers.ModelSerializer):
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
    file_url = serializers.SerializerMethodField()
    media_type = serializers.SerializerMethodField()
    
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
        if isinstance(obj, ImageMedia):
            return 'image'
        elif isinstance(obj, VideoMedia):
            return 'video'
        elif isinstance(obj, AudioMedia):
            return 'audio'
        elif isinstance(obj, DocumentMedia):
            return 'document'
        return 'file'


class ImageMediaSerializer(BaseMediaSerializer):
    class Meta(BaseMediaSerializer.Meta):
        model = ImageMedia
        fields = BaseMediaSerializer.Meta.fields


class VideoMediaSerializer(BaseMediaSerializer):
    cover_image = MediaCoverSerializer(read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    
    class Meta(BaseMediaSerializer.Meta):
        model = VideoMedia
        fields = BaseMediaSerializer.Meta.fields + ['cover_image', 'cover_image_url', 'duration']

    def get_cover_image_url(self, obj):
        if hasattr(obj, 'cover_image') and obj.cover_image:
            if hasattr(obj.cover_image, 'file') and obj.cover_image.file:
                return obj.cover_image.file.url
        return None


class AudioMediaSerializer(BaseMediaSerializer):
    cover_image = MediaCoverSerializer(read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    
    class Meta(BaseMediaSerializer.Meta):
        model = AudioMedia
        fields = BaseMediaSerializer.Meta.fields + ['cover_image', 'cover_image_url', 'duration']

    def get_cover_image_url(self, obj):
        if hasattr(obj, 'cover_image') and obj.cover_image:
            if hasattr(obj.cover_image, 'file') and obj.cover_image.file:
                return obj.cover_image.file.url
        return None


class DocumentMediaSerializer(BaseMediaSerializer):
    cover_image = MediaCoverSerializer(read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    
    class Meta(BaseMediaSerializer.Meta):
        model = DocumentMedia
        fields = BaseMediaSerializer.Meta.fields + ['cover_image', 'cover_image_url']

    def get_cover_image_url(self, obj):
        if hasattr(obj, 'cover_image') and obj.cover_image:
            if hasattr(obj.cover_image, 'file') and obj.cover_image.file:
                return obj.cover_image.file.url
        return None
    
    def get_media_type(self, obj):
        if obj.mime_type == 'application/pdf':
            return 'pdf'
        return 'document'


class MediaAdminSerializer(serializers.Serializer):
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
    media_type = serializers.SerializerMethodField()
    
    def get_media_type(self, obj):
        if isinstance(obj, ImageMedia):
            return 'image'
        elif isinstance(obj, VideoMedia):
            return 'video'
        elif isinstance(obj, AudioMedia):
            return 'audio'
        elif isinstance(obj, DocumentMedia):
            if hasattr(obj, 'mime_type') and obj.mime_type == 'application/pdf':
                return 'pdf'
            return 'document'
        return 'file'  # fallback
    
    def get_file_url(self, obj):
        if hasattr(obj, 'file') and obj.file:
            return obj.file.url
        return None

    def get_cover_image_url(self, obj):
        if hasattr(obj, 'cover_image') and obj.cover_image:
            if hasattr(obj.cover_image, 'file') and obj.cover_image.file:
                return obj.cover_image.file.url
        return None

    def to_representation(self, instance):
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
    public_id = serializers.UUIDField(read_only=True)
    title = serializers.CharField(required=False, allow_blank=True)
    file_url = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    cover_image = MediaCoverSerializer(read_only=True)
    alt_text = serializers.CharField(required=False, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)
    duration = serializers.IntegerField(required=False, allow_null=True)
    media_type = serializers.SerializerMethodField()
    
    def get_media_type(self, obj):
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
            if hasattr(obj.cover_image, 'file') and obj.cover_image.file:
                return obj.cover_image.file.url
        return None

    def to_representation(self, instance):
        if isinstance(instance, ImageMedia):
            return ImageMediaSerializer(instance, context=self.context).data
        elif isinstance(instance, VideoMedia):
            return VideoMediaSerializer(instance, context=self.context).data
        elif isinstance(instance, AudioMedia):
            return AudioMediaSerializer(instance, context=self.context).data
        elif isinstance(instance, DocumentMedia):
            return DocumentMediaSerializer(instance, context=self.context).data
        return super().to_representation(instance)