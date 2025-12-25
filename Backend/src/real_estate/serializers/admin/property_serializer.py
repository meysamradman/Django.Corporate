from rest_framework import serializers
from django.core.cache import cache
from django.conf import settings

from src.real_estate.models.property import Property
from src.real_estate.models.media import PropertyImage, PropertyVideo, PropertyAudio, PropertyDocument
from src.real_estate.models.type import PropertyType
from src.real_estate.models.state import PropertyState
from src.real_estate.models.label import PropertyLabel
from src.real_estate.models.feature import PropertyFeature
from src.real_estate.models.tag import PropertyTag
from src.real_estate.models.agent import PropertyAgent
from src.real_estate.models.agency import RealEstateAgency
from src.real_estate.models.location import City, Province, Country, CityRegion
from src.real_estate.utils.cache import PropertyCacheKeys
from src.media.serializers.media_serializer import MediaAdminSerializer, MediaCoverSerializer

_MEDIA_LIST_LIMIT = getattr(settings, 'REAL_ESTATE_MEDIA_LIST_LIMIT', 5)
_MEDIA_DETAIL_LIMIT = getattr(settings, 'REAL_ESTATE_MEDIA_DETAIL_LIMIT', 50)


class PropertyMediaAdminSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    public_id = serializers.UUIDField(read_only=True)
    media_detail = MediaAdminSerializer(read_only=True, source='media')
    is_main_image = serializers.BooleanField(read_only=True)
    order = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    def to_representation(self, instance):
        if isinstance(instance, PropertyImage):
            media_detail = MediaAdminSerializer(instance.image, context=self.context).data
        elif isinstance(instance, PropertyVideo):
            media_detail = MediaAdminSerializer(instance.video, context=self.context).data
            self._apply_property_cover_image(instance, media_detail)
        elif isinstance(instance, PropertyAudio):
            media_detail = MediaAdminSerializer(instance.audio, context=self.context).data
            self._apply_property_cover_image(instance, media_detail)
        elif isinstance(instance, PropertyDocument):
            media_detail = MediaAdminSerializer(instance.document, context=self.context).data
            self._apply_property_cover_image(instance, media_detail)
        else:
            return super().to_representation(instance)
        
        result = {
            'id': instance.id,
            'public_id': instance.public_id,
            'media_detail': media_detail,
            'media': media_detail,
            'order': instance.order,
            'created_at': instance.created_at,
            'updated_at': instance.updated_at,
        }
        
        if isinstance(instance, PropertyImage):
            result['is_main_image'] = instance.is_main
        
        return result
    
    def _apply_property_cover_image(self, instance, media_detail):
        if instance.cover_image is not None:
            media_detail['cover_image'] = MediaCoverSerializer(instance.cover_image, context=self.context).data
            media_detail['cover_image_url'] = instance.cover_image.file.url if instance.cover_image.file else None
        else:
            property_cover = instance.get_cover_image()
            if property_cover:
                media_detail['cover_image'] = MediaCoverSerializer(property_cover, context=self.context).data
                media_detail['cover_image_url'] = property_cover.file.url if property_cover.file else None


class PropertyTypeSimpleAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyType
        fields = ['id', 'public_id', 'title', 'display_order']


class PropertyStateSimpleAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyState
        fields = ['id', 'public_id', 'title']


class PropertyLabelSimpleAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyLabel
        fields = ['id', 'public_id', 'title']


class PropertyFeatureSimpleAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyFeature
        fields = ['id', 'public_id', 'title', 'category']


class PropertyTagSimpleAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyTag
        fields = ['id', 'public_id', 'title', 'slug']


class PropertyAgentSimpleAdminSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = PropertyAgent
        fields = ['id', 'public_id', 'first_name', 'last_name', 'full_name', 'phone', 'email', 'license_number']


class RealEstateAgencySimpleAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = RealEstateAgency
        fields = ['id', 'public_id', 'name', 'slug', 'phone', 'email', 'license_number']


class PropertyAdminListSerializer(serializers.ModelSerializer):
    main_image = serializers.SerializerMethodField()
    property_type = PropertyTypeSimpleAdminSerializer(read_only=True)
    state = PropertyStateSimpleAdminSerializer(read_only=True)
    agent = PropertyAgentSimpleAdminSerializer(read_only=True)
    agency = RealEstateAgencySimpleAdminSerializer(read_only=True)
    labels = PropertyLabelSimpleAdminSerializer(many=True, read_only=True)
    
    media_count = serializers.SerializerMethodField()
    labels_count = serializers.IntegerField(read_only=True)
    tags_count = serializers.IntegerField(read_only=True)
    features_count = serializers.IntegerField(read_only=True)
    
    seo_status = serializers.SerializerMethodField()
    city_name = serializers.SerializerMethodField()
    province_name = serializers.SerializerMethodField()
    district_name = serializers.SerializerMethodField()
    region_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'public_id', 'title', 'slug', 'short_description',
            'is_published', 'is_featured', 'is_public', 'is_verified', 'is_active',
            'main_image', 'property_type', 'state', 'agent', 'agency',
            'labels', 'labels_count', 'tags_count', 'features_count',
            'media_count', 'seo_status',
            'city_name', 'province_name', 'district_name', 'region_name',
            'price', 'sale_price', 'pre_sale_price', 'price_per_sqm', 'currency',
            'monthly_rent', 'rent_amount', 'mortgage_amount',
            'land_area', 'built_area',
            'bedrooms', 'bathrooms', 'kitchens', 'living_rooms',
            'parking_spaces', 'storage_rooms',
            'views_count', 'favorites_count', 'inquiries_count',
            'published_at', 'created_at', 'updated_at',
            'meta_title', 'meta_description',
        ]
    
    def get_media_count(self, obj):
        try:
            count = 0
            if hasattr(obj, '_prefetched_objects_cache'):
                cache = obj._prefetched_objects_cache
                count += len(cache.get('images', []))
                count += len(cache.get('videos', []))
                count += len(cache.get('audios', []))
                count += len(cache.get('documents', []))
            elif hasattr(obj, 'all_images'):
                count += len(obj.all_images) if obj.all_images else 0
                count += len(obj.videos.all()) if hasattr(obj, 'videos') else 0
                count += len(obj.audios.all()) if hasattr(obj, 'audios') else 0
                count += len(obj.documents.all()) if hasattr(obj, 'documents') else 0
            else:
                count = (
                    obj.images.count() + 
                    obj.videos.count() + 
                    obj.audios.count() + 
                    obj.documents.count()
                )
            return count
        except:
            return 0
    
    def get_main_image(self, obj):
        if hasattr(obj, 'get_main_image_details'):
            return obj.get_main_image_details()
        
        if hasattr(obj, 'all_images') and obj.all_images:
            for img in obj.all_images:
                if img.is_main and img.image:
                    main_image = img.image
                    try:
                        file_url = main_image.file.url if main_image.file else None
                    except Exception:
                        file_url = None
                    return {
                        'id': main_image.id,
                        'url': file_url,
                        'file_url': file_url,
                        'title': main_image.title,
                        'alt_text': main_image.alt_text
                    }
            if obj.all_images and obj.all_images[0].image:
                first_image = obj.all_images[0].image
                try:
                    file_url = first_image.file.url if first_image.file else None
                except Exception:
                    file_url = None
                return {
                    'id': first_image.id,
                    'url': file_url,
                    'file_url': file_url,
                    'title': first_image.title,
                    'alt_text': first_image.alt_text
                }
        return None
    
    def get_seo_status(self, obj):
        has_meta_title = bool(obj.meta_title)
        has_meta_description = bool(obj.meta_description)
        has_og_image = bool(obj.og_image)
        
        score = sum([has_meta_title, has_meta_description, has_og_image])
        return {
            'score': score,
            'total': 3,
            'status': 'complete' if score == 3 else 'incomplete' if score > 0 else 'missing'
        }
    
    def get_city_name(self, obj):
        return obj.city.name if obj.city else None
    
    def get_province_name(self, obj):
        return obj.province.name if obj.province else None
    
    def get_district_name(self, obj):
        return obj.region.name if obj.region else None

    def get_region_name(self, obj):
        return obj.region.name if obj.region else None


class PropertyAdminDetailSerializer(serializers.ModelSerializer):
    main_image = serializers.SerializerMethodField()
    property_type = PropertyTypeSimpleAdminSerializer(read_only=True)
    state = PropertyStateSimpleAdminSerializer(read_only=True)
    agent = PropertyAgentSimpleAdminSerializer(read_only=True)
    agency = RealEstateAgencySimpleAdminSerializer(read_only=True)
    labels = PropertyLabelSimpleAdminSerializer(many=True, read_only=True)
    tags = PropertyTagSimpleAdminSerializer(many=True, read_only=True)
    features = PropertyFeatureSimpleAdminSerializer(many=True, read_only=True)
    media = serializers.SerializerMethodField()
    property_media = serializers.SerializerMethodField()
    
    seo_data = serializers.SerializerMethodField()
    seo_preview = serializers.SerializerMethodField()
    seo_completeness = serializers.SerializerMethodField()
    
    city_name = serializers.SerializerMethodField()
    province_name = serializers.SerializerMethodField()
    district_name = serializers.SerializerMethodField()
    region_name = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'public_id', 'title', 'slug', 'short_description', 'description',
            'is_published', 'is_featured', 'is_public', 'is_verified', 'is_active',
            'main_image', 'property_type', 'state', 'agent', 'agency',
            'labels', 'tags', 'features', 'media', 'property_media',
            'region', 'city', 'city_name', 'province', 'province_name',
            'country', 'country_name', 'district_name', 'region_name', 'neighborhood',
            'address', 'postal_code', 'latitude', 'longitude',
            'price', 'sale_price', 'pre_sale_price', 'price_per_sqm', 'currency', 'is_negotiable',
            'monthly_rent', 'rent_amount', 'mortgage_amount', 'security_deposit',
            'land_area', 'built_area',
            'bedrooms', 'bathrooms', 'kitchens', 'living_rooms',
            'year_built', 'build_years', 'floors_in_building', 'floor_number',
            'parking_spaces', 'storage_rooms',
            'views_count', 'favorites_count', 'inquiries_count',
            'published_at', 'created_at', 'updated_at',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'structured_data', 'hreflang_data',
            'seo_data', 'seo_preview', 'seo_completeness',
        ]
    
    def get_main_image(self, obj):
        return obj.get_main_image_details()
    
    def get_media(self, obj):
        media_limit = _MEDIA_DETAIL_LIMIT
        
        if hasattr(obj, 'all_images'):
            all_images = getattr(obj, 'all_images', [])
            if media_limit > 0:
                all_images = all_images[:media_limit]
        else:
            images_qs = obj.images.select_related('image').all()
            all_images = list(images_qs[:media_limit]) if media_limit > 0 else list(images_qs)
        
        if hasattr(obj, '_prefetched_objects_cache') and 'videos' in obj._prefetched_objects_cache:
            videos = obj._prefetched_objects_cache['videos']
            if media_limit > 0:
                videos = videos[:media_limit]
        else:
            videos_qs = obj.videos.select_related('video', 'video__cover_image', 'cover_image').all()
            videos = list(videos_qs[:media_limit]) if media_limit > 0 else list(videos_qs)
        
        if hasattr(obj, '_prefetched_objects_cache') and 'audios' in obj._prefetched_objects_cache:
            audios = obj._prefetched_objects_cache['audios']
            if media_limit > 0:
                audios = audios[:media_limit]
        else:
            audios_qs = obj.audios.select_related('audio', 'audio__cover_image', 'cover_image').all()
            audios = list(audios_qs[:media_limit]) if media_limit > 0 else list(audios_qs)
        
        if hasattr(obj, '_prefetched_objects_cache') and 'documents' in obj._prefetched_objects_cache:
            documents = obj._prefetched_objects_cache['documents']
            if media_limit > 0:
                documents = documents[:media_limit]
        else:
            documents_qs = obj.documents.select_related('document', 'document__cover_image', 'cover_image').all()
            documents = list(documents_qs[:media_limit]) if media_limit > 0 else list(documents_qs)
        
        self._prefetch_cover_image_urls(videos, 'video')
        self._prefetch_cover_image_urls(audios, 'audio')
        self._prefetch_cover_image_urls(documents, 'document')
        
        all_media = list(all_images) + list(videos) + list(audios) + list(documents)
        all_media.sort(key=lambda x: (x.order, x.created_at))
        
        serializer = PropertyMediaAdminSerializer(context=self.context)
        return [serializer.to_representation(media) for media in all_media]
    
    def _prefetch_cover_image_urls(self, items, media_type):
        for item in items:
            media_obj = getattr(item, media_type, None)
            if media_obj and hasattr(media_obj, 'cover_image') and media_obj.cover_image:
                if hasattr(media_obj.cover_image, 'file') and media_obj.cover_image.file:
                    try:
                        _ = media_obj.cover_image.file.url
                    except Exception:
                        pass
            
            if media_type == 'document' and hasattr(item, 'document') and item.document:
                if hasattr(item.document, 'file') and item.document.file:
                    try:
                        _ = item.document.file.url
                    except Exception:
                        pass
    
    def get_property_media(self, obj):
        return self.get_media(obj)
    
    def get_seo_data(self, obj):
        cache_key = PropertyCacheKeys.structured_data(obj.pk)
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
        
        seo_data = {
            'meta_title': obj.get_meta_title(),
            'meta_description': obj.get_meta_description(),
            'og_title': obj.get_og_title(),
            'og_description': obj.get_og_description(),
            'canonical_url': obj.get_canonical_url(),
            'structured_data': obj.generate_structured_data(),
        }
        
        cache.set(cache_key, seo_data, 1800)
        return seo_data
    
    def get_seo_preview(self, obj):
        cache_key = PropertyCacheKeys.seo_preview(obj.pk)
        cached_preview = cache.get(cache_key)
        if cached_preview:
            return cached_preview
        
        preview_data = {
            'google': {
                'title': obj.get_meta_title()[:60] if obj.get_meta_title() else '',
                'description': obj.get_meta_description()[:160] if obj.get_meta_description() else '',
                'url': obj.get_public_url()
            },
            'facebook': {
                'title': obj.get_og_title(),
                'description': obj.get_og_description(),
                'image': obj.og_image.file.url if obj.og_image and obj.og_image.file else None
            }
        }
        
        cache.set(cache_key, preview_data, 1800)
        return preview_data
    
    def get_seo_completeness(self, obj):
        cache_key = PropertyCacheKeys.seo_completeness(obj.pk)
        cached_completeness = cache.get(cache_key)
        if cached_completeness:
            return cached_completeness
        
        checks = [
            bool(obj.meta_title),
            bool(obj.meta_description),
            bool(obj.og_title),
            bool(obj.og_description),
            bool(obj.og_image),
            bool(obj.canonical_url),
            len(obj.title or '') <= 60,
            len(obj.get_meta_description() or '') >= 120,
            len(obj.get_meta_description() or '') <= 160,
        ]
        score = sum(checks)
        completeness_data = {
            'score': score,
            'total': len(checks),
            'percentage': round((score / len(checks)) * 100, 1) if checks else 0
        }
        
        cache.set(cache_key, completeness_data, 1800)
        return completeness_data
    
    def get_city_name(self, obj):
        return obj.city.name if obj.city else None
    
    def get_province_name(self, obj):
        return obj.province.name if obj.province else None
    
    def get_district_name(self, obj):
        return obj.region.name if obj.region else None

    def get_region_name(self, obj):
        return obj.region.name if obj.region else None
    
    def get_country_name(self, obj):
        return obj.country.name if obj.country else None


class PropertyAdminCreateSerializer(serializers.ModelSerializer):
    labels_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )
    tags_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )
    features_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )
    media_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )
    
    # Relaxed constraints for optional fields during creation
    land_area = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    built_area = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    bedrooms = serializers.IntegerField(required=False, allow_null=True)
    bathrooms = serializers.IntegerField(required=False, allow_null=True)

    # Location fields - simplified like Diwar
    province = serializers.PrimaryKeyRelatedField(
        queryset=Province.objects.all(),
        help_text="Province (selected from dropdown)"
    )
    city = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(),
        help_text="City (selected from dropdown)"
    )
    region = serializers.PrimaryKeyRelatedField(
        queryset=CityRegion.objects.all(),
        required=False,
        allow_null=True,
        help_text="City region (optional - only for major cities like Tehran)"
    )
    neighborhood = serializers.CharField(
        max_length=120,
        required=False,
        allow_blank=True,
        help_text="Neighborhood name (from map or manual input)"
    )
    
    class Meta:
        model = Property
        fields = [
            'title', 'slug', 'short_description', 'description',
            'agent', 'agency', 'property_type', 'state',
            'province', 'city', 'region', 'neighborhood',
            'address', 'postal_code', 'latitude', 'longitude',
            'price', 'sale_price', 'pre_sale_price', 'currency', 'is_negotiable',
            'monthly_rent', 'rent_amount', 'mortgage_amount', 'security_deposit',
            'land_area', 'built_area',
            'bedrooms', 'bathrooms', 'kitchens', 'living_rooms',
            'year_built', 'build_years', 'floors_in_building', 'floor_number',
            'parking_spaces', 'storage_rooms',
            'is_published', 'is_featured', 'is_public', 'is_verified',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'labels_ids', 'tags_ids', 'features_ids',
            'media_files',
        ]
    
    
    def to_internal_value(self, data):
        """Override to quantize latitude/longitude before model validation"""
        from decimal import Decimal, ROUND_DOWN

        # Process latitude
        if 'latitude' in data and data['latitude'] is not None:
            if isinstance(data['latitude'], str):
                try:
                    lat_value = Decimal(data['latitude'])
                except:
                    lat_value = data['latitude']
            elif isinstance(data['latitude'], (int, float)):
                lat_value = Decimal(str(data['latitude']))
            else:
                lat_value = data['latitude']

            if isinstance(lat_value, Decimal):
                data['latitude'] = lat_value.quantize(Decimal('0.00000001'), rounding=ROUND_DOWN)

        # Process longitude
        if 'longitude' in data and data['longitude'] is not None:
            if isinstance(data['longitude'], str):
                try:
                    lng_value = Decimal(data['longitude'])
                except:
                    lng_value = data['longitude']
            elif isinstance(data['longitude'], (int, float)):
                lng_value = Decimal(str(data['longitude']))
            else:
                lng_value = data['longitude']

            if isinstance(lng_value, Decimal):
                data['longitude'] = lng_value.quantize(Decimal('0.00000001'), rounding=ROUND_DOWN)

        return super().to_internal_value(data)

    def validate(self, attrs):
        # Validate that at least one price field is provided
        price_fields = ['price', 'sale_price', 'pre_sale_price', 'monthly_rent', 'rent_amount']
        if not any(attrs.get(field) for field in price_fields):
            raise serializers.ValidationError("حداقل یکی از فیلدهای قیمت باید پر شود.")

        # Validate location fields - simplified like Diwar
        if not attrs.get('province'):
            raise serializers.ValidationError("استان الزامی است.")
        if not attrs.get('city'):
            raise serializers.ValidationError("شهر الزامی است.")

        # Validate region belongs to selected city (if provided)
        if attrs.get('region'):
            if attrs['region'].city_id != attrs['city'].id:
                raise serializers.ValidationError("منطقه انتخاب شده متعلق به این شهر نیست.")

        return attrs


class PropertyAdminUpdateSerializer(PropertyAdminDetailSerializer):
    labels_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_null=True
    )
    tags_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_null=True
    )
    features_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_null=True
    )
    latitude = serializers.DecimalField(max_digits=10, decimal_places=8, required=False, allow_null=True, coerce_to_string=False)
    longitude = serializers.DecimalField(max_digits=11, decimal_places=8, required=False, allow_null=True, coerce_to_string=False)
    media_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True,
        help_text="List of media IDs to sync with property (removes deleted, adds new)"
    )
    main_image_id = serializers.IntegerField(
        write_only=True,
        required=False,
        allow_null=True,
        help_text="ID of media to set as main image"
    )
    media_covers = serializers.DictField(
        child=serializers.IntegerField(allow_null=True),
        write_only=True,
        required=False,
        help_text="Mapping of media_id to cover_image_id for property-specific covers. Format: {media_id: cover_image_id}"
    )
    
    city = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(),
        required=False,
        allow_null=True,
        help_text="City (can be selected directly or auto-filled from region)"
    )
    province = serializers.PrimaryKeyRelatedField(
        read_only=True,
        help_text="Province (auto-filled from city or region)"
    )
    country = serializers.PrimaryKeyRelatedField(
        read_only=True,
        help_text="Country (auto-filled from province)"
    )
    
    class Meta:
        model = Property
        fields = [
            'title', 'slug', 'short_description', 'description',
            'agent', 'agency', 'property_type', 'state',
            'region', 'city', 'province', 'country', 'neighborhood',
            'address', 'postal_code', 'latitude', 'longitude',
            'price', 'sale_price', 'pre_sale_price', 'currency', 'is_negotiable',
            'monthly_rent', 'rent_amount', 'mortgage_amount', 'security_deposit',
            'land_area', 'built_area',
            'bedrooms', 'bathrooms', 'kitchens', 'living_rooms',
            'year_built', 'build_years', 'floors_in_building', 'floor_number',
            'parking_spaces', 'storage_rooms',
            'is_published', 'is_featured', 'is_public', 'is_verified', 'is_active',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'labels_ids', 'tags_ids', 'features_ids', 'media_ids', 'main_image_id', 'media_covers',
        ]

    def to_internal_value(self, data):
        """Override to quantize latitude/longitude before model validation"""
        from decimal import Decimal, ROUND_DOWN

        # Process latitude
        if 'latitude' in data and data['latitude'] is not None:
            if isinstance(data['latitude'], str):
                lat_value = Decimal(data['latitude'])
            elif isinstance(data['latitude'], (int, float)):
                lat_value = Decimal(str(data['latitude']))
            else:
                lat_value = data['latitude']

            if isinstance(lat_value, Decimal):
                data['latitude'] = lat_value.quantize(Decimal('0.00000001'), rounding=ROUND_DOWN)

        # Process longitude
        if 'longitude' in data and data['longitude'] is not None:
            if isinstance(data['longitude'], str):
                lng_value = Decimal(data['longitude'])
            elif isinstance(data['longitude'], (int, float)):
                lng_value = Decimal(str(data['longitude']))
            else:
                lng_value = data['longitude']

            if isinstance(lng_value, Decimal):
                data['longitude'] = lng_value.quantize(Decimal('0.00000001'), rounding=ROUND_DOWN)

        return super().to_internal_value(data)

    def to_representation(self, instance):
        """Ensure latitude/longitude are returned as numbers for frontend"""
        data = super().to_representation(instance)

        # Convert latitude and longitude to float for frontend
        if hasattr(instance, 'latitude') and instance.latitude is not None:
            try:
                data['latitude'] = float(instance.latitude)
            except (ValueError, TypeError):
                data['latitude'] = None
        else:
            data['latitude'] = None

        if hasattr(instance, 'longitude') and instance.longitude is not None:
            try:
                data['longitude'] = float(instance.longitude)
            except (ValueError, TypeError):
                data['longitude'] = None
        else:
            data['longitude'] = None

        return data

    def validate(self, attrs):
        print(f"VALIDATE ATTRS: {attrs}")
        # Quantize latitude and longitude to prevent validation errors
        from decimal import Decimal, ROUND_DOWN

        if 'latitude' in attrs and attrs['latitude'] is not None:
            # Ensure latitude is quantized to 8 decimal places
            if isinstance(attrs['latitude'], Decimal):
                attrs['latitude'] = attrs['latitude'].quantize(Decimal('0.00000001'), rounding=ROUND_DOWN)
            else:
                lat_value = Decimal(str(attrs['latitude']))
                attrs['latitude'] = lat_value.quantize(Decimal('0.00000001'), rounding=ROUND_DOWN)

        if 'longitude' in attrs and attrs['longitude'] is not None:
            # Ensure longitude is quantized to 8 decimal places
            if isinstance(attrs['longitude'], Decimal):
                attrs['longitude'] = attrs['longitude'].quantize(Decimal('0.00000001'), rounding=ROUND_DOWN)
            else:
                lng_value = Decimal(str(attrs['longitude']))
                attrs['longitude'] = lng_value.quantize(Decimal('0.00000001'), rounding=ROUND_DOWN)

        # Handle location fields - region is now optional
        region = attrs.get('region')
        city = attrs.get('city')

        # If region is provided, validate it and populate city/province/country
        if region:
            # Validate region belongs to city (if city is also provided)
            if city and region.city_id != city.id:
                raise serializers.ValidationError({
                    'region': 'منطقه انتخاب شده متعلق به این شهر نیست.'
                })

            # Populate city, province, country from region
            attrs['city'] = region.city
            attrs['province'] = region.city.province
            attrs['country'] = region.city.province.country

        # If no region but city is provided, just use the city info
        elif city:
            attrs['province'] = city.province
            attrs['country'] = city.province.country
            # region remains None (optional)

        # If neither region nor city provided, try to keep existing values
        elif self.instance:
            # Keep existing location data if no new location provided
            pass

        return attrs

    def to_representation(self, instance):
        """Ensure latitude/longitude are returned as numbers for frontend"""
        data = super().to_representation(instance)

        # Convert latitude and longitude to float for frontend
        if instance.latitude is not None:
            data['latitude'] = float(instance.latitude)
        if instance.longitude is not None:
            data['longitude'] = float(instance.longitude)

        return data


class PropertyAdminSerializer(PropertyAdminDetailSerializer):
    pass

