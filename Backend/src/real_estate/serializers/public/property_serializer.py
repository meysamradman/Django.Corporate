from rest_framework import serializers

from src.real_estate.models.feature import PropertyFeature
from src.real_estate.models.label import PropertyLabel
from src.real_estate.models.property import Property
from src.real_estate.models.state import PropertyState
from src.real_estate.models.tag import PropertyTag
from src.real_estate.models.type import PropertyType


class PropertyTypeNestedPublicSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='title', read_only=True)

    class Meta:
        model = PropertyType
        fields = ['id', 'public_id', 'name', 'slug']
        read_only_fields = fields


class PropertyStateNestedPublicSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='title', read_only=True)

    class Meta:
        model = PropertyState
        fields = ['id', 'public_id', 'name', 'slug', 'usage_type']
        read_only_fields = fields


class PropertyLabelNestedPublicSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='title', read_only=True)

    class Meta:
        model = PropertyLabel
        fields = ['id', 'public_id', 'name', 'slug']
        read_only_fields = fields


class PropertyTagNestedPublicSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='title', read_only=True)

    class Meta:
        model = PropertyTag
        fields = ['id', 'public_id', 'name', 'slug']
        read_only_fields = fields


class PropertyFeatureNestedPublicSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='title', read_only=True)
    slug = serializers.SerializerMethodField()

    class Meta:
        model = PropertyFeature
        fields = ['id', 'public_id', 'name', 'slug', 'group']
        read_only_fields = fields

    def get_slug(self, obj):
        return str(getattr(obj, 'public_id', ''))


class PropertyPublicListSerializer(serializers.ModelSerializer):
    property_type = PropertyTypeNestedPublicSerializer(read_only=True)
    state = PropertyStateNestedPublicSerializer(read_only=True)
    labels = PropertyLabelNestedPublicSerializer(many=True, read_only=True)
    tags = PropertyTagNestedPublicSerializer(many=True, read_only=True)
    features = PropertyFeatureNestedPublicSerializer(many=True, read_only=True)
    main_image = serializers.SerializerMethodField()
    province_name = serializers.SerializerMethodField()
    city_name = serializers.SerializerMethodField()
    district_name = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            'id', 'public_id', 'title', 'slug', 'short_description',
            'is_published', 'is_featured', 'is_active', 'status',
            'main_image',
            'property_type', 'state', 'labels', 'tags', 'features',
            'price', 'sale_price', 'monthly_rent', 'mortgage_amount',
            'land_area', 'built_area', 'bedrooms', 'bathrooms', 'year_built',
            'province_name', 'city_name', 'district_name', 'neighborhood',
            'views_count', 'favorites_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def _get_prefetched_main_image(self, obj):
        images = getattr(obj, 'all_images', None)
        if images:
            return images[0]
        return None

    def get_main_image(self, obj):
        image_relation = self._get_prefetched_main_image(obj)
        if image_relation is None:
            image_relation = obj.images.select_related('image').order_by('-is_main', 'order', 'created_at').first()
        if not image_relation or not image_relation.image:
            return None

        image_file = getattr(image_relation.image, 'file', None)
        image_url = image_file.url if image_file else None
        return {
            'id': image_relation.image.id,
            'url': image_url,
            'file_url': image_url,
            'title': getattr(image_relation.image, 'title', ''),
            'alt_text': getattr(image_relation.image, 'alt_text', ''),
        }

    def get_province_name(self, obj):
        province = getattr(obj, 'province', None)
        return province.name if province else None

    def get_city_name(self, obj):
        city = getattr(obj, 'city', None)
        return city.name if city else None

    def get_district_name(self, obj):
        region = getattr(obj, 'region', None)
        return region.name if region else None


class PropertyPublicDetailSerializer(PropertyPublicListSerializer):
    class Meta(PropertyPublicListSerializer.Meta):
        fields = PropertyPublicListSerializer.Meta.fields + [
            'description', 'address', 'latitude', 'longitude',
        ]
        read_only_fields = fields
