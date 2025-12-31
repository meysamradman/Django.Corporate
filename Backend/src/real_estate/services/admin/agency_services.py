from datetime import datetime
from django.db.models import Count, Prefetch, Q
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from src.real_estate.models.agency import RealEstateAgency
from src.real_estate.models.property import Property
from src.real_estate.models.agent import PropertyAgent
from src.real_estate.messages.messages import AGENCY_ERRORS


class RealEstateAgencyAdminService:
    
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
        
        with transaction.atomic():
            for field, value in validated_data.items():
                setattr(agency, field, value)
            agency.save()
        
        return agency
    
    @staticmethod
    def delete_agency_by_id(agency_id):
        agency = RealEstateAgencyAdminService.get_agency_by_id(agency_id)
        
        if not agency:
            raise RealEstateAgency.DoesNotExist(AGENCY_ERRORS["agency_not_found"])
        
        property_count = agency.properties.count()
        if property_count > 0:
            raise ValidationError(AGENCY_ERRORS["agency_has_properties"].format(count=property_count))
        
        agent_count = agency.agents.count()
        if agent_count > 0:
            raise ValidationError(AGENCY_ERRORS["agency_has_agents"].format(count=agent_count))
        
        with transaction.atomic():
            agency.delete()
    
    @staticmethod
    def bulk_delete_agencies(agency_ids):
        agencies = RealEstateAgency.objects.filter(id__in=agency_ids)
        
        if not agencies.exists():
            raise ValidationError(AGENCY_ERRORS["agencies_not_found"])
        
        with transaction.atomic():
            agency_list = list(agencies)
            for agency in agency_list:
                property_count = agency.properties.count()
                if property_count > 0:
                    raise ValidationError(AGENCY_ERRORS["agency_has_properties"].format(count=property_count))
                agent_count = agency.agents.count()
                if agent_count > 0:
                    raise ValidationError(AGENCY_ERRORS["agency_has_agents"].format(count=agent_count))
            
            deleted_count = agencies.count()
            agencies.delete()
        
        return deleted_count

