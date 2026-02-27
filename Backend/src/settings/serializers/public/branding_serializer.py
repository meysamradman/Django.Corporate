from rest_framework import serializers

from src.panel.models import PanelSettings
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

        panel_settings = PanelSettings.objects.select_related('logo').first()
        if panel_settings and panel_settings.logo and getattr(panel_settings.logo, 'file', None):
            return panel_settings.logo.file.url

        return None

class PublicSliderSerializer(serializers.ModelSerializer):
    media_type = serializers.SerializerMethodField()
    media_url = serializers.SerializerMethodField()
    media_poster_url = serializers.SerializerMethodField()

    class Meta:
        model = Slider
        fields = [
            'id',
            'public_id',
            'title',
            'description',
            'link',
            'order',
            'media_type',
            'media_url',
            'media_poster_url',
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

    def get_media_poster_url(self, obj):
        if not obj.video_id:
            return None
        if obj.video_cover and getattr(obj.video_cover, 'file', None):
            return obj.video_cover.file.url
        if obj.video and getattr(obj.video.cover_image, 'file', None):
            return obj.video.cover_image.file.url
        return None
