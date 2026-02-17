from rest_framework import serializers

class MainImageMixin:
    
    def get_main_image_url(self, obj):
        try:
            if hasattr(obj, 'main_image_media') and obj.main_image_media:
                url = obj.main_image_media[0].media.file.url if obj.main_image_media[0].media else ""
            else:
                for media in obj.portfolio_medias.all():
                    if media.is_main_image and media.media:
                        url = media.media.file.url
                        break
                else:
                    url = ""
        except Exception:
            url = ""

        return url or None

class SEODataMixin:
    
    def get_seo_data(self, obj):
        return {
            'meta_title': obj.get_meta_title(),
            'meta_description': obj.get_meta_description(),
            'og_title': obj.get_og_title(),
            'og_description': obj.get_og_description(),
            'canonical_url': obj.get_canonical_url(),
            'structured_data': obj.generate_structured_data(),
        }

class CountsMixin:
    
    def get_categories_count(self, obj):
        return getattr(obj, 'categories_count', obj.categories.count())
    
    def get_tags_count(self, obj):
        return getattr(obj, 'tags_count', obj.tags.count())
    
    def get_media_count(self, obj):
        return getattr(obj, 'media_count', 
                      len(getattr(obj, 'portfolio_medias', [])) or 
                      obj.portfolio_medias.count())

class SEOStatusMixin:
    
    def get_seo_status(self, obj):
        has_meta_title = bool(obj.meta_title)
        has_meta_description = bool(obj.meta_description)
        has_og_image = bool(obj.og_image)
        
        score = sum([has_meta_title, has_meta_description, has_og_image])
        return {
            'score': score,
            'total': 3,
            'status': 'complete' if score == 3 else 'incomplete' if score > 0 else 'missing'
        }

class SEOCompletenessMixin:
    
    def get_seo_completeness(self, obj):
        checks = [
            bool(obj.meta_title),
            bool(obj.meta_description),
            bool(obj.og_title),
            bool(obj.og_description),
            bool(obj.og_image),
            bool(obj.canonical_url),
            len(obj.title or '') <= 60,
            len(obj.get_meta_description()) >= 120,
            len(obj.get_meta_description()) <= 160,
        ]
        
        score = sum(checks)
        return {
            'score': score,
            'total': len(checks),
            'percentage': round((score / len(checks)) * 100, 1),
            'details': {
                'has_meta_title': checks[0],
                'has_meta_description': checks[1],
                'has_og_title': checks[2],
                'has_og_description': checks[3],
                'has_og_image': checks[4],
                'has_canonical_url': checks[5],
                'good_title_length': checks[6],
                'good_description_min': checks[7],
                'good_description_max': checks[8],
            }
        }

class SEOPreviewMixin:
    
    def get_seo_preview(self, obj):
        return {
            'google': {
                'title': obj.get_meta_title()[:60],
                'description': obj.get_meta_description()[:160],
                'url': obj.get_public_url()
            },
            'facebook': {
                'title': obj.get_og_title()[:95],
                'description': obj.get_og_description()[:297],
                'image': obj.og_image.file.url if obj.og_image else None
            },
            'twitter': {
                'title': obj.get_og_title()[:70],
                'description': obj.get_og_description()[:200],
                'image': obj.og_image.file.url if obj.og_image else None
            }
        }
