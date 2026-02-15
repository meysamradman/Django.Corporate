from rest_framework import serializers

from src.settings.models import GeneralSettings, Slider


class PublicLogoSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = GeneralSettings
        fields = [
            'site_name',
            'logo_url',
        ]

    def get_logo_url(self, obj):
        if obj.logo_image and getattr(obj.logo_image, 'file', None):
            return obj.logo_image.file.url
        return None


class PublicSliderSerializer(serializers.ModelSerializer):
    media_type = serializers.SerializerMethodField()
    media_url = serializers.SerializerMethodField()

    class Meta:
        model = Slider
        fields = [
            'id',
            'title',
            'description',
            'link',
            'order',
            'media_type',
            'media_url',
        ]

    def get_media_type(self, obj):
        if obj.video_id:
            return 'video'
        return 'image'

    def get_media_url(self, obj):
        if obj.video and getattr(obj.video, 'file', None):
            return obj.video.file.url
        if obj.image and getattr(obj.image, 'file', None):
            return obj.image.file.url
        return None
