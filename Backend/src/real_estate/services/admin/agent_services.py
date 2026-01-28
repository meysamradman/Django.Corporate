from datetime import datetime
from django.db.models import Count, Prefetch, Q
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from src.real_estate.models.agent import PropertyAgent
from src.real_estate.models.property import Property
from src.real_estate.messages.messages import AGENT_ERRORS

class PropertyAgentAdminService:
    
    @staticmethod
    def get_agent_queryset(filters=None, search=None, date_from=None, date_to=None):
        queryset = PropertyAgent.objects.select_related(
            'user',
            'user__admin_profile',
            'user__admin_profile__city',
            'user__admin_profile__province',
            'agency'
        ).annotate(
            property_count=Count('properties', distinct=True)
        )
        
        if filters:
            if filters.get('is_active') is not None:
                queryset = queryset.filter(is_active=filters['is_active'])
            if filters.get('is_verified') is not None:
                queryset = queryset.filter(is_verified=filters['is_verified'])
            if filters.get('agency_id'):
                queryset = queryset.filter(agency_id=filters['agency_id'])
            if filters.get('city_id'):
                queryset = queryset.filter(city_id=filters['city_id'])
        
        if search:
            queryset = queryset.filter(
                Q(user__mobile__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__admin_profile__first_name__icontains=search) |
                Q(user__admin_profile__last_name__icontains=search) |
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
        
        return queryset.order_by('-rating', '-total_sales', 'user__admin_profile__last_name')
    
    @staticmethod
    def get_agent_by_id(agent_id):
        try:
            return PropertyAgent.objects.select_related(
                'user',
                'user__admin_profile',
                'user__admin_profile__city',
                'user__admin_profile__province',
                'agency'
            ).annotate(
                property_count=Count('properties', distinct=True)
            ).get(id=agent_id)
        except PropertyAgent.DoesNotExist:
            return None
    
    @staticmethod
    def create_agent(validated_data, created_by=None):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user_id = validated_data.pop('user_id', None)
        
        if not user_id:
            raise ValidationError(AGENT_ERRORS["agent_create_failed"])
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValidationError("کاربر یافت نشد.")
        
        user_type = getattr(user, 'user_type', None)
        is_staff = getattr(user, 'is_staff', False)
        is_admin_active = getattr(user, 'is_admin_active', False)
        
        if user_type != 'admin' or not is_staff or not is_admin_active:
            raise ValidationError(AGENT_ERRORS["user_must_be_admin"])
        
        if PropertyAgent.objects.filter(user_id=user_id).exists():
            raise ValidationError(AGENT_ERRORS["user_already_has_agent"])
        
        if not validated_data.get('slug'):
            try:
                admin_profile = user.admin_profile
                if admin_profile.first_name and admin_profile.last_name:
                    base_slug = slugify(f"{admin_profile.first_name} {admin_profile.last_name}")
                    slug = base_slug
                    counter = 1
                    while PropertyAgent.objects.filter(slug=slug).exists():
                        slug = f"{base_slug}-{counter}"
                        counter += 1
                    validated_data['slug'] = slug
            except Exception:
                pass
        
        if not validated_data.get('meta_title'):
            try:
                admin_profile = user.admin_profile
                if admin_profile.first_name and admin_profile.last_name:
                    full_name = f"{admin_profile.first_name} {admin_profile.last_name}"
                    validated_data['meta_title'] = f"{full_name} - Real Estate Agent"[:70]
            except Exception:
                pass
        
        if not validated_data.get('meta_description') and validated_data.get('bio'):
            validated_data['meta_description'] = validated_data['bio'][:300]
        
        if not validated_data.get('og_title') and validated_data.get('meta_title'):
            validated_data['og_title'] = validated_data['meta_title']
        
        if not validated_data.get('og_description') and validated_data.get('meta_description'):
            validated_data['og_description'] = validated_data['meta_description']
        
        with transaction.atomic():
            validated_data['user_id'] = user_id
            agent = PropertyAgent.objects.create(**validated_data)
        
        return agent
    
    @staticmethod
    def update_agent_by_id(agent_id, validated_data, updated_by=None):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        agent = PropertyAgentAdminService.get_agent_by_id(agent_id)
        
        if not agent:
            raise PropertyAgent.DoesNotExist(AGENT_ERRORS["agent_not_found"])
        
        user_id = validated_data.pop('user_id', None)
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                raise ValidationError("کاربر یافت نشد.")
            
            user_type = getattr(user, 'user_type', None)
            is_staff = getattr(user, 'is_staff', False)
            is_admin_active = getattr(user, 'is_admin_active', False)
            
            if user_type != 'admin' or not is_staff or not is_admin_active:
                raise ValidationError(AGENT_ERRORS["user_must_be_admin"])
        
        if not validated_data.get('slug'):
            try:
                if user_id:
                    user = User.objects.get(id=user_id)
                else:
                    user = agent.user
                
                admin_profile = user.admin_profile
                if admin_profile.first_name and admin_profile.last_name:
                    base_slug = slugify(f"{admin_profile.first_name} {admin_profile.last_name}")
                    slug = base_slug
                    counter = 1
                    while PropertyAgent.objects.filter(slug=slug).exclude(pk=agent_id).exists():
                        slug = f"{base_slug}-{counter}"
                        counter += 1
                    validated_data['slug'] = slug
            except Exception:
                pass
        
        if not validated_data.get('meta_title'):
            try:
                if user_id:
                    user = User.objects.get(id=user_id)
                else:
                    user = agent.user
                
                admin_profile = user.admin_profile
                if admin_profile.first_name and admin_profile.last_name:
                    full_name = f"{admin_profile.first_name} {admin_profile.last_name}"
                    validated_data['meta_title'] = f"{full_name} - Real Estate Agent"[:70]
                    if not validated_data.get('og_title'):
                        validated_data['og_title'] = validated_data['meta_title']
            except Exception:
                pass
        
        if 'bio' in validated_data:
            if not validated_data.get('meta_description'):
                validated_data['meta_description'] = validated_data['bio'][:300]
                if not validated_data.get('og_description'):
                    validated_data['og_description'] = validated_data['meta_description']
        
        with transaction.atomic():
            if user_id:
                validated_data['user_id'] = user_id
            for field, value in validated_data.items():
                setattr(agent, field, value)
            agent.save()
        
        return agent
    
    @staticmethod
    def delete_agent_by_id(agent_id):
        agent = PropertyAgentAdminService.get_agent_by_id(agent_id)
        
        if not agent:
            raise PropertyAgent.DoesNotExist(AGENT_ERRORS["agent_not_found"])
        
        property_count = agent.properties.count()
        if property_count > 0:
            raise ValidationError(AGENT_ERRORS["agent_has_properties"].format(count=property_count))
        
        with transaction.atomic():
            agent.delete()
    
    @staticmethod
    def bulk_delete_agents(agent_ids):
        agents = PropertyAgent.objects.filter(id__in=agent_ids)
        
        if not agents.exists():
            raise ValidationError(AGENT_ERRORS["agents_not_found"])
        
        with transaction.atomic():
            agent_list = list(agents)
            for agent in agent_list:
                property_count = agent.properties.count()
                if property_count > 0:
                    raise ValidationError(AGENT_ERRORS["agent_has_properties"].format(count=property_count))
            
            deleted_count = agents.count()
            agents.delete()
        
        return deleted_count

