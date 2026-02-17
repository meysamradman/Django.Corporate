from datetime import datetime
from django.db.models import Count, Prefetch, Q
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from src.real_estate.models.agency import RealEstateAgency
from src.real_estate.models.agency_social_media import RealEstateAgencySocialMedia
from src.real_estate.models.property import Property
from src.real_estate.models.agent import PropertyAgent
from src.real_estate.messages.messages import AGENCY_ERRORS

class RealEstateAgencyAdminService:
    @staticmethod
    def _sync_social_media(agency, social_media_items):
        if social_media_items is None:
            return

        if not isinstance(social_media_items, list):
            raise ValidationError({'social_media': AGENCY_ERRORS.get("agency_update_failed")})

        existing_items = {item.id: item for item in agency.social_media.all()}
        kept_ids = []

        for index, item in enumerate(social_media_items):
            if not isinstance(item, dict):
                continue

            name = (item.get('name') or '').strip()
            url = (item.get('url') or '').strip()

            if not name or not url:
                continue

            order = item.get('order')
            if order is None:
                order = index

            icon_id = item.get('icon', item.get('icon_id'))
            icon_id = icon_id or None

            social_id = item.get('id')
            if social_id in existing_items:
                social_obj = existing_items[social_id]
                social_obj.name = name
                social_obj.url = url
                social_obj.icon_id = icon_id
                social_obj.order = order
                social_obj.is_active = True
                social_obj.save(update_fields=['name', 'url', 'icon', 'order', 'is_active', 'updated_at'])
                kept_ids.append(social_obj.id)
            else:
                social_obj = RealEstateAgencySocialMedia.objects.create(
                    agency=agency,
                    name=name,
                    url=url,
                    icon_id=icon_id,
                    order=order,
                )
                kept_ids.append(social_obj.id)

        agency.social_media.exclude(id__in=kept_ids).delete()
    
    @staticmethod
    def get_agency_queryset(filters=None, search=None, date_from=None, date_to=None):
        queryset = RealEstateAgency.objects.select_related(
            'province',
            'city',
            'profile_picture'
        ).annotate(
            property_count=Count('properties', distinct=True),
            agent_count=Count('agents', distinct=True)
        )
        
        if filters:
            if filters.get('is_active') is not None:
                queryset = queryset.filter(is_active=filters['is_active'])
            if filters.get('province_id'):
                queryset = queryset.filter(province_id=filters['province_id'])
            if filters.get('city_id'):
                queryset = queryset.filter(city_id=filters['city_id'])
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(phone__icontains=search) |
                Q(email__icontains=search) |
                Q(license_number__icontains=search)
            )
        
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
        
        return queryset.order_by('-rating', 'name')
    
    @staticmethod
    def get_agency_by_id(agency_id):
        try:
            return RealEstateAgency.objects.select_related(
                'province',
                'city',
                'profile_picture'
            ).annotate(
                property_count=Count('properties', distinct=True),
                agent_count=Count('agents', distinct=True)
            ).get(id=agency_id)
        except RealEstateAgency.DoesNotExist:
            return None
    
    @staticmethod
    def create_agency(validated_data, created_by=None):
        social_media_items = validated_data.pop('social_media', None)

        if not validated_data.get('slug') and validated_data.get('name'):
            base_slug = slugify(validated_data['name'])
            slug = base_slug
            counter = 1
            while RealEstateAgency.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug
        
        if not validated_data.get('meta_title') and validated_data.get('name'):
            validated_data['meta_title'] = validated_data['name'][:70]
        
        if not validated_data.get('meta_description') and validated_data.get('description'):
            validated_data['meta_description'] = validated_data['description'][:300]
        
        if not validated_data.get('og_title') and validated_data.get('meta_title'):
            validated_data['og_title'] = validated_data['meta_title']
        
        if not validated_data.get('og_description') and validated_data.get('meta_description'):
            validated_data['og_description'] = validated_data['meta_description']
        
        with transaction.atomic():
            agency = RealEstateAgency.objects.create(**validated_data)
            RealEstateAgencyAdminService._sync_social_media(agency, social_media_items)
        
        return agency
    
    @staticmethod
    def update_agency_by_id(agency_id, validated_data, updated_by=None):
        agency = RealEstateAgencyAdminService.get_agency_by_id(agency_id)
        
        if not agency:
            raise RealEstateAgency.DoesNotExist(AGENCY_ERRORS["agency_not_found"])
        
        if 'name' in validated_data and not validated_data.get('slug'):
            base_slug = slugify(validated_data['name'])
            slug = base_slug
            counter = 1
            while RealEstateAgency.objects.filter(slug=slug).exclude(pk=agency_id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug
        
        if 'name' in validated_data:
            if not validated_data.get('meta_title'):
                validated_data['meta_title'] = validated_data['name'][:70]
                if not validated_data.get('og_title'):
                    validated_data['og_title'] = validated_data['meta_title']
        
        if 'description' in validated_data:
            if not validated_data.get('meta_description'):
                validated_data['meta_description'] = validated_data['description'][:300]
                if not validated_data.get('og_description'):
                    validated_data['og_description'] = validated_data['meta_description']
        
        social_media_items = validated_data.pop('social_media', None)

        with transaction.atomic():
            for field, value in validated_data.items():
                setattr(agency, field, value)
            agency.save()
            RealEstateAgencyAdminService._sync_social_media(agency, social_media_items)
        
        return agency
    
    @staticmethod
    def delete_agency_by_id(agency_id):
        agency = RealEstateAgencyAdminService.get_agency_by_id(agency_id)
        
        if not agency:
            raise RealEstateAgency.DoesNotExist(AGENCY_ERRORS["agency_not_found"])
        
        property_count = agency.properties.count()
        if property_count > 0:
            raise ValidationError({
                'non_field_errors': [
                    AGENCY_ERRORS["agency_has_properties"].format(count=property_count)
                ]
            })
        
        agent_count = agency.agents.count()
        if agent_count > 0:
            raise ValidationError({
                'non_field_errors': [
                    AGENCY_ERRORS["agency_has_agents"].format(count=agent_count)
                ]
            })
        
        with transaction.atomic():
            agency.delete()
    
    @staticmethod
    def bulk_delete_agencies(agency_ids):
        agencies = RealEstateAgency.objects.filter(id__in=agency_ids)
        
        if not agencies.exists():
            raise ValidationError({'ids': [AGENCY_ERRORS["agencies_not_found"]]})
        
        with transaction.atomic():
            agency_list = list(agencies)
            for agency in agency_list:
                property_count = agency.properties.count()
                if property_count > 0:
                    raise ValidationError({
                        'non_field_errors': [
                            AGENCY_ERRORS["agency_has_properties"].format(count=property_count)
                        ]
                    })
                agent_count = agency.agents.count()
                if agent_count > 0:
                    raise ValidationError({
                        'non_field_errors': [
                            AGENCY_ERRORS["agency_has_agents"].format(count=agent_count)
                        ]
                    })
            
            deleted_count = agencies.count()
            agencies.delete()
        
        return deleted_count

