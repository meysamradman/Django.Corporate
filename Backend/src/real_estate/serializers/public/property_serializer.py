from rest_framework import serializers

from src.real_estate.models.feature import PropertyFeature
from src.real_estate.models.label import PropertyLabel
from src.real_estate.models.property import Property
from src.real_estate.models.state import PropertyState
from src.real_estate.models.tag import PropertyTag
from src.real_estate.models.type import PropertyType
from src.media.serializers.media_serializer import MediaPublicSerializer, MediaCoverSerializer


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
            'price', 'sale_price', 'pre_sale_price', 'price_per_sqm', 'monthly_rent', 'mortgage_amount',
            'land_area', 'built_area', 'bedrooms', 'bathrooms', 'year_built',
            'province_name', 'city_name', 'district_name', 'neighborhood',
            'views_count', 'favorites_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if 'latitude' in data and data['latitude'] is not None:
            try:
                data['latitude'] = float(data['latitude'])
            except (ValueError, TypeError):
                pass

        if 'longitude' in data and data['longitude'] is not None:
            try:
                data['longitude'] = float(data['longitude'])
            except (ValueError, TypeError):
                pass

        return data

    def _get_prefetched_main_image(self, obj):
        images = getattr(obj, 'all_images', None)
        if images:
            return images[0]
        return None

    def get_main_image(self, obj):
        main_details = obj.get_main_image_details()
        if main_details:
            return main_details

        image_relation = self._get_prefetched_main_image(obj)
        if image_relation is None:
            image_relation = obj.images.select_related('image').order_by('-is_main', 'order', 'created_at').first()

        if image_relation and image_relation.image:
            image_file = getattr(image_relation.image, 'file', None)
            image_url = image_file.url if image_file else None
            return {
                'id': image_relation.image.id,
                'url': image_url,
                'file_url': image_url,
                'title': getattr(image_relation.image, 'title', ''),
                'alt_text': getattr(image_relation.image, 'alt_text', ''),
            }

        return None

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
    media = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()
    floor_plans = serializers.SerializerMethodField()
    videos = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()

    class Meta(PropertyPublicListSerializer.Meta):
        fields = PropertyPublicListSerializer.Meta.fields + [
            'description', 'address', 'latitude', 'longitude',
            'postal_code', 'country_name',
            'kitchens', 'living_rooms',
            'floors_in_building', 'floor_number',
            'parking_spaces', 'storage_rooms',
            'security_deposit', 'rent_amount',
            'build_years',
            'document_type', 'has_document',
            'extra_attributes',
            'media',
            'floor_plans',
            'videos',
            'documents',
        ]
        read_only_fields = fields

    def get_country_name(self, obj):
        return getattr(obj, 'country_name', None)

    def get_media(self, obj):
        main_details = obj.get_main_image_details() or {}
        main_image_id = main_details.get('id')

        images = obj.images.select_related('image').order_by('-is_main', 'order', 'created_at')
        result = []
        for rel in images:
            image = getattr(rel, 'image', None)
            file_url = image.file.url if image and getattr(image, 'file', None) else None
            media_payload = {
                'id': getattr(image, 'id', None),
                'public_id': str(getattr(image, 'public_id', '')) if getattr(image, 'public_id', None) else '',
                'url': file_url,
                'file_url': file_url,
                'title': getattr(image, 'title', '') if image else '',
                'alt_text': getattr(image, 'alt_text', '') if image else '',
                'media_type': 'image',
            }
            result.append({
                'id': rel.id,
                'order': rel.order,
                'is_main_image': bool(main_image_id and image and getattr(image, 'id', None) == main_image_id),
                'media': media_payload,
                'media_detail': media_payload,
            })
        return result

    def get_floor_plans(self, obj):
        from src.real_estate.serializers.public.floor_plan_serializer import FloorPlanPublicListSerializer

        prefetched = getattr(obj, '_prefetched_objects_cache', {})
        if 'floor_plans' in prefetched:
            floor_plans = prefetched['floor_plans']
        else:
            floor_plans = obj.floor_plans.filter(is_active=True).order_by('display_order', 'floor_number').prefetch_related(
                'images__image'
            )

        return FloorPlanPublicListSerializer(floor_plans, many=True, context=self.context).data

    @staticmethod
    def _apply_cover_override(cover_obj, media_payload: dict):
        if cover_obj is None:
            return
        try:
            media_payload['cover_image'] = MediaCoverSerializer(cover_obj).data
            media_payload['cover_image_url'] = cover_obj.file.url if getattr(cover_obj, 'file', None) else None
        except Exception:
            pass

    def get_videos(self, obj):
        videos = obj.videos.select_related('video', 'cover_image', 'video__cover_image').order_by('order', 'created_at')
        result = []

        for item in videos:
            media_obj = getattr(item, 'video', None)
            media_payload = MediaPublicSerializer(media_obj, context=self.context).data if media_obj else None
            if not media_payload:
                continue

            if getattr(item, 'cover_image', None) is not None:
                self._apply_cover_override(item.cover_image, media_payload)

            result.append({
                'id': item.id,
                'order': item.order,
                'autoplay': bool(getattr(item, 'autoplay', False)),
                'mute': bool(getattr(item, 'mute', True)),
                'show_cover': bool(getattr(item, 'show_cover', True)),
                'media': media_payload,
                'media_detail': media_payload,
            })

        return result

    def get_documents(self, obj):
        documents = obj.documents.select_related('document', 'cover_image', 'document__cover_image').order_by('order', 'created_at')
        result = []

        for item in documents:
            media_obj = getattr(item, 'document', None)
            media_payload = MediaPublicSerializer(media_obj, context=self.context).data if media_obj else None
            if not media_payload:
                continue

            if getattr(item, 'cover_image', None) is not None:
                self._apply_cover_override(item.cover_image, media_payload)

            custom_title = getattr(item, 'title', None)
            if custom_title:
                media_payload['title'] = custom_title

            result.append({
                'id': item.id,
                'order': item.order,
                'title': custom_title or media_payload.get('title', ''),
                'media': media_payload,
                'media_detail': media_payload,
            })

        return result
