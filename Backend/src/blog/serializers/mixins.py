from rest_framework import serializers
from django.core.cache import cache
from src.blog.utils.cache import BlogCacheKeys


class MainImageMixin:
    
    def get_main_image_url(self, obj):
        cache_key = BlogCacheKeys.main_image(obj.id)
        url = cache.get(cache_key)
        
        if url is None:
            try:
                if hasattr(obj, 'main_image_media') and obj.main_image_media:
                    url = obj.main_image_media[0].media.file.url if obj.main_image_media[0].media else ""
                else:
                    for media in obj.blog_medias.all():
                        if media.is_main_image and media.media:
                            url = media.media.file.url
                            break
                    else:
                        url = ""
                
                cache.set(cache_key, url, 1800)
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
                      len(getattr(obj, 'blog_medias', [])) or 
                      obj.blog_medias.count())


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


class RelationsMixin:
    
    def handle_relations(self, instance, validated_data):
        categories_ids = validated_data.pop('categories_ids', None)
        tags_ids = validated_data.pop('tags_ids', None)
        
        if categories_ids is not None:
            instance.categories.set(categories_ids)
        if tags_ids is not None:
            instance.tags.set(tags_ids)
        
        return instance


class AutoSEOMixin:
    
    def auto_generate_seo(self, validated_data):
        if not validated_data.get('meta_title') and validated_data.get('title'):
            validated_data['meta_title'] = validated_data['title'][:70]
            
        if not validated_data.get('meta_description') and validated_data.get('short_description'):
            validated_data['meta_description'] = validated_data['short_description'][:300]
        
        if not validated_data.get('og_title'):
            validated_data['og_title'] = (
                validated_data.get('meta_title') or 
                validated_data.get('title', '')
            )[:70]
            
        if not validated_data.get('og_description'):
            validated_data['og_description'] = (
                validated_data.get('meta_description') or 
                validated_data.get('short_description', '')
            )[:300]
        
        if not validated_data.get('canonical_url') and validated_data.get('slug'):
            validated_data['canonical_url'] = f"/blog/{validated_data['slug']}/"
        
        return validated_data
