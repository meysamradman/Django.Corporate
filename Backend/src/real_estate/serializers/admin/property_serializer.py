from rest_framework import serializers
from django.core.cache import cache
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

from src.real_estate.models.property import Property
from src.real_estate.models.media import PropertyImage, PropertyVideo, PropertyAudio, PropertyDocument
from src.real_estate.models.type import PropertyType
from src.real_estate.models.state import PropertyState
from src.real_estate.models.label import PropertyLabel
from src.real_estate.models.feature import PropertyFeature
from src.real_estate.models.tag import PropertyTag
from src.real_estate.models.agent import PropertyAgent
from src.real_estate.models.agency import RealEstateAgency
from src.core.models import City, Province
from src.real_estate.models.location import CityRegion
from src.real_estate.utils.cache import PropertyCacheKeys
from src.media.serializers.media_serializer import MediaAdminSerializer, MediaCoverSerializer
from src.real_estate.models.constants import (
    DOCUMENT_TYPE_CHOICES,
    SPACE_TYPE_CHOICES,
    CONSTRUCTION_STATUS_CHOICES,
    PROPERTY_CONDITION_CHOICES,
    PROPERTY_DIRECTION_CHOICES,
    CITY_POSITION_CHOICES,
    UNIT_TYPE_CHOICES,
    PROPERTY_STATUS_CHOICES,
)

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
        fields = ['id', 'public_id', 'title', 'group']

class PropertyTagSimpleAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyTag
        fields = ['id', 'public_id', 'title', 'slug']

class PropertyAgentSimpleAdminSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    profile_picture_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyAgent
        fields = ['id', 'user', 'public_id', 'first_name', 'last_name', 'full_name', 'phone', 'email', 'license_number', 'profile_picture_url']

    def get_profile_picture_url(self, obj):
        if obj.profile_picture and obj.profile_picture.file:
            return obj.profile_picture.file.url
        try:
            if obj.user and hasattr(obj.user, 'admin_profile'):
                profile = obj.user.admin_profile
                if profile.profile_picture and profile.profile_picture.file:
                    return profile.profile_picture.file.url
        except Exception:
            pass
        return None

class RealEstateAgencySimpleAdminSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = RealEstateAgency
        fields = ['id', 'public_id', 'name', 'slug', 'phone', 'email', 'license_number', 'logo_url']

    def get_logo_url(self, obj):
        if hasattr(obj, 'profile_picture') and obj.profile_picture and hasattr(obj.profile_picture, 'file') and obj.profile_picture.file:
            try:
                return obj.profile_picture.file.url
            except Exception:
                pass
        
        try:
            if hasattr(obj, 'created_by') and obj.created_by:
                if hasattr(obj.created_by, 'admin_profile'):
                    profile = obj.created_by.admin_profile
                    if profile.profile_picture and profile.profile_picture.file:
                        return profile.profile_picture.file.url
        except Exception:
            pass
            
        return None

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
            'is_published', 'is_featured', 'is_public', 'is_active', 'status', # ✅ Status added
            'main_image', 'primary_video', 'primary_audio', 'primary_document',
            'property_type', 'state', 'agent', 'agency',
            'labels', 'labels_count', 'tags_count', 'features_count', 
            'images_count', 'videos_count', 'audios_count', 'documents_count', 'media_count',
            'seo_status', 'city_name', 'province_name', 'district_name', 'region_name',
            'price', 'sale_price', 'pre_sale_price', 'price_per_sqm',
            'monthly_rent', 'rent_amount', 'mortgage_amount',
            'land_area', 'built_area',
            'bedrooms', 'bathrooms', 'kitchens', 'living_rooms',
            'year_built', 'build_years', 'floors_in_building', 'floor_number',
            'parking_spaces', 'storage_rooms', 'document_type', 'has_document',
            'views_count', 'web_views_count', 'app_views_count', 'favorites_count', 'inquiries_count',
            'meta_title', 'meta_description',
            'published_at', 'created_at', 'updated_at', # ✅ همیشه در انتها
        ]

    images_count = serializers.IntegerField(source='total_images_count', read_only=True)
    videos_count = serializers.IntegerField(source='total_videos_count', read_only=True)
    audios_count = serializers.IntegerField(source='total_audios_count', read_only=True)
    documents_count = serializers.IntegerField(source='total_docs_count', read_only=True)

    primary_video = serializers.SerializerMethodField()
    primary_audio = serializers.SerializerMethodField()
    primary_document = serializers.SerializerMethodField()

    def get_media_count(self, obj):
        return getattr(obj, 'total_media_count', 0)
    
    def get_main_image(self, obj):
        main_images = getattr(obj, 'main_image_prefetch', [])
        if main_images:
            img_obj = main_images[0]
            if img_obj.image:
                file_url = None
                try:
                    file_url = img_obj.image.file.url if img_obj.image.file else None
                except Exception:
                    pass
                return {
                    'id': img_obj.image.id,
                    'url': file_url,
                    'file_url': file_url,
                    'title': img_obj.image.title,
                    'alt_text': img_obj.image.alt_text
                }
        return None

    def _get_media_preview(self, obj, attr_name, media_field):
        items = getattr(obj, attr_name, [])
        if items:
            item = items[0]
            media_obj = getattr(item, media_field)
            if media_obj:
                cover_url = None
                try:
                    if hasattr(item, 'cover_image') and item.cover_image:
                        cover_url = item.cover_image.file.url
                    elif hasattr(media_obj, 'cover_image') and media_obj.cover_image:
                        cover_url = media_obj.cover_image.file.url
                    elif hasattr(media_obj, 'file'):
                        cover_url = media_obj.file.url # Fallback
                except Exception:
                    pass
                
                title = getattr(item, 'title', None) or getattr(media_obj, 'title', None)
                
                return {
                    'id': item.id,
                    'title': title,
                    'cover_url': cover_url,
                    'media_id': media_obj.id
                }
        return None

    def get_primary_video(self, obj):
        return self._get_media_preview(obj, 'primary_video_prefetch', 'video')

    def get_primary_audio(self, obj):
        return self._get_media_preview(obj, 'primary_audio_prefetch', 'audio')

    def get_primary_document(self, obj):
        return self._get_media_preview(obj, 'primary_document_prefetch', 'document')
    
    def get_seo_status(self, obj):
        has_meta_title = bool(obj.meta_title)
        has_meta_description = bool(obj.meta_description)
        has_og_image = bool(getattr(obj, 'og_image_id', None))
        
        score = sum([has_meta_title, has_meta_description, has_og_image])
        return {
            'score': score,
            'total': 3,
            'status': 'complete' if score == 3 else 'incomplete' if score > 0 else 'missing'
        }
    
    def get_city_name(self, obj):
        return obj.city.name if obj.city_id and hasattr(obj, 'city') else None
    
    def get_province_name(self, obj):
        return obj.province.name if obj.province_id and hasattr(obj, 'province') else None
    
    def get_district_name(self, obj):
        return obj.region.name if obj.region_id and hasattr(obj, 'region') else None

    def get_region_name(self, obj):
        return obj.region.name if obj.region_id and hasattr(obj, 'region') else None

from src.media.serializers.mixins import MediaAggregationMixin
from src.real_estate.services.admin.property_media_services import PropertyAdminMediaService
class PropertyAdminDetailSerializer(MediaAggregationMixin, serializers.ModelSerializer):
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
    floor_plans = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    
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
            'id', 'public_id', 'status', 'title', 'slug',
            'short_description', 'description',
            'is_published', 'is_featured', 'is_public', 'is_active',
            'main_image', 'property_type', 'state', 'agent', 'agency',
            'labels', 'tags', 'features', 'media', 'property_media',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'structured_data', 'hreflang_data',
            'seo_data', 'seo_preview', 'seo_completeness',
            'created_by', 'created_by_name', 'city_name', 'province_name', 'country_name', # ✅ created_by added
            'district_name', 'region_name', 'province',
            'price', 'sale_price', 'pre_sale_price', 'price_per_sqm',
            'monthly_rent', 'rent_amount', 'mortgage_amount', 'security_deposit',
            'land_area', 'built_area',
            'bedrooms', 'bathrooms', 'kitchens', 'living_rooms',
            'year_built', 'build_years', 'floors_in_building', 'floor_number',
            'parking_spaces', 'storage_rooms', 'document_type', 'has_document',
            'views_count', 'web_views_count', 'app_views_count', 'favorites_count', 'inquiries_count',
            'published_at', 'created_at', 'updated_at',
            'region', 'city', 'neighborhood', 'address', 'postal_code', 
            'latitude', 'longitude', 'extra_attributes', 'floor_plans',
        ]
    
    def get_main_image(self, obj):
        return obj.get_main_image_details()
    
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
    
    def get_media(self, obj):
        return self.aggregate_media(
            obj=obj,
            media_limit=_MEDIA_DETAIL_LIMIT,
            media_serializer_class=PropertyMediaAdminSerializer
        )
    
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

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return None
            
        profile = getattr(obj.created_by, 'admin_profile', None)
        if profile:
            full_name = f"{profile.first_name or ''} {profile.last_name or ''}".strip()
            if full_name:
                return full_name
        
        return obj.created_by.mobile or obj.created_by.email or str(obj.created_by)
    
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
        return "ایران"
    
    def get_floor_plans(self, obj):
        from src.real_estate.serializers.admin.floor_plan_serializer import FloorPlanAdminListSerializer

        prefetched = getattr(obj, '_prefetched_objects_cache', {})
        if 'floor_plans' in prefetched:
            floor_plans = prefetched['floor_plans']
        else:
            floor_plans = obj.floor_plans.filter(is_active=True).order_by('display_order', 'floor_number').prefetch_related(
                'images__image'
            )

        return FloorPlanAdminListSerializer(floor_plans, many=True, context=self.context).data

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
    media_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    image_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    video_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    audio_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    document_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    
    land_area = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    built_area = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    bedrooms = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Number of bedrooms (0-20)",
        min_value=0,
        max_value=20
    )
    bathrooms = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Number of bathrooms (0-20)",
        min_value=0,
        max_value=20
    )
    parking_spaces = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Number of parking spaces (0-20)",
        min_value=0,
        max_value=20
    )
    year_built = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Year built (Solar calendar - calculated dynamically)"
    )

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
    
    slug = serializers.CharField(
        max_length=120,
        required=False,
        allow_blank=True,
        help_text="URL Slug (supports Persian and English, auto-generated from title if not provided)"
    )
    
    class Meta:
        model = Property
        fields = [
            'title', 'slug', 'short_description', 'description',
            'agent', 'agency', 'property_type', 'state', 'status', # ✅ Status added
            'province', 'city', 'region', 'neighborhood',
            'address', 'postal_code', 'latitude', 'longitude',
            'price', 'sale_price', 'pre_sale_price',
            'monthly_rent', 'rent_amount', 'mortgage_amount', 'security_deposit',
            'land_area', 'built_area',
            'bedrooms', 'bathrooms', 'kitchens', 'living_rooms',
            'year_built', 'build_years', 'floors_in_building', 'floor_number',
            'parking_spaces', 'storage_rooms', 'document_type', 'has_document',
            'extra_attributes',
            'is_published', 'is_featured', 'is_public',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'labels_ids', 'tags_ids', 'features_ids',
            'media_files', 'media_ids', 
            'image_ids', 'video_ids', 'audio_ids', 'document_ids',
        ]
        extra_kwargs = {
            'slug': {'validators': []},
        }
    
    def to_internal_value(self, data):
        
        from decimal import Decimal, ROUND_DOWN

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

    def validate(self, attrs):
        if not attrs.get('province'):
            raise serializers.ValidationError("استان الزامی است.")
        if not attrs.get('city'):
            raise serializers.ValidationError("شهر الزامی است.")

        if attrs.get('region'):
            if attrs['region'].city_id != attrs['city'].id:
                raise serializers.ValidationError("منطقه انتخاب شده متعلق به این شهر نیست.")
        
        if attrs.get('bedrooms') is not None:
            if attrs['bedrooms'] < 0 or attrs['bedrooms'] > 20:
                raise serializers.ValidationError({"bedrooms": "تعداد خواب باید بین 0 تا 20 باشد."})
        
        if attrs.get('bathrooms') is not None:
            if attrs['bathrooms'] < 0 or attrs['bathrooms'] > 20:
                raise serializers.ValidationError({"bathrooms": "تعداد سرویس بهداشتی باید بین 0 تا 20 باشد."})
        
        if attrs.get('parking_spaces') is not None:
            if attrs['parking_spaces'] < 0 or attrs['parking_spaces'] > 20:
                raise serializers.ValidationError({"parking_spaces": "تعداد پارکینگ باید بین 0 تا 20 باشد."})

        if attrs.get('document_type'):
            if attrs['document_type'] not in DOCUMENT_TYPE_CHOICES:
                raise serializers.ValidationError({
                    "document_type": f"نوع سند نامعتبر است. مقادیر مجاز: {', '.join(DOCUMENT_TYPE_CHOICES.keys())}"
                })
        
        extra_attrs = attrs.get('extra_attributes', {})
        if extra_attrs and isinstance(extra_attrs, dict):
            if 'space_type' in extra_attrs:
                if extra_attrs['space_type'] not in SPACE_TYPE_CHOICES:
                    raise serializers.ValidationError({
                        "extra_attributes": f"نوع فضا نامعتبر: {extra_attrs['space_type']}. مقادیر مجاز: {', '.join(SPACE_TYPE_CHOICES.keys())}"
                    })
            
            if 'construction_status' in extra_attrs:
                if extra_attrs['construction_status'] not in CONSTRUCTION_STATUS_CHOICES:
                    raise serializers.ValidationError({
                        "extra_attributes": f"وضعیت ساخت نامعتبر: {extra_attrs['construction_status']}. مقادیر مجاز: {', '.join(CONSTRUCTION_STATUS_CHOICES.keys())}"
                    })
            
            if 'property_condition' in extra_attrs:
                if extra_attrs['property_condition'] not in PROPERTY_CONDITION_CHOICES:
                    raise serializers.ValidationError({
                        "extra_attributes": f"وضعیت ملک نامعتبر: {extra_attrs['property_condition']}. مقادیر مجاز: {', '.join(PROPERTY_CONDITION_CHOICES.keys())}"
                    })
            
            if 'property_direction' in extra_attrs:
                if extra_attrs['property_direction'] not in PROPERTY_DIRECTION_CHOICES:
                    raise serializers.ValidationError({
                        "extra_attributes": f"جهت ملک نامعتبر: {extra_attrs['property_direction']}. مقادیر مجاز: {', '.join(PROPERTY_DIRECTION_CHOICES.keys())}"
                    })
            
            if 'city_position' in extra_attrs:
                if extra_attrs['city_position'] not in CITY_POSITION_CHOICES:
                    raise serializers.ValidationError({
                        "extra_attributes": f"موقعیت شهری نامعتبر: {extra_attrs['city_position']}. مقادیر مجاز: {', '.join(CITY_POSITION_CHOICES.keys())}"
                    })
            
            if 'unit_type' in extra_attrs:
                if extra_attrs['unit_type'] not in UNIT_TYPE_CHOICES:
                    raise serializers.ValidationError({
                        "extra_attributes": f"نوع واحد نامعتبر: {extra_attrs['unit_type']}. مقادیر مجاز: {', '.join(UNIT_TYPE_CHOICES.keys())}"
                    })

        return attrs

class PropertyAdminUpdateSerializer(PropertyAdminDetailSerializer):
    labels = serializers.PrimaryKeyRelatedField(
        queryset=PropertyLabel.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )
    tags = serializers.PrimaryKeyRelatedField(
        queryset=PropertyTag.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )
    features = serializers.PrimaryKeyRelatedField(
        queryset=PropertyFeature.objects.all(),
        many=True,
        write_only=True,
        required=False,
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
    media_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        help_text="New media files to upload"
    )

    image_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    video_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    audio_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    document_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    
    image_covers = serializers.DictField(child=serializers.IntegerField(allow_null=True), write_only=True, required=False)
    video_covers = serializers.DictField(child=serializers.IntegerField(allow_null=True), write_only=True, required=False)
    audio_covers = serializers.DictField(child=serializers.IntegerField(allow_null=True), write_only=True, required=False)
    document_covers = serializers.DictField(child=serializers.IntegerField(allow_null=True), write_only=True, required=False)
    
    parking_spaces = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=0,
        max_value=20,
        help_text="تعداد پارکینگ (اختیاری)"
    )
    storage_rooms = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=0,
        max_value=20,
        help_text="تعداد انباری (اختیاری)"
    )
    year_built = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="سال ساخت (اختیاری)"
    )
    floors_in_building = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=1,
        max_value=100,
        help_text="تعداد طبقات ساختمان (اختیاری)"
    )

    property_type = serializers.PrimaryKeyRelatedField(
        queryset=PropertyType.objects.all(), 
        required=False,
        help_text="نوع ملک"
    )
    state = serializers.PrimaryKeyRelatedField(
        queryset=PropertyState.objects.all(), 
        required=False,
        help_text="وضعیت ملک (فروشی، اجاره و ...)"
    )
    agent = serializers.PrimaryKeyRelatedField(
        queryset=PropertyAgent.objects.all(), 
        required=False, 
        allow_null=True,
        help_text="مشاور"
    )
    agency = serializers.PrimaryKeyRelatedField(
        queryset=RealEstateAgency.objects.all(), 
        required=False, 
        allow_null=True,
        help_text="آژانس"
    )
    status = serializers.ChoiceField(
        choices=PROPERTY_STATUS_CHOICES,
        required=False,
        help_text="وضعیت معامله"
    )
    
    city = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(),
        required=False,
        allow_null=True,
        help_text="City (can be selected directly or auto-filled from region)"
    )
    province = serializers.PrimaryKeyRelatedField(
        queryset=Province.objects.all(),
        required=False,
        allow_null=True,
        help_text="Province (auto-filled from city or region)"
    )
    
    class Meta:
        model = Property
        fields = [
            'title', 'slug', 'short_description', 'description',
            'agent', 'agency', 'property_type', 'state', 'status', # ✅ Status added
            'region', 'city', 'province', 'neighborhood',
            'address', 'postal_code', 'latitude', 'longitude',
            'price', 'sale_price', 'pre_sale_price',
            'monthly_rent', 'rent_amount', 'mortgage_amount', 'security_deposit',
            'land_area', 'built_area',
            'bedrooms', 'bathrooms', 'kitchens', 'living_rooms',
            'year_built', 'build_years', 'floors_in_building', 'floor_number',
            'parking_spaces', 'storage_rooms', 'document_type', 'has_document',
            'extra_attributes',
            'is_published', 'is_featured', 'is_public', 'is_active',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'labels', 'tags', 'features', 
            'media_ids', 'media_files', 'main_image_id', 'media_covers',
            'image_ids', 'video_ids', 'audio_ids', 'document_ids',
            'image_covers', 'video_covers', 'audio_covers', 'document_covers',
        ]

    def to_internal_value(self, data):
        
        from decimal import Decimal, ROUND_DOWN

        if 'latitude' in data and data['latitude'] not in [None, '']:
            if isinstance(data['latitude'], str):
                try:
                    lat_value = Decimal(data['latitude'])
                except:
                    lat_value = None
            elif isinstance(data['latitude'], (int, float)):
                lat_value = Decimal(str(data['latitude']))
            else:
                lat_value = data['latitude']

            if isinstance(lat_value, Decimal):
                data['latitude'] = lat_value.quantize(Decimal('0.00000001'), rounding=ROUND_DOWN)

        if 'longitude' in data and data['longitude'] not in [None, '']:
            if isinstance(data['longitude'], str):
                try:
                    lng_value = Decimal(data['longitude'])
                except:
                    lng_value = None
            elif isinstance(data['longitude'], (int, float)):
                lng_value = Decimal(str(data['longitude']))
            else:
                lng_value = data['longitude']

            if isinstance(lng_value, Decimal):
                data['longitude'] = lng_value.quantize(Decimal('0.00000001'), rounding=ROUND_DOWN)

        return super().to_internal_value(data)

    def validate(self, attrs):
        from decimal import Decimal, ROUND_DOWN

        if 'latitude' in attrs and attrs['latitude'] is not None:
            if isinstance(attrs['latitude'], Decimal):
                attrs['latitude'] = attrs['latitude'].quantize(Decimal('0.00000001'), rounding=ROUND_DOWN)
            else:
                lat_value = Decimal(str(attrs['latitude']))
                attrs['latitude'] = lat_value.quantize(Decimal('0.00000001'), rounding=ROUND_DOWN)

        if 'longitude' in attrs and attrs['longitude'] is not None:
            if isinstance(attrs['longitude'], Decimal):
                attrs['longitude'] = attrs['longitude'].quantize(Decimal('0.00000001'), rounding=ROUND_DOWN)
            else:
                lng_value = Decimal(str(attrs['longitude']))
                attrs['longitude'] = lng_value.quantize(Decimal('0.00000001'), rounding=ROUND_DOWN)

        if attrs.get('bedrooms') is not None:
            if attrs['bedrooms'] < 0 or attrs['bedrooms'] > 20:
                raise serializers.ValidationError({"bedrooms": "تعداد خواب باید بین 0 تا 20 باشد."})
        
        if attrs.get('bathrooms') is not None:
            if attrs['bathrooms'] < 0 or attrs['bathrooms'] > 20:
                raise serializers.ValidationError({"bathrooms": "تعداد سرویس بهداشتی باید بین 0 تا 20 باشد."})
        
        if attrs.get('parking_spaces') is not None:
            if attrs['parking_spaces'] < 0 or attrs['parking_spaces'] > 20:
                raise serializers.ValidationError({"parking_spaces": "تعداد پارکینگ باید بین 0 تا 20 باشد."})

        if attrs.get('document_type'):
            if attrs['document_type'] not in DOCUMENT_TYPE_CHOICES:
                raise serializers.ValidationError({
                    "document_type": f"نوع سند نامعتبر است. مقادیر مجاز: {', '.join(DOCUMENT_TYPE_CHOICES.keys())}"
                })
        
        extra_attrs = attrs.get('extra_attributes', {})
        if extra_attrs and isinstance(extra_attrs, dict):
            if 'space_type' in extra_attrs:
                if extra_attrs['space_type'] not in SPACE_TYPE_CHOICES:
                    raise serializers.ValidationError({
                        "extra_attributes": f"نوع فضا نامعتبر: {extra_attrs['space_type']}. مقادیر مجاز: {', '.join(SPACE_TYPE_CHOICES.keys())}"
                    })
            
            if 'construction_status' in extra_attrs:
                if extra_attrs['construction_status'] not in CONSTRUCTION_STATUS_CHOICES:
                    raise serializers.ValidationError({
                        "extra_attributes": f"وضعیت ساخت نامعتبر: {extra_attrs['construction_status']}. مقادیر مجاز: {', '.join(CONSTRUCTION_STATUS_CHOICES.keys())}"
                    })
            
            if 'property_condition' in extra_attrs:
                if extra_attrs['property_condition'] not in PROPERTY_CONDITION_CHOICES:
                    raise serializers.ValidationError({
                        "extra_attributes": f"وضعیت ملک نامعتبر: {extra_attrs['property_condition']}. مقادیر مجاز: {', '.join(PROPERTY_CONDITION_CHOICES.keys())}"
                    })
            
            if 'property_direction' in extra_attrs:
                if extra_attrs['property_direction'] not in PROPERTY_DIRECTION_CHOICES:
                    raise serializers.ValidationError({
                        "extra_attributes": f"جهت ملک نامعتبر: {extra_attrs['property_direction']}. مقادیر مجاز: {', '.join(PROPERTY_DIRECTION_CHOICES.keys())}"
                    })
            
            if 'city_position' in extra_attrs:
                if extra_attrs['city_position'] not in CITY_POSITION_CHOICES:
                    raise serializers.ValidationError({
                        "extra_attributes": f"موقعیت شهری نامعتبر: {extra_attrs['city_position']}. مقادیر مجاز: {', '.join(CITY_POSITION_CHOICES.keys())}"
                    })
            
            if 'unit_type' in extra_attrs:
                if extra_attrs['unit_type'] not in UNIT_TYPE_CHOICES:
                    raise serializers.ValidationError({
                        "extra_attributes": f"نوع واحد نامعتبر: {extra_attrs['unit_type']}. مقادیر مجاز: {', '.join(UNIT_TYPE_CHOICES.keys())}"
                    })

        region = attrs.get('region')
        city = attrs.get('city')

        if region:
            if city and region.city_id != city.id:
                raise serializers.ValidationError({
                    'region': 'منطقه انتخاب شده متعلق به این شهر نیست.'
                })

            attrs['city'] = region.city
            attrs['province'] = region.city.province
            attrs['country'] = region.city.province.country

        elif city:
            attrs['province'] = city.province
            attrs['country'] = city.province.country

        elif self.instance:
            pass

        return attrs

class PropertyAdminSerializer(PropertyAdminDetailSerializer):
    pass

