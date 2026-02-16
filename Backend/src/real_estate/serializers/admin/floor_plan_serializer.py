from rest_framework import serializers
from src.real_estate.models.floor_plan import RealEstateFloorPlan
from src.real_estate.models.floor_plan_media import FloorPlanImage
from src.real_estate.messages.messages import FLOOR_PLAN_ERRORS
from src.media.serializers.media_serializer import ImageMediaSerializer, MediaAdminSerializer

class FloorPlanImageSerializer(serializers.ModelSerializer):
    
    image = ImageMediaSerializer(read_only=True)
    
    class Meta:
        model = FloorPlanImage
        fields = ['id', 'image', 'is_main', 'order', 'title', 'created_at']

class FloorPlanAdminListSerializer(serializers.ModelSerializer):
    
    property_title = serializers.CharField(source='property_obj.title', read_only=True)
    images = FloorPlanImageSerializer(many=True, read_only=True)
    main_image = serializers.SerializerMethodField()
    image_count = serializers.SerializerMethodField()
    
    class Meta:
        model = RealEstateFloorPlan
        fields = [
            'id', 'title', 'slug', 'property_obj', 'property_title',
            'floor_size', 'size_unit', 'bedrooms', 'bathrooms',
            'price', 'currency', 'floor_number', 'unit_type',
            'is_available', 'display_order',
            'images', 'main_image', 'image_count',
            'created_at', 'updated_at'
        ]

    @staticmethod
    def _get_images_cached(obj):
        prefetched = getattr(obj, '_prefetched_objects_cache', {})
        if 'images' in prefetched:
            return prefetched['images']
        return list(obj.images.all())
    
    def get_main_image(self, obj):
        images = self._get_images_cached(obj)
        main_img = next((image for image in images if image.is_main), None)
        if main_img and main_img.image:
            return ImageMediaSerializer(main_img.image).data
        return None
    
    def get_image_count(self, obj):
        return len(self._get_images_cached(obj))

class FloorPlanAdminDetailSerializer(serializers.ModelSerializer):
    
    property_title = serializers.CharField(source='property_obj.title', read_only=True)
    property_slug = serializers.CharField(source='property_obj.slug', read_only=True)
    images = FloorPlanImageSerializer(many=True, read_only=True)
    size_display = serializers.ReadOnlyField()
    price_display = serializers.ReadOnlyField()
    
    class Meta:
        model = RealEstateFloorPlan
        fields = [
            'id', 'property_obj', 'property_title', 'property_slug',
            'title', 'slug', 'description',
            'floor_size', 'size_unit', 'size_display',
            'bedrooms', 'bathrooms',
            'price', 'currency', 'price_display',
            'floor_number', 'unit_type',
            'display_order', 'is_available',
            'images',
            'is_active', 'created_at', 'updated_at'
        ]

class FloorPlanAdminCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = RealEstateFloorPlan
        fields = [
            'property_obj', 'title', 'slug', 'description',
            'floor_size', 'size_unit',
            'bedrooms', 'bathrooms',
            'price', 'currency',
            'floor_number', 'unit_type',
            'display_order', 'is_available',
            'is_active'
        ]
        extra_kwargs = {
            'slug': {'error_messages': {'unique': FLOOR_PLAN_ERRORS["slug_exists"]}},
        }
    
    def validate_slug(self, value):
        
        if RealEstateFloorPlan.objects.filter(slug=value).exists():
            raise serializers.ValidationError(FLOOR_PLAN_ERRORS["slug_exists"])
        return value

class FloorPlanAdminUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = RealEstateFloorPlan
        fields = [
            'title', 'slug', 'description',
            'floor_size', 'size_unit',
            'bedrooms', 'bathrooms',
            'price', 'currency',
            'floor_number', 'unit_type',
            'display_order', 'is_available',
            'is_active'
        ]
        extra_kwargs = {
            'slug': {'error_messages': {'unique': FLOOR_PLAN_ERRORS["slug_exists"]}},
        }
    
    def validate_slug(self, value):
        
        instance = self.instance
        if instance and RealEstateFloorPlan.objects.filter(slug=value).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError(FLOOR_PLAN_ERRORS["slug_exists"])
        return value
