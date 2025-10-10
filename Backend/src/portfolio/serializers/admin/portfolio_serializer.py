from rest_framework import serializers
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.serializers.admin.category_serializer import PortfolioCategorySimpleAdminSerializer
from src.portfolio.serializers.admin.tag_serializer import PortfolioTagAdminSerializer
from src.portfolio.serializers.admin.option_serializer import PortfolioOptionAdminSerializer
from src.portfolio.media.media_serialize import PortfolioMediaSerializer


class PortfolioAdminListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for admin listing with SEO status"""
    main_image_url = serializers.SerializerMethodField()
    categories_count = serializers.SerializerMethodField()
    tags_count = serializers.SerializerMethodField()
    media_count = serializers.SerializerMethodField()
    seo_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Portfolio
        fields = [
            'id', 'public_id', 'status', 'title', 'slug',
            'short_description', 'is_featured', 'is_public',
            'main_image_url', 'categories_count', 'tags_count', 'media_count',
            'seo_status', 'created_at', 'updated_at'
        ]
    
    def get_main_image_url(self, obj):
        """Get main image efficiently from prefetched data"""
        # استفاده از prefetch_related برای بهینگی
        try:
            for media in obj.portfolio_medias.all():
                if media.is_main_image and media.media:
                    return media.media.file.url
        except Exception:
            pass
        return None
    
    def get_categories_count(self, obj):
        """Get categories count from prefetched data"""
        return obj.categories.count() if hasattr(obj, 'categories') else 0
    
    def get_tags_count(self, obj):
        """Get tags count from prefetched data"""
        return obj.tags.count() if hasattr(obj, 'tags') else 0
    
    def get_media_count(self, obj):
        """Get media count from prefetched data"""
        return len(getattr(obj, 'portfolio_medias', []))
    
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


class PortfolioAdminDetailSerializer(serializers.ModelSerializer):
    """Full serializer for admin detail/edit with complete SEO support"""
    categories = PortfolioCategorySimpleAdminSerializer(many=True, read_only=True)
    tags = PortfolioTagAdminSerializer(many=True, read_only=True)
    options = PortfolioOptionAdminSerializer(many=True, read_only=True, source="portfolio_options")
    media = PortfolioMediaSerializer(many=True, read_only=True, source='portfolio_medias')
    
    # SEO computed fields
    seo_data = serializers.SerializerMethodField()
    seo_preview = serializers.SerializerMethodField()
    seo_completeness = serializers.SerializerMethodField()
    
    class Meta:
        model = Portfolio
        fields = [
            'id', 'public_id', 'status', 'title', 'slug',
            'short_description', 'description',
            'is_featured', 'is_public',
            'categories', 'tags', 'options', 'media',
            # SEO fields from SEOMixin
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'structured_data', 'hreflang_data',
            # SEO computed fields
            'seo_data', 'seo_preview', 'seo_completeness',
            'created_at', 'updated_at',
        ]
    
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
    
    def get_seo_preview(self, obj):
        """SEO preview for admin panel (Google + Facebook)"""
        return {
            'google': {
                'title': obj.get_meta_title()[:60],  # Google limit
                'description': obj.get_meta_description()[:160],  # Google limit
                'url': obj.get_public_url()
            },
            'facebook': {
                'title': obj.get_og_title(),
                'description': obj.get_og_description(),
                'image': obj.og_image.file.url if obj.og_image else None
            }
        }
    
    def get_seo_completeness(self, obj):
        """Calculate SEO completeness percentage"""
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
            'percentage': round((score / len(checks)) * 100, 1)
        }


class PortfolioAdminCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating portfolios with SEO auto-generation"""
    categories_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )
    tags_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )
    
    class Meta:
        model = Portfolio
        fields = [
            'title', 'slug', 'short_description', 'description',
            'status', 'is_featured', 'is_public',
            # SEO fields
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta',
            # Relations
            'categories_ids', 'tags_ids'
        ]
    
    def create(self, validated_data):
        categories_ids = validated_data.pop('categories_ids', [])
        tags_ids = validated_data.pop('tags_ids', [])
        
        # Auto-generate SEO fields if not provided
        if not validated_data.get('meta_title') and validated_data.get('title'):
            validated_data['meta_title'] = validated_data['title'][:70]
            
        if not validated_data.get('meta_description') and validated_data.get('short_description'):
            validated_data['meta_description'] = validated_data['short_description'][:300]
        
        # Create portfolio
        portfolio = Portfolio.objects.create(**validated_data)
        
        # Set relations
        if categories_ids:
            portfolio.categories.set(categories_ids)
        if tags_ids:
            portfolio.tags.set(tags_ids)
            
        return portfolio


class PortfolioAdminUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating portfolios with SEO handling"""
    categories_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )
    tags_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )
    
    class Meta:
        model = Portfolio
        fields = [
            'title', 'slug', 'short_description', 'description',
            'status', 'is_featured', 'is_public',
            # SEO fields
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            # Relations
            'categories_ids', 'tags_ids'
        ]
    
    def update(self, instance, validated_data):
        categories_ids = validated_data.pop('categories_ids', None)
        tags_ids = validated_data.pop('tags_ids', None)
        
        # Auto-generate SEO fields if not provided
        if not validated_data.get('meta_title') and validated_data.get('title'):
            validated_data['meta_title'] = validated_data['title'][:70]
            
        if not validated_data.get('meta_description') and validated_data.get('short_description'):
            validated_data['meta_description'] = validated_data['short_description'][:300]
        
        # Update portfolio fields
        for field, value in validated_data.items():
            setattr(instance, field, value)
        
        instance.save()
        
        # Update relations
        if categories_ids is not None:
            instance.categories.set(categories_ids)
        if tags_ids is not None:
            instance.tags.set(tags_ids)
            
        return instance


# Backward compatibility - rename existing serializer
class PortfolioAdminSerializer(PortfolioAdminDetailSerializer):
    """Backward compatibility alias for existing code"""
    pass