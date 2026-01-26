from django.db.models import Prefetch, Count, Q
from django.core.paginator import Paginator
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from datetime import datetime

from src.real_estate.models.property import Property
from src.real_estate.models.media import PropertyImage, PropertyVideo, PropertyAudio, PropertyDocument
from src.real_estate.utils.cache import PropertyCacheManager, PropertyCacheKeys
from src.real_estate.messages.messages import PROPERTY_ERRORS


class PropertyYearService:
    """
    سرویس ساده برای مدیریت سال ساخت
    فقط برای API endpoint - منطق اصلی در Model است
    """
    
    @staticmethod
    def get_year_choices_for_dropdown():
        """
        لیست سال‌های مجاز برای dropdown در پنل ادمین
        از Model.get_year_built_choices() استفاده می‌کند
        """
        from src.real_estate.models.property import Property
        
        cache_key = 'property_year_choices'
        cached_choices = cache.get(cache_key)
        
        if cached_choices:
            return cached_choices
        
        # دریافت CHOICES از Model
        choices_tuples = Property.get_year_built_choices()
        
        # تبدیل به فرمت مناسب برای API
        year_choices = [
            {'value': year, 'label': label}
            for year, label in choices_tuples
        ]
        
        # کش برای 1 ساعت
        cache.set(cache_key, year_choices, 3600)
        
        return year_choices
    
    @staticmethod
    def get_year_range_info():
        """
        اطلاعات محدوده سال‌های مجاز
        """
        from src.real_estate.models.property import Property
        
        return {
            'min': Property.YEAR_MIN,
            'max': Property.get_year_max(),
            'current_shamsi_year': Property.get_current_shamsi_year(),
            'buffer': Property.YEAR_BUFFER,
            'total_choices': Property.get_year_max() - Property.YEAR_MIN + 1
        }


class PropertyAdminService:
    
    @staticmethod
    def get_property_queryset(filters=None, search=None, order_by=None, order_desc=None, date_from=None, date_to=None):
        queryset = Property.objects.select_related(
            'property_type', 'state', 'agent', 'agency', 'province', 'city', 'region', 'og_image'
        ).prefetch_related(
            'labels', 'tags', 'features',
            Prefetch(
                'images',
                queryset=PropertyImage.objects.filter(is_main=True).select_related('image'),
                to_attr='main_image_media'
            )
        )
        
        if filters:
            if filters.get('is_published') is not None:
                queryset = queryset.filter(is_published=filters['is_published'])
            if filters.get('is_public') is not None:
                queryset = queryset.filter(is_public=filters['is_public'])
            if filters.get('is_featured') is not None:
                queryset = queryset.filter(is_featured=filters['is_featured'])
            if filters.get('status'):
                queryset = queryset.filter(status=filters['status'])
            if filters.get('property_type_id'):
                queryset = queryset.filter(property_type_id=filters['property_type_id'])
            if filters.get('state_id'):
                queryset = queryset.filter(state_id=filters['state_id'])
            if filters.get('agent_id'):
                queryset = queryset.filter(agent_id=filters['agent_id'])
            if filters.get('agency_id'):
                queryset = queryset.filter(agency_id=filters['agency_id'])
            if filters.get('city_id'):
                queryset = queryset.filter(city_id=filters['city_id'])
            if filters.get('province_id'):
                queryset = queryset.filter(province_id=filters['province_id'])
            if filters.get('region_id'):
                queryset = queryset.filter(region_id=filters['region_id'])
            if filters.get('min_price'):
                queryset = queryset.filter(
                    Q(price__gte=filters['min_price']) |
                    Q(sale_price__gte=filters['min_price']) |
                    Q(pre_sale_price__gte=filters['min_price'])
                )
            if filters.get('max_price'):
                queryset = queryset.filter(
                    Q(price__lte=filters['max_price']) |
                    Q(sale_price__lte=filters['max_price']) |
                    Q(pre_sale_price__lte=filters['max_price'])
                )
            if filters.get('min_area'):
                queryset = queryset.filter(built_area__gte=filters['min_area'])
            if filters.get('max_area'):
                queryset = queryset.filter(built_area__lte=filters['max_area'])
            if filters.get('bedrooms'):
                queryset = queryset.filter(bedrooms=filters['bedrooms'])
            if filters.get('bathrooms'):
                queryset = queryset.filter(bathrooms=filters['bathrooms'])
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(short_description__icontains=search) |
                Q(description__icontains=search) |
                Q(address__icontains=search) |
                Q(city__name__icontains=search) |
                Q(region__name__icontains=search) |
                Q(meta_title__icontains=search) |
                Q(meta_description__icontains=search)
            ).distinct()
        
        # Date filters
        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=date_from_obj)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=date_to_obj)
            except ValueError:
                pass
        
        if order_by:
            ordering_field = order_by
            if order_desc:
                ordering_field = f'-{order_by}'
            queryset = queryset.order_by(ordering_field)
        else:
            queryset = queryset.order_by('-created_at')
        
        return queryset
    
    @staticmethod
    def get_property_detail(property_id):
        try:
            return Property.objects.select_related(
                'property_type', 'state', 'agent', 'agency', 'province', 'city', 'region', 'og_image'
            ).prefetch_related(
                'labels', 'tags', 'features',
                'images__image', 'videos__video', 'audios__audio', 'documents__document',
                'images__image__created_by', 'videos__video__created_by'
            ).get(id=property_id)
        except Property.DoesNotExist:
            return None
    
    @staticmethod
    def create_property(validated_data, created_by=None):
        from src.real_estate.services.admin.property_media_services import PropertyAdminMediaService
        
        # Consistent extraction - support both model instances and IDs
        labels_val = validated_data.pop('labels', validated_data.pop('labels_ids', []))
        tags_val = validated_data.pop('tags', validated_data.pop('tags_ids', []))
        features_val = validated_data.pop('features', validated_data.pop('features_ids', []))
        
        # Convert to instances/IDs list (PrimaryKeyRelatedField gives us instances already)
        # .set() accepts both instances and IDs, so we can pass directly
        labels_ids = labels_val if labels_val else []
        tags_ids = tags_val if tags_val else []
        features_ids = features_val if features_val else []
        
        media_files = validated_data.pop('media_files', [])
        media_ids = validated_data.pop('media_ids', [])
        
        # ✅ slug generation
        if not validated_data.get('slug') and validated_data.get('title'):
            base_slug = slugify(validated_data['title'])
            slug = base_slug
            counter = 1
            while Property.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug
        elif validated_data.get('slug'):
            base_slug = validated_data['slug']
            slug = base_slug
            counter = 1
            while Property.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug
        
        if not validated_data.get('meta_title') and validated_data.get('title'):
            validated_data['meta_title'] = validated_data['title'][:70]
        
        if not validated_data.get('meta_description'):
            if validated_data.get('short_description'):
                validated_data['meta_description'] = validated_data['short_description'][:300]
            elif validated_data.get('description'):
                validated_data['meta_description'] = validated_data['description'][:300]
        
        if not validated_data.get('og_title') and validated_data.get('meta_title'):
            validated_data['og_title'] = validated_data['meta_title']
        
        if not validated_data.get('og_description') and validated_data.get('meta_description'):
            validated_data['og_description'] = validated_data['meta_description']
        
        # Validate canonical_url
        if 'canonical_url' in validated_data and validated_data.get('canonical_url'):
            canonical_url = validated_data['canonical_url']
            if not canonical_url.startswith(('http://', 'https://')):
                validated_data['canonical_url'] = None
        
        with transaction.atomic():
            property_obj = Property.objects.create(created_by=created_by, **validated_data)
            
            if labels_ids:
                property_obj.labels.set(labels_ids)
            if tags_ids:
                property_obj.tags.set(tags_ids)
            if features_ids:
                property_obj.features.set(features_ids)
            
            if media_files or media_ids:
                PropertyAdminMediaService.add_media_bulk(
                    property_id=property_obj.id,
                    media_files=media_files,
                    media_ids=media_ids,
                    created_by=created_by
                )
        
        return property_obj
    
    @staticmethod
    def update_property(property_id, validated_data, media_ids=None, media_files=None, main_image_id=None, media_covers=None, updated_by=None):
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            raise ValidationError(PROPERTY_ERRORS["property_not_found"])
        
        # Consistent extraction: prefer direct args, fallback to popped validated_data
        
        # Consistent extraction: prefer args, fallback to popped validated_data
        # Consistent extraction: prefer direct args, fallback to popped validated_data
        # We handle both plural names and _ids for maximum frontend compatibility
        labels_val = validated_data.pop('labels', validated_data.pop('labels_ids', None))
        tags_val = validated_data.pop('tags', validated_data.pop('tags_ids', None))
        features_val = validated_data.pop('features', validated_data.pop('features_ids', None))
        
        media_ids = media_ids if media_ids is not None else validated_data.pop('media_ids', None)
        media_files = media_files if media_files is not None else validated_data.pop('media_files', None)
        main_image_id = main_image_id if main_image_id is not None else validated_data.pop('main_image_id', None)
        media_covers = media_covers if media_covers is not None else validated_data.pop('media_covers', None)
        
        # Extract location info for manual handling if needed
        city = validated_data.get('city')
        province = validated_data.get('province')
        region = validated_data.get('region')
        
        if 'title' in validated_data and not validated_data.get('slug'):
            from django.utils.text import slugify
            base_slug = slugify(validated_data['title'])
            slug = base_slug
            counter = 1
            while Property.objects.filter(slug=slug).exclude(pk=property_id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug
            
        # SEO Logic
        if 'title' in validated_data:
            if not validated_data.get('meta_title'):
                validated_data['meta_title'] = validated_data['title'][:70]
            if not validated_data.get('og_title'):
                validated_data['og_title'] = validated_data['meta_title']
        
        if 'short_description' in validated_data or 'description' in validated_data:
            if not validated_data.get('meta_description'):
                if validated_data.get('short_description'):
                    validated_data['meta_description'] = validated_data['short_description'][:300]
                elif validated_data.get('description'):
                    validated_data['meta_description'] = validated_data['description'][:300]
            
            if not validated_data.get('og_description'):
                validated_data['og_description'] = validated_data.get('meta_description') or property_obj.meta_description

        with transaction.atomic():
            # Mandatory fields and explicit setters for critical ones
            if province: property_obj.province = province
            if city: property_obj.city = city
            if region: property_obj.region = region
            
            # Update other fields safely
            for field, value in validated_data.items():
                if hasattr(property_obj, field):
                    try:
                        setattr(property_obj, field, value)
                    except (AttributeError, TypeError):
                        pass
            
            property_obj.save()
            
            # M2M updates - Ensure we use .set() correctly
            if labels_val is not None: property_obj.labels.set(labels_val)
            if tags_val is not None: property_obj.tags.set(tags_val)
            if features_val is not None: property_obj.features.set(features_val)
            
            # Media handling
            if media_files:
                from src.real_estate.services.admin.property_media_services import PropertyAdminMediaService
                media_result = PropertyAdminMediaService.add_media_bulk(
                    property_id=property_obj.id,
                    media_files=media_files,
                    created_by=updated_by
                )
                uploaded_ids = media_result.get('uploaded_media_ids', [])
                if uploaded_ids:
                    if media_ids is None: media_ids = uploaded_ids
                    else: media_ids = list(set(media_ids) | set(uploaded_ids))
            
            if media_ids is not None or main_image_id is not None or media_covers is not None:
                from src.real_estate.services.admin.property_media_services import PropertyAdminMediaService
                PropertyAdminMediaService.sync_media(
                    property_id=property_obj.id,
                    media_ids=media_ids,
                    main_image_id=main_image_id,
                    media_covers=media_covers
                )
        
        # FORCE DB REFRESH before return
        property_obj.refresh_from_db()
        
        # Clear all possible cache keys
        PropertyCacheManager.invalidate_property(property_id)
        PropertyCacheManager.invalidate_list()
        
        return property_obj
    
    @staticmethod
    def delete_property(property_id):
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            raise Property.DoesNotExist(PROPERTY_ERRORS["property_not_found"])
        
        with transaction.atomic():
            property_obj.delete()
        
        PropertyCacheManager.invalidate_property(property_id)
        PropertyCacheManager.invalidate_list()
        
        return True
    
    @staticmethod
    def bulk_delete_properties(property_ids):
        if not property_ids:
            raise ValidationError(PROPERTY_ERRORS["property_ids_required"])
        
        properties = Property.objects.filter(id__in=property_ids)
        
        if not properties.exists():
            raise ValidationError(PROPERTY_ERRORS["properties_not_found"])
        
        with transaction.atomic():
            deleted_count = properties.count()
            properties.delete()
            
            for prop_id in property_ids:
                PropertyCacheManager.invalidate_property(prop_id)
            PropertyCacheManager.invalidate_list()
        
        return deleted_count
    
    @staticmethod
    def bulk_update_status(property_ids, is_published=None, is_featured=None):
        if not property_ids:
            raise ValidationError(PROPERTY_ERRORS["property_ids_required"])
        
        update_fields = {}
        if is_published is not None:
            update_fields['is_published'] = is_published
            if is_published and not update_fields.get('published_at'):
                update_fields['published_at'] = timezone.now()
        if is_featured is not None:
            update_fields['is_featured'] = is_featured
        
        if not update_fields:
            return False
        
        update_fields['updated_at'] = timezone.now()
        
        with transaction.atomic():
            Property.objects.filter(id__in=property_ids).update(**update_fields)
            
            for prop_id in property_ids:
                PropertyCacheManager.invalidate_property(prop_id)
            PropertyCacheManager.invalidate_list()
        
        return True
    
    @staticmethod
    def set_main_image(property_id, media_id):
        from src.real_estate.services.admin.property_media_services import PropertyAdminMediaService
        return PropertyAdminMediaService.set_main_image(property_id, media_id)
    
    @staticmethod
    def get_property_statistics():
        """استفاده از PropertyStatisticsService برای آمار"""
        from src.real_estate.services.admin.property_statistics_service import PropertyStatisticsService
        stats = PropertyStatisticsService.get_statistics()
        
        # اضافه کردن recent_properties برای backward compatibility
        recent_properties = Property.objects.for_admin_listing()[:5]
        from src.real_estate.serializers.admin.property_serializer import PropertyAdminListSerializer
        recent_serializer = PropertyAdminListSerializer(recent_properties, many=True)
        stats['recent_properties'] = recent_serializer.data
        
        return stats
    
    @staticmethod
    def get_seo_report():
        cache_key = f"{PropertyCacheKeys.statistics()}:seo_report"
        cached_report = cache.get(cache_key)
        if cached_report:
            return cached_report
        
        total = Property.objects.count()
        
        if total == 0:
            report_data = {
                'total': 0,
                'complete_seo': 0,
                'partial_seo': 0,
                'no_seo': 0,
                'completion_percentage': 0,
                'og_image_count': 0,
                'canonical_url_count': 0
            }
            cache.set(cache_key, report_data, 600)
            return report_data
        
        complete_seo = Property.objects.filter(
            meta_title__isnull=False,
            meta_description__isnull=False,
            og_image__isnull=False
        ).count()
        
        partial_seo = Property.objects.filter(
            Q(meta_title__isnull=False) | Q(meta_description__isnull=False) | Q(og_image__isnull=False)
        ).exclude(
            meta_title__isnull=False,
            meta_description__isnull=False,
            og_image__isnull=False
        ).count()
        
        no_seo = total - complete_seo - partial_seo
        
        og_image_count = Property.objects.filter(og_image__isnull=False).count()
        canonical_url_count = Property.objects.filter(canonical_url__isnull=False).count()
        
        report_data = {
            'total': total,
            'complete_seo': complete_seo,
            'partial_seo': partial_seo,
            'no_seo': no_seo,
            'completion_percentage': round((complete_seo / total * 100), 1) if total > 0 else 0,
            'og_image_count': og_image_count,
            'canonical_url_count': canonical_url_count
        }
        
        cache.set(cache_key, report_data, 600)
        return report_data


class PropertyAdminStatusService:
    
    @staticmethod
    def publish_property(property_id):
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            raise Property.DoesNotExist(PROPERTY_ERRORS["property_not_found"])
        
        warnings = []
        
        if not property_obj.meta_title:
            warnings.append("Meta title is missing")
        if not property_obj.meta_description:
            warnings.append("Meta description is missing")
        if not property_obj.og_image:
            warnings.append("OG image is missing")
        
        property_obj.is_published = True
        if not property_obj.published_at:
            property_obj.published_at = timezone.now()
        property_obj.save(update_fields=['is_published', 'published_at', 'updated_at'])
        
        PropertyCacheManager.invalidate_property(property_id)
        
        return {
            'property': property_obj,
            'warnings': warnings
        }
    
    @staticmethod
    def unpublish_property(property_id):
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            raise Property.DoesNotExist(PROPERTY_ERRORS["property_not_found"])
        
        property_obj.is_published = False
        property_obj.save(update_fields=['is_published', 'updated_at'])
        
        PropertyCacheManager.invalidate_property(property_id)
        
        return property_obj
    
    @staticmethod
    def toggle_featured(property_id):
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            raise Property.DoesNotExist(PROPERTY_ERRORS["property_not_found"])
        
        property_obj.is_featured = not property_obj.is_featured
        property_obj.save(update_fields=['is_featured', 'updated_at'])
        
        PropertyCacheManager.invalidate_property(property_id)
        PropertyCacheManager.invalidate_list()
        
        return property_obj

