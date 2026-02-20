
from rest_framework import serializers
from src.core.models import Province, City
from src.real_estate.models.location import CityRegion
from scripts.location_slug_shared import (
    ENGLISH_SLUG_PATTERN,
    canonical_location_slug,
    ensure_unique_slug,
    normalize_manual_slug,
)

class RealEstateProvinceSerializer(serializers.ModelSerializer):
    
    country_name = serializers.CharField(source='country.name', read_only=True)
    cities_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Province
        fields = ['id', 'public_id', 'name', 'code', 'slug', 'country_name', 'cities_count', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id']
    
    def get_cities_count(self, obj):
        
        return obj.cities.filter(is_active=True).count()

class RealEstateCitySerializer(serializers.ModelSerializer):
    
    province_name = serializers.CharField(source='province.name', read_only=True)
    province_id = serializers.IntegerField(source='province.id', read_only=True)
    has_regions = serializers.SerializerMethodField()
    property_count = serializers.SerializerMethodField()
    
    class Meta:
        model = City
        fields = [
            'id', 'public_id', 'name', 'code', 'slug',
            'province_id', 'province_name',
            'has_regions', 'property_count',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id']
    
    def get_has_regions(self, obj):
        
        return CityRegion.objects.filter(city=obj, is_active=True).exists()

    def get_property_count(self, obj):
        return getattr(obj, 'property_count', 0)

class RealEstateCityRegionSerializer(serializers.ModelSerializer):
    
    city_name = serializers.CharField(source='city.name', read_only=True)
    city_id = serializers.IntegerField(source='city.id', read_only=True)
    province_id = serializers.IntegerField(source='city.province.id', read_only=True)
    province_name = serializers.CharField(source='city.province.name', read_only=True)
    
    class Meta:
        model = CityRegion
        fields = [
            'id', 'public_id', 'code', 'name', 'slug',
            'city_id', 'city_name',
            'province_id', 'province_name',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id']

class RealEstateCitySimpleSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = City
        fields = ['id', 'name', 'code', 'slug']
        read_only_fields = ['id']

class RealEstateCityRegionSimpleSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = CityRegion
        fields = ['id', 'code', 'name', 'slug']
        read_only_fields = ['id']


class RealEstateProvinceCreateUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Province
        fields = ['id', 'name', 'code', 'slug']
        read_only_fields = ['id']

    def validate_slug(self, value):
        slug = normalize_manual_slug(value)
        if not slug:
            return ''

        if not ENGLISH_SLUG_PATTERN.fullmatch(slug):
            raise serializers.ValidationError('اسلاگ فقط باید شامل حروف انگلیسی کوچک و خط تیره باشد (بدون عدد).')

        queryset = Province.objects.filter(slug=slug)
        if self.instance is not None:
            queryset = queryset.exclude(id=self.instance.id)

        if queryset.exists():
            raise serializers.ValidationError('اسلاگ استان تکراری است.')
        return slug

    def create(self, validated_data):
        slug = (validated_data.get('slug') or '').strip()
        if not slug:
            base_slug = canonical_location_slug(validated_data.get('name', ''), scope='province') or 'province'
            existing = Province.objects.values_list('slug', flat=True)
            slug = ensure_unique_slug(existing, base_slug)
            validated_data['slug'] = slug
        return super().create(validated_data)

    def update(self, instance, validated_data):
        slug = (validated_data.get('slug') or '').strip()
        if not slug:
            name_value = validated_data.get('name', instance.name)
            base_slug = canonical_location_slug(name_value, scope='province') or 'province'
            existing = Province.objects.exclude(id=instance.id).values_list('slug', flat=True)
            slug = ensure_unique_slug(existing, base_slug)
            validated_data['slug'] = slug
        return super().update(instance, validated_data)


class RealEstateCityCreateUpdateSerializer(serializers.ModelSerializer):

    province_id = serializers.PrimaryKeyRelatedField(
        source='province',
        queryset=Province.objects.filter(is_active=True),
        write_only=True,
    )

    class Meta:
        model = City
        fields = ['id', 'name', 'code', 'slug', 'province_id']
        read_only_fields = ['id']

    def validate(self, attrs):
        attrs = super().validate(attrs)
        slug = normalize_manual_slug(attrs.get('slug') or '')
        province = attrs.get('province') or getattr(self.instance, 'province', None)

        if slug and not ENGLISH_SLUG_PATTERN.fullmatch(slug):
            raise serializers.ValidationError({'slug': 'اسلاگ فقط باید شامل حروف انگلیسی کوچک و خط تیره باشد (بدون عدد).'})

        if slug and province is not None:
            queryset = City.objects.filter(province=province, slug=slug)
            if self.instance is not None:
                queryset = queryset.exclude(id=self.instance.id)
            if queryset.exists():
                raise serializers.ValidationError({'slug': 'اسلاگ شهر در این استان تکراری است.'})

        attrs['slug'] = slug
        return attrs

    def create(self, validated_data):
        province = validated_data['province']
        slug = (validated_data.get('slug') or '').strip()
        if not slug:
            base_slug = canonical_location_slug(
                validated_data.get('name', ''),
                scope='city',
                province_name=province.name,
            ) or 'city'
            existing = City.objects.filter(province=province).values_list('slug', flat=True)
            slug = ensure_unique_slug(existing, base_slug)
            validated_data['slug'] = slug
        return super().create(validated_data)

    def update(self, instance, validated_data):
        province = validated_data.get('province', instance.province)
        slug = (validated_data.get('slug') or '').strip()
        if not slug:
            name_value = validated_data.get('name', instance.name)
            base_slug = canonical_location_slug(
                name_value,
                scope='city',
                province_name=province.name,
            ) or 'city'
            existing = City.objects.filter(province=province).exclude(id=instance.id).values_list('slug', flat=True)
            slug = ensure_unique_slug(existing, base_slug)
            validated_data['slug'] = slug
        return super().update(instance, validated_data)


class RealEstateCityRegionCreateUpdateSerializer(serializers.ModelSerializer):

    city_id = serializers.PrimaryKeyRelatedField(
        source='city',
        queryset=City.objects.filter(is_active=True),
        write_only=True,
    )

    class Meta:
        model = CityRegion
        fields = ['id', 'name', 'code', 'slug', 'city_id']
        read_only_fields = ['id']

    def validate(self, attrs):
        attrs = super().validate(attrs)
        slug = normalize_manual_slug(attrs.get('slug') or '')
        city = attrs.get('city') or getattr(self.instance, 'city', None)

        if slug and not ENGLISH_SLUG_PATTERN.fullmatch(slug):
            raise serializers.ValidationError({'slug': 'اسلاگ فقط باید شامل حروف انگلیسی کوچک و خط تیره باشد (بدون عدد).'})

        if slug and city is not None:
            queryset = CityRegion.objects.filter(city=city, slug=slug)
            if self.instance is not None:
                queryset = queryset.exclude(id=self.instance.id)
            if queryset.exists():
                raise serializers.ValidationError({'slug': 'اسلاگ منطقه در این شهر تکراری است.'})

        attrs['slug'] = slug
        return attrs

    def create(self, validated_data):
        city = validated_data['city']
        slug = (validated_data.get('slug') or '').strip()
        if not slug:
            base_slug = canonical_location_slug(validated_data.get('name', ''), scope='region') or 'region'
            existing = CityRegion.objects.filter(city=city).values_list('slug', flat=True)
            slug = ensure_unique_slug(existing, base_slug)
            validated_data['slug'] = slug
        return super().create(validated_data)

    def update(self, instance, validated_data):
        city = validated_data.get('city', instance.city)
        slug = (validated_data.get('slug') or '').strip()
        if not slug:
            name_value = validated_data.get('name', instance.name)
            base_slug = canonical_location_slug(name_value, scope='region') or 'region'
            existing = CityRegion.objects.filter(city=city).exclude(id=instance.id).values_list('slug', flat=True)
            slug = ensure_unique_slug(existing, base_slug)
            validated_data['slug'] = slug
        return super().update(instance, validated_data)
