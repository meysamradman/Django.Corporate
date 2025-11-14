"""
Blog Serializer Mixins
Remove code duplication and provide reusable components
"""
from rest_framework import serializers
from django.core.cache import cache


class MainImageMixin:
    """Mixin for getting main image URL efficiently with caching"""
    
    def get_main_image_url(self, obj):
        """Get main image with caching for performance"""
        cache_key = f"blog_main_image_{obj.id}"
        url = cache.get(cache_key)
        
        if url is None:
            try:
                # استفاده از prefetched data اگر موجود باشد
                if hasattr(obj, 'main_image_media') and obj.main_image_media:
                    url = obj.main_image_media[0].media.file.url if obj.main_image_media[0].media else ""
                else:
                    # Fallback to database query
                    for media in obj.blog_medias.all():
                        if media.is_main_image and media.media:
                            url = media.media.file.url
                            break
                    else:
                        url = ""
                
                # Cache for 30 minutes
                cache.set(cache_key, url, 1800)
            except Exception:
                url = ""
        
        return url or None


class SEODataMixin:
    """Mixin for SEO data handling"""
    
    def get_seo_data(self, obj):
        """Get comprehensive SEO data using SEOMixin methods"""
        return {
            'meta_title': obj.get_meta_title(),
            'meta_description': obj.get_meta_description(),
            'og_title': obj.get_og_title(),
            'og_description': obj.get_og_description(),
            'canonical_url': obj.get_canonical_url(),
            'structured_data': obj.generate_structured_data(),
        }


class CountsMixin:
    """Mixin for count fields with annotation fallback"""
    
    def get_categories_count(self, obj):
        """Get categories count from annotation or database"""
        return getattr(obj, 'categories_count', obj.categories.count())
    
    def get_tags_count(self, obj):
        """Get tags count from annotation or database"""
        return getattr(obj, 'tags_count', obj.tags.count())
    
    def get_media_count(self, obj):
        """Get media count from annotation or database"""
        return getattr(obj, 'media_count', 
                      len(getattr(obj, 'blog_medias', [])) or 
                      obj.blog_medias.count())


class SEOStatusMixin:
    """Mixin for SEO status calculation"""
    
    def get_seo_status(self, obj):
        """Check SEO completeness status"""
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
    """Mixin for detailed SEO completeness analysis"""
    
    def get_seo_completeness(self, obj):
        """Calculate SEO completeness percentage with detailed checks"""
        checks = [
            bool(obj.meta_title),                           # Meta title exists
            bool(obj.meta_description),                     # Meta description exists
            bool(obj.og_title),                            # OG title exists
            bool(obj.og_description),                      # OG description exists
            bool(obj.og_image),                            # OG image exists
            bool(obj.canonical_url),                       # Canonical URL exists
            len(obj.title or '') <= 60,                   # Good title length
            len(obj.get_meta_description()) >= 120,       # Good description length
            len(obj.get_meta_description()) <= 160,       # Not too long description
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
    """Mixin for SEO preview generation"""
    
    def get_seo_preview(self, obj):
        """SEO preview for admin panel (Google + Facebook + Twitter)"""
        return {
            'google': {
                'title': obj.get_meta_title()[:60],  # Google limit
                'description': obj.get_meta_description()[:160],  # Google limit
                'url': obj.get_public_url()
            },
            'facebook': {
                'title': obj.get_og_title()[:95],  # Facebook limit
                'description': obj.get_og_description()[:297],  # Facebook limit
                'image': obj.og_image.file.url if obj.og_image else None
            },
            'twitter': {
                'title': obj.get_og_title()[:70],  # Twitter limit
                'description': obj.get_og_description()[:200],  # Twitter limit
                'image': obj.og_image.file.url if obj.og_image else None
            }
        }


class RelationsMixin:
    """Mixin for handling ManyToMany relations in create/update"""
    
    def handle_relations(self, instance, validated_data):
        """Handle categories and tags relations"""
        categories_ids = validated_data.pop('categories_ids', None)
        tags_ids = validated_data.pop('tags_ids', None)
        
        if categories_ids is not None:
            instance.categories.set(categories_ids)
        if tags_ids is not None:
            instance.tags.set(tags_ids)
        
        return instance


class AutoSEOMixin:
    """Mixin for automatic SEO generation"""
    
    def auto_generate_seo(self, validated_data):
        """Auto-generate SEO fields if not provided"""
        # Meta title from title
        if not validated_data.get('meta_title') and validated_data.get('title'):
            validated_data['meta_title'] = validated_data['title'][:70]
            
        # Meta description from short_description
        if not validated_data.get('meta_description') and validated_data.get('short_description'):
            validated_data['meta_description'] = validated_data['short_description'][:300]
        
        # OG title from meta_title or title
        if not validated_data.get('og_title'):
            validated_data['og_title'] = (
                validated_data.get('meta_title') or 
                validated_data.get('title', '')
            )[:70]
            
        # OG description from meta_description or short_description
        if not validated_data.get('og_description'):
            validated_data['og_description'] = (
                validated_data.get('meta_description') or 
                validated_data.get('short_description', '')
            )[:300]
        
        # Canonical URL from slug
        if not validated_data.get('canonical_url') and validated_data.get('slug'):
            validated_data['canonical_url'] = f"/blog/{validated_data['slug']}/"
        
        return validated_data
