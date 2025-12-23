from src.real_estate.models.property import Property
from src.real_estate.messages.messages import PROPERTY_ERRORS


class PropertyAdminSEOService:
    
    @staticmethod
    def auto_generate_seo(property_id):
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            raise Property.DoesNotExist(PROPERTY_ERRORS["property_not_found"])
        
        updates = {}
        
        if not property_obj.meta_title and property_obj.title:
            updates['meta_title'] = property_obj.title[:70]
        
        if not property_obj.meta_description:
            if property_obj.short_description:
                updates['meta_description'] = property_obj.short_description[:300]
            elif property_obj.description:
                updates['meta_description'] = property_obj.description[:300]
        
        if not property_obj.og_title and (property_obj.meta_title or property_obj.title):
            updates['og_title'] = (property_obj.meta_title or property_obj.title)[:70]
        
        if not property_obj.og_description and (property_obj.meta_description or property_obj.short_description or property_obj.description):
            updates['og_description'] = (property_obj.meta_description or property_obj.short_description or property_obj.description)[:300]
        
        if property_obj.canonical_url and not property_obj.canonical_url.startswith(('http://', 'https://')):
            updates['canonical_url'] = None
        
        if not property_obj.og_image:
            main_image = property_obj.get_main_image()
            if main_image:
                updates['og_image'] = main_image
        
        if updates:
            for field, value in updates.items():
                setattr(property_obj, field, value)
            property_obj.save()
        
        return property_obj
    
    @staticmethod
    def validate_seo_data(property_id):
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            raise Property.DoesNotExist(PROPERTY_ERRORS["property_not_found"])
        
        suggestions = []
        
        if property_obj.meta_title:
            if len(property_obj.meta_title) > 60:
                suggestions.append("Meta title should be under 60 characters for optimal display")
        
        if property_obj.meta_description:
            if len(property_obj.meta_description) < 120:
                suggestions.append("Meta description should be at least 120 characters")
            elif len(property_obj.meta_description) > 160:
                suggestions.append("Meta description should be under 160 characters")
        
        if not property_obj.og_image:
            suggestions.append("Adding an OG image improves social media sharing")
        
        return {
            'is_valid': len(suggestions) == 0,
            'suggestions': suggestions,
        }

