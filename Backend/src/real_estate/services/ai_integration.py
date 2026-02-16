from typing import Dict, Any
from django.db import transaction
from django.utils.text import slugify

from src.real_estate.models import Property, PropertyType, PropertyState
from src.core.models import Province, City
from src.real_estate.utils.cache import PropertyCacheManager
from src.real_estate.messages.messages import PROPERTY_ERRORS
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS

def save_ai_content_to_real_estate(
    content_data: Dict[str, Any],
    destination_data: Dict[str, Any],
    admin
) -> Dict[str, Any]:
    
    try:
        with transaction.atomic():
            base_slug = content_data.get('slug', slugify(content_data['title']))
            slug = base_slug
            counter = 1
            while Property.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            property_type_id = destination_data.get('property_type_id')
            if property_type_id:
                property_type = PropertyType.objects.filter(id=property_type_id).first()
            else:
                property_type = PropertyType.objects.filter(is_active=True).first()
            
            state_id = destination_data.get('state_id')
            if state_id:
                state = PropertyState.objects.filter(id=state_id).first()
            else:
                state = PropertyState.objects.filter(is_active=True).first()

            province_id = destination_data.get('province_id')
            city_id = destination_data.get('city_id')
            
            if province_id:
                province = Province.objects.filter(id=province_id).first()
            else:
                province = Province.objects.first()
                
            if city_id:
                    city = City.objects.filter(id=city_id).first()
            else:
                    if province:
                        city = City.objects.filter(province=province).first()
                    else:
                        city = City.objects.first()
                        if city:
                            province = city.province

            if not all([property_type, state, province, city]):
                raise ValueError(PROPERTY_ERRORS['property_required_defaults_missing'])

            property_obj = Property.objects.create(
                title=content_data['title'],
                slug=slug,
                short_description=content_data.get('meta_description', '')[:300],
                description=content_data['content'],
                status=destination_data.get('status', 'active'), # Default to active/draft based on logic
                is_featured=destination_data.get('is_featured', False),
                is_public=destination_data.get('is_public', False), # Default False for AI generated
                is_published=destination_data.get('is_published', False),
                meta_title=content_data.get('meta_title', content_data['title'])[:60],
                meta_description=content_data.get('meta_description', '')[:160],
                
                property_type=property_type,
                state=state,
                province=province,
                city=city,
                
                address=destination_data.get('address', 'آدرس ثبت نشده'),
                bedrooms=1,
                bathrooms=1,
                kitchens=1,
                living_rooms=1,
                parking_spaces=0,
                storage_rooms=0,
            )

            PropertyCacheManager.invalidate_property(property_obj.id)
            PropertyCacheManager.invalidate_list()

            return {
                'saved': True,
                'destination': 'real_estate',
                'id': property_obj.id,
                'slug': property_obj.slug,
                'url': property_obj.get_public_url(),
                'message': AI_SUCCESS['content_saved_to_real_estate']
            }
    
    except Exception as e:
        raise ValueError(AI_ERRORS['content_save_failed'].format(destination='real_estate', error=str(e)))
