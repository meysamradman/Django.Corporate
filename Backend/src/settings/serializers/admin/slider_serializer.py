from rest_framework import serializers
from src.media.models import ImageMedia, VideoMedia
from src.media.serializers.media_serializer import ImageMediaSerializer, VideoMediaSerializer
from src.settings.models import Slider

class SliderSerializer(serializers.ModelSerializer):
    image_id = serializers.PrimaryKeyRelatedField(
        queryset=ImageMedia.objects.all(), 
        source='image', 
        required=False, 
        allow_null=True,
        write_only=True
    )
    video_id = serializers.PrimaryKeyRelatedField(
        queryset=VideoMedia.objects.all(), 
        source='video', 
        required=False, 
        allow_null=True,
        write_only=True
    )
    video_cover_id = serializers.PrimaryKeyRelatedField(
        queryset=ImageMedia.objects.all(),
        source='video_cover',
        required=False,
        allow_null=True,
        write_only=True
    )
    
    image = ImageMediaSerializer(read_only=True)
    video = VideoMediaSerializer(read_only=True)
    video_cover = ImageMediaSerializer(read_only=True)

    class Meta:
        model = Slider
        fields = [
            'id', 'title', 'description',
            'image', 'image_id',
            'video', 'video_id',
            'video_cover', 'video_cover_id',
            'link', 'order', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
