import logging
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
from src.real_estate.utils.cache_admin import PropertyCacheManager, PropertyCacheKeys
from src.real_estate.utils.cache_ttl import (
    ADMIN_PROPERTY_LIST_TTL,
    ADMIN_PROPERTY_SEO_REPORT_TTL,
    ADMIN_PROPERTY_YEAR_CHOICES_TTL,
)
from src.real_estate.messages.messages import PROPERTY_ERRORS
from src.real_estate.services.analytics.deals_service import DealsService

logger = logging.getLogger(__name__)

class PropertyYearService:

    @staticmethod
    def get_year_choices_for_dropdown():
        
        from src.real_estate.models.property import Property
        
        cache_key = 'admin:real_estate:property:year_choices'
        cached_choices = cache.get(cache_key)
        
        if cached_choices:
            return cached_choices
        
        choices_tuples = Property.get_year_built_choices()
        
        year_choices = [
            {'value': year, 'label': label}
            for year, label in choices_tuples
        ]
        
        cache.set(cache_key, year_choices, ADMIN_PROPERTY_YEAR_CHOICES_TTL)
        
        return year_choices
    
    @staticmethod
    def get_year_range_info():
        
        from src.real_estate.models.property import Property
        
        return {
            'min': Property.YEAR_MIN,
            'max': Property.get_year_max(),
            'current_shamsi_year': Property.get_current_shamsi_year(),
            'buffer': Property.YEAR_BUFFER,
            'total_choices': Property.get_year_max() - Property.YEAR_MIN + 1
        }

class PropertyExportRateLimitService:

    @staticmethod
    def check_and_increment(user_id, limit, window_seconds):
        cache_key = f"admin:real_estate:property:export_limit:{user_id}"
        export_count = cache.get(cache_key, 0)
        if export_count >= limit:
            return False
        cache.set(cache_key, export_count + 1, window_seconds)
        return True

class PropertyAdminService:

    @staticmethod
    def _normalize_query_params(query_params):
        if hasattr(query_params, 'lists'):
            normalized = {}
            for key, values in sorted(query_params.lists()):
                if not values:
                    normalized[key] = None
                elif len(values) == 1:
                    normalized[key] = values[0]
                else:
                    normalized[key] = values
            return normalized

        if isinstance(query_params, dict):
            return {key: query_params[key] for key in sorted(query_params.keys())}

        return {}

    @staticmethod
    def get_list_cache_key(user_id, query_params):
        payload = {
            'user_id': user_id,
            'query_params': PropertyAdminService._normalize_query_params(query_params),
        }
        return PropertyCacheKeys.list_admin(payload)

    @staticmethod
    def get_cached_list_payload(user_id, query_params):
        cache_key = PropertyAdminService.get_list_cache_key(user_id, query_params)
        return PropertyCacheManager.get(cache_key)

    @staticmethod
    def set_cached_list_payload(user_id, query_params, payload):
        cache_key = PropertyAdminService.get_list_cache_key(user_id, query_params)
        PropertyCacheManager.set(cache_key, payload, timeout=ADMIN_PROPERTY_LIST_TTL)
    
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
            return Property.objects.for_detail().select_related(
                'region__city__province__country',
                'created_by__admin_profile'
            ).get(id=property_id)
        except Property.DoesNotExist:
            return None
    
    @staticmethod
    def create_property(validated_data, created_by=None):
        logger.info(f"🏠 [PropertyService][Create] Starting creation for: {validated_data.get('title')}")
        from src.real_estate.services.admin.property_media_services import PropertyAdminMediaService
        
        labels_val = validated_data.pop('labels', validated_data.pop('labels_ids', []))
        tags_val = validated_data.pop('tags', validated_data.pop('tags_ids', []))
        features_val = validated_data.pop('features', validated_data.pop('features_ids', []))
        
        labels_ids = labels_val if labels_val else []
        tags_ids = tags_val if tags_val else []
        features_ids = features_val if features_val else []
        
        media_files = validated_data.pop('media_files', [])
        media_ids = validated_data.pop('media_ids', [])
        image_ids = validated_data.pop('image_ids', [])
        video_ids = validated_data.pop('video_ids', [])
        audio_ids = validated_data.pop('audio_ids', [])
        document_ids = validated_data.pop('document_ids', [])
        
        logger.debug(f"📊 [PropertyService][Create] Data extracted: labels={len(labels_ids)}, tags={len(tags_ids)}, features={len(features_ids)}, files={len(media_files)}, ids={len(media_ids)}")

        if not validated_data.get('agent') and created_by and created_by.is_authenticated:
            from src.real_estate.models.agent import PropertyAgent
            
            agent = PropertyAgent.objects.filter(user=created_by).first()
            
            if agent:
                validated_data['agent'] = agent
                logger.info(f"✅ [PropertyService][Create] Auto-assigned existing agent {agent.id} for user {created_by.id}")
            else:
                logger.info(f"ℹ️ [PropertyService][Create] User {created_by.id} is an Admin without Agent profile. Leaving agent as None.")

        elif validated_data.get('agent'):
            logger.info(f"✅ [PropertyService][Create] Agent explicitly provided: {validated_data.get('agent').id if hasattr(validated_data.get('agent'), 'id') else validated_data.get('agent')}")
        else:
            logger.debug(f"⏭️  [PropertyService][Create] No agent assignment (no authenticated user)")

        resolved_agent = validated_data.get('agent')
        validated_data['agency'] = resolved_agent.agency if resolved_agent else None
        
        if validated_data.get('agency'):
            logger.info(f"🏢 [PropertyService][Create] Agency explicitly provided: {validated_data.get('agency').id if hasattr(validated_data.get('agency'), 'id') else validated_data.get('agency')}")

        provided_slug = (validated_data.get('slug') or '').strip() if isinstance(validated_data.get('slug'), str) else validated_data.get('slug')
        if provided_slug:
            if Property.objects.filter(slug=provided_slug).exists():
                raise ValidationError({'slug': [PROPERTY_ERRORS["property_slug_exists"]]})
            validated_data['slug'] = provided_slug
        elif validated_data.get('title'):
            base_slug = slugify(validated_data['title'], allow_unicode=True)
            slug = base_slug
            counter = 1
            while Property.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug

        with transaction.atomic():
            property_obj = Property.objects.create(created_by=created_by, **validated_data)
            logger.info(f"✅ [PropertyService][Create] Property object created with ID: {property_obj.id}")
            
            if labels_ids:
                property_obj.labels.set(labels_ids)
            if tags_ids:
                property_obj.tags.set(tags_ids)
            if features_ids:
                property_obj.features.set(features_ids)
            
            if any([media_files, media_ids, image_ids, video_ids, audio_ids, document_ids]):
                logger.info(f"🖼️ [PropertyService][Create] Processing initial media...")
                PropertyAdminMediaService.add_media_bulk(
                    property_id=property_obj.id,
                    media_files=media_files,
                    media_ids=media_ids,
                    image_ids=image_ids,
                    video_ids=video_ids,
                    audio_ids=audio_ids,
                    document_ids=document_ids,
                    created_by=created_by
                )
        
        logger.info(f"🏆 [PropertyService][Create] Complete - Property ID: {property_obj.id}")

        PropertyCacheManager.invalidate_property(property_obj.id)
        PropertyCacheManager.invalidate_list()
        PropertyCacheManager.invalidate_statistics()

        return property_obj
    
    @staticmethod
    def update_property(property_id, validated_data, media_ids=None, media_files=None, 
                        image_ids=None, video_ids=None, audio_ids=None, document_ids=None,
                        main_image_id=None, media_covers=None,
                        image_covers=None, video_covers=None, audio_covers=None, document_covers=None,
                        updated_by=None):
        logger.info(f"🏠 [PropertyService][Update] Starting - Property ID: {property_id}")
        logger.debug(f"🏠 [PropertyService][Update] Initial Data: media_ids={media_ids}, files_count={len(media_files) if media_files else 0}, main_image={main_image_id}, covers={media_covers}")
        
        try:
            property_obj = Property.objects.get(id=property_id)
            logger.info(f"✅ [PropertyService][Update] Found property: {property_obj.title}")
        except Property.DoesNotExist:
            logger.error(f"❌ [PropertyService][Update] ERROR: {PROPERTY_ERRORS['property_not_found']}")
            raise ValidationError(PROPERTY_ERRORS["property_not_found"])

        labels_val = validated_data.pop('labels', validated_data.pop('labels_ids', None))
        tags_val = validated_data.pop('tags', validated_data.pop('tags_ids', None))
        features_val = validated_data.pop('features', validated_data.pop('features_ids', None))
        
        media_ids = media_ids if media_ids is not None else validated_data.pop('media_ids', None)
        media_files = media_files if media_files is not None else validated_data.pop('media_files', None)
        
        image_ids = image_ids if image_ids is not None else validated_data.pop('image_ids', None)
        video_ids = video_ids if video_ids is not None else validated_data.pop('video_ids', None)
        audio_ids = audio_ids if audio_ids is not None else validated_data.pop('audio_ids', None)
        document_ids = document_ids if document_ids is not None else validated_data.pop('document_ids', None)
        
        main_image_id = main_image_id if main_image_id is not None else validated_data.pop('main_image_id', None)
        media_covers = media_covers if media_covers is not None else validated_data.pop('media_covers', None)
        
        image_covers = image_covers if image_covers is not None else validated_data.pop('image_covers', None)
        video_covers = video_covers if video_covers is not None else validated_data.pop('video_covers', None)
        audio_covers = audio_covers if audio_covers is not None else validated_data.pop('audio_covers', None)
        document_covers = document_covers if document_covers is not None else validated_data.pop('document_covers', None)
        
        logger.debug(f"📊 [PropertyService][Update] Extracted media: ids={media_ids}, main_img={main_image_id}, covers={media_covers}")
        
        city = validated_data.get('city')
        province = validated_data.get('province')
        region = validated_data.get('region')
        
        if 'slug' in validated_data and validated_data.get('slug'):
            validated_data['slug'] = validated_data['slug'].strip() if isinstance(validated_data['slug'], str) else validated_data['slug']
            if Property.objects.filter(slug=validated_data['slug']).exclude(pk=property_id).exists():
                raise ValidationError({'slug': [PROPERTY_ERRORS["property_slug_exists"]]})

        if 'title' in validated_data and not validated_data.get('slug'):
            base_slug = slugify(validated_data['title'])
            slug = base_slug
            counter = 1
            while Property.objects.filter(slug=slug).exclude(pk=property_id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug
            
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

        requested_status = validated_data.get('status')
        if requested_status in ('sold', 'rented'):
            raise ValidationError(PROPERTY_ERRORS["status_finalize_required"])

        if 'agent' in validated_data:
            resolved_agent = validated_data.get('agent')
            validated_data['agency'] = resolved_agent.agency if resolved_agent else None
        elif 'agency' in validated_data:
            validated_data['agency'] = property_obj.agent.agency if property_obj.agent else None

        with transaction.atomic():
            if province: property_obj.province = province
            if city: property_obj.city = city
            if region: property_obj.region = region
            
            logger.debug(f"📝 [PropertyService][Update] Updating fields: {list(validated_data.keys())}")
            for field, value in validated_data.items():
                if hasattr(property_obj, field):
                    try:
                        setattr(property_obj, field, value)
                    except (AttributeError, TypeError) as e:
                        logger.warning(f"   ⚠️  Failed to set {field}: {str(e)}")
                        pass
            
            property_obj.save()
            logger.info(f"✅ [PropertyService][Update] Property object saved")
            
            if labels_val is not None: 
                property_obj.labels.set(labels_val)
            if tags_val is not None: 
                property_obj.tags.set(tags_val)
            if features_val is not None: 
                property_obj.features.set(features_val)
            
            if media_files:
                logger.info(f"📤 [PropertyService][Update] Processing {len(media_files)} new media files...")
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
                    logger.info(f"✅ [PropertyService][Update] Uploaded {len(uploaded_ids)} files, merged into media_ids")
            
            if any([media_ids, main_image_id, media_covers, 
                    image_ids, video_ids, audio_ids, document_ids,
                    image_covers, video_covers, audio_covers, document_covers]):
                logger.info(f"🔄 [PropertyService][Update] Calling sync_media...")
                from src.real_estate.services.admin.property_media_services import PropertyAdminMediaService
                PropertyAdminMediaService.sync_media(
                    property_id=property_obj.id,
                    media_ids=media_ids,
                    image_ids=image_ids,
                    video_ids=video_ids,
                    audio_ids=audio_ids,
                    document_ids=document_ids,
                    main_image_id=main_image_id,
                    media_covers=media_covers,
                    image_covers=image_covers,
                    video_covers=video_covers,
                    audio_covers=audio_covers,
                    document_covers=document_covers
                )
            else:
                logger.debug(f"⏭️  [PropertyService][Update] Skipping media sync")
        
        property_obj.refresh_from_db()
        
        PropertyCacheManager.invalidate_property(property_id)
        PropertyCacheManager.invalidate_list()
        PropertyCacheManager.invalidate_statistics()
        
        logger.info(f"✅ [PropertyService][Update] Complete for ID: {property_id}")
        
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
        PropertyCacheManager.invalidate_statistics()
        
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
            PropertyCacheManager.invalidate_statistics()
        
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
            PropertyCacheManager.invalidate_statistics()
        
        return True
    
    @staticmethod
    def set_main_image(property_id, media_id):
        from src.real_estate.services.admin.property_media_services import PropertyAdminMediaService
        return PropertyAdminMediaService.set_main_image(property_id, media_id)
    
    @staticmethod
    def get_property_statistics():
        
        from src.real_estate.services.admin.property_statistics_service import PropertyStatisticsService
        stats = PropertyStatisticsService.get_statistics()
        
        recent_properties = Property.objects.for_admin_listing()[:5]
        from src.real_estate.serializers.admin.property_serializer import PropertyAdminListSerializer
        recent_serializer = PropertyAdminListSerializer(recent_properties, many=True)
        stats['recent_properties'] = recent_serializer.data
        
        return stats
    
    @staticmethod
    def get_seo_report():
        cache_key = PropertyCacheKeys.statistics_seo_report()
        cached_report = cache.get(cache_key)
        if cached_report is not None:
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
            cache.set(cache_key, report_data, ADMIN_PROPERTY_SEO_REPORT_TTL)
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
        
        cache.set(cache_key, report_data, ADMIN_PROPERTY_SEO_REPORT_TTL)
        return report_data

class PropertyAdminStatusService:

    _SALE_USAGE_TYPES = {'sale', 'presale', 'exchange', 'mortgage'}
    _RENT_USAGE_TYPES = {'rent'}
    
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
        PropertyCacheManager.invalidate_list()
        PropertyCacheManager.invalidate_statistics()
        
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
        PropertyCacheManager.invalidate_list()
        PropertyCacheManager.invalidate_statistics()
        
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
        PropertyCacheManager.invalidate_statistics()
        
        return property_obj

    @staticmethod
    def finalize_deal(
        property_id,
        *,
        deal_type=None,
        final_amount=None,
        sale_price=None,
        pre_sale_price=None,
        monthly_rent=None,
        rent_amount=None,
        security_deposit=None,
        mortgage_amount=None,
        contract_date=None,
        responsible_agent=None,
        commission=None,
    ):
        try:
            property_obj = Property.objects.select_related('state').get(id=property_id)
        except Property.DoesNotExist:
            raise Property.DoesNotExist(PROPERTY_ERRORS["property_not_found"])

        if property_obj.status in ('sold', 'rented') or property_obj.closed_at:
            raise ValidationError(PROPERTY_ERRORS["already_finalized"])

        if property_obj.status not in ('active', 'pending'):
            raise ValidationError(PROPERTY_ERRORS["invalid_finalize_status"])

        resolved_deal_type = deal_type
        if not resolved_deal_type:
            usage_type = getattr(property_obj.state, 'usage_type', None)
            if usage_type in PropertyAdminStatusService._RENT_USAGE_TYPES:
                resolved_deal_type = 'rent'
            elif usage_type in PropertyAdminStatusService._SALE_USAGE_TYPES:
                resolved_deal_type = 'sale'
            else:
                resolved_deal_type = 'sale'

        final_status = 'rented' if resolved_deal_type == 'rent' else 'sold'

        with transaction.atomic():
            DealsService.process_deal_closure(
                property_obj,
                deal_type=resolved_deal_type,
                closed_status=final_status,
                contract_date=contract_date,
                final_amount=final_amount,
                sale_price=sale_price,
                pre_sale_price=pre_sale_price,
                monthly_rent=monthly_rent,
                rent_amount=rent_amount,
                security_deposit=security_deposit,
                mortgage_amount=mortgage_amount,
                commission=commission,
                responsible_agent=responsible_agent,
            )

        property_obj.refresh_from_db()
        PropertyCacheManager.invalidate_property(property_obj.id)
        PropertyCacheManager.invalidate_list()
        PropertyCacheManager.invalidate_statistics()
        return property_obj

