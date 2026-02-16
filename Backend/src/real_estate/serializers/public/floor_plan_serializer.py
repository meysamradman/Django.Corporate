from rest_framework import serializers

from src.media.serializers.media_serializer import ImageMediaSerializer
from src.real_estate.models.floor_plan import RealEstateFloorPlan


class FloorPlanPublicListSerializer(serializers.ModelSerializer):
    main_image = serializers.SerializerMethodField()

    class Meta:
        model = RealEstateFloorPlan
        fields = [
            'id',
            'title',
            'description',
            'floor_size',
            'size_unit',
            'bedrooms',
            'bathrooms',
            'price',
            'currency',
            'floor_number',
            'unit_type',
            'is_available',
            'display_order',
            'main_image',
        ]
        read_only_fields = fields

    @staticmethod
    def _get_images_cached(obj):
        prefetched = getattr(obj, '_prefetched_objects_cache', {})
        if 'images' in prefetched:
            return prefetched['images']
        return list(obj.images.all())

    def get_main_image(self, obj):
        images = self._get_images_cached(obj)
        main_img = next((image for image in images if getattr(image, 'is_main', False)), None)
        if main_img and getattr(main_img, 'image', None):
            return ImageMediaSerializer(main_img.image).data
        return None
