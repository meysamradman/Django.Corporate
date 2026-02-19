from datetime import datetime
from django.db.models import Count, Q, OuterRef, Subquery, IntegerField
from django.db.models.functions import Coalesce
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from src.real_estate.models.agent import PropertyAgent
from src.real_estate.models.agent_social_media import PropertyAgentSocialMedia
from src.real_estate.models.property import Property
from src.real_estate.messages.messages import AGENT_ERRORS, AGENT_DEFAULTS

class PropertyAgentAdminService:
    @staticmethod
    def _with_property_count_subquery(queryset):
        property_count_subquery = Property.objects.filter(
            agent_id=OuterRef('pk')
        ).values('agent_id').annotate(
            c=Count('id')
        ).values('c')[:1]

        return queryset.annotate(
            property_count=Coalesce(
                Subquery(property_count_subquery, output_field=IntegerField()),
                0,
                output_field=IntegerField(),
            )
        )

    @staticmethod
    def _sync_social_media(agent, social_media_items):
        if social_media_items is None:
            return

        if not isinstance(social_media_items, list):
            raise ValidationError({'social_media': AGENT_ERRORS.get("agent_update_failed")})

        existing_items = {item.id: item for item in agent.social_media.all()}
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
                social_obj = PropertyAgentSocialMedia.objects.create(
                    agent=agent,
                    name=name,
                    url=url,
                    icon_id=icon_id,
                    order=order,
                )
                kept_ids.append(social_obj.id)

        agent.social_media.exclude(id__in=kept_ids).delete()
    
    @staticmethod
    def get_agent_queryset(filters=None, search=None, date_from=None, date_to=None):
        queryset = PropertyAgent.objects.select_related(
            'user',
            'user__admin_profile',
            'user__admin_profile__profile_picture',
            'profile_picture',
            'user__admin_profile__city',
            'user__admin_profile__province',
            'agency'
        )
        queryset = PropertyAgentAdminService._with_property_count_subquery(queryset)
        
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
            queryset = PropertyAgent.objects.select_related(
                'user',
                'user__admin_profile',
                'user__admin_profile__profile_picture',
                'profile_picture',
                'user__admin_profile__city',
                'user__admin_profile__province',
                'agency'
            )
            queryset = PropertyAgentAdminService._with_property_count_subquery(queryset)
            return queryset.get(id=agent_id)
        except PropertyAgent.DoesNotExist:
            return None
    
    @staticmethod
    def create_agent(validated_data, created_by=None):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user_id = validated_data.pop('user_id', None)
        
        if not user_id:
            raise ValidationError({'user_id': AGENT_ERRORS["user_id_required"]})
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValidationError({'user_id': AGENT_ERRORS["user_not_found"]})
        
        user_type = getattr(user, 'user_type', None)
        is_staff = getattr(user, 'is_staff', False)
        is_admin_active = getattr(user, 'is_admin_active', False)
        
        if user_type != 'admin' or not is_staff or not is_admin_active:
            raise ValidationError({'user_id': AGENT_ERRORS["user_must_be_admin"]})
        
        if PropertyAgent.objects.filter(user_id=user_id).exists():
            raise ValidationError({'user_id': AGENT_ERRORS["user_already_has_agent"]})
        
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
                    validated_data['meta_title'] = f"{full_name}{AGENT_DEFAULTS['meta_title_suffix']}"[:70]
            except Exception:
                pass
        
        if not validated_data.get('meta_description') and validated_data.get('bio'):
            validated_data['meta_description'] = validated_data['bio'][:300]
        
        if not validated_data.get('og_title') and validated_data.get('meta_title'):
            validated_data['og_title'] = validated_data['meta_title']
        
        if not validated_data.get('og_description') and validated_data.get('meta_description'):
            validated_data['og_description'] = validated_data['meta_description']
        
        social_media_items = validated_data.pop('social_media', None)

        with transaction.atomic():
            validated_data['user_id'] = user_id
            agent = PropertyAgent.objects.create(**validated_data)
            PropertyAgentAdminService._sync_social_media(agent, social_media_items)
        
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
                raise ValidationError({'user_id': AGENT_ERRORS["user_not_found"]})
            
            user_type = getattr(user, 'user_type', None)
            is_staff = getattr(user, 'is_staff', False)
            is_admin_active = getattr(user, 'is_admin_active', False)
            
            if user_type != 'admin' or not is_staff or not is_admin_active:
                raise ValidationError({'user_id': AGENT_ERRORS["user_must_be_admin"]})
        
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
                    validated_data['meta_title'] = f"{full_name}{AGENT_DEFAULTS['meta_title_suffix']}"[:70]
                    if not validated_data.get('og_title'):
                        validated_data['og_title'] = validated_data['meta_title']
            except Exception:
                pass
        
        if 'bio' in validated_data:
            if not validated_data.get('meta_description'):
                validated_data['meta_description'] = validated_data['bio'][:300]
                if not validated_data.get('og_description'):
                    validated_data['og_description'] = validated_data['meta_description']
        
        social_media_items = validated_data.pop('social_media', None)

        with transaction.atomic():
            if user_id:
                validated_data['user_id'] = user_id
            for field, value in validated_data.items():
                setattr(agent, field, value)
            agent.save()
            PropertyAgentAdminService._sync_social_media(agent, social_media_items)
        
        return agent
    
    @staticmethod
    def delete_agent_by_id(agent_id):
        agent = PropertyAgentAdminService.get_agent_by_id(agent_id)
        
        if not agent:
            raise PropertyAgent.DoesNotExist(AGENT_ERRORS["agent_not_found"])
        
        property_count = agent.properties.count()
        if property_count > 0:
            raise ValidationError({
                'non_field_errors': [
                    AGENT_ERRORS["agent_has_properties"].format(count=property_count)
                ]
            })
        
        with transaction.atomic():
            agent.delete()
    
    @staticmethod
    def bulk_delete_agents(agent_ids):
        agents = PropertyAgent.objects.filter(id__in=agent_ids)
        
        if not agents.exists():
            raise ValidationError({'ids': [AGENT_ERRORS["agents_not_found"]]})
        
        with transaction.atomic():
            agent_list = list(agents)
            for agent in agent_list:
                property_count = agent.properties.count()
                if property_count > 0:
                    raise ValidationError({
                        'non_field_errors': [
                            AGENT_ERRORS["agent_has_properties"].format(count=property_count)
                        ]
                    })
            
            deleted_count = agents.count()
            agents.delete()
        
        return deleted_count

