from rest_framework import serializers
from django.core.cache import cache
from django.conf import settings
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.media import PortfolioImage, PortfolioVideo, PortfolioAudio, PortfolioDocument
from src.portfolio.serializers.admin.category_serializer import PortfolioCategorySimpleAdminSerializer
from src.portfolio.serializers.admin.tag_serializer import PortfolioTagAdminSerializer
from src.portfolio.serializers.admin.option_serializer import PortfolioOptionSimpleAdminSerializer
from src.media.serializers.media_serializer import MediaAdminSerializer

# Cache settings values for performance (module-level cache)
_MEDIA_LIST_LIMIT = settings.PORTFOLIO_MEDIA_LIST_LIMIT
_MEDIA_DETAIL_LIMIT = settings.PORTFOLIO_MEDIA_DETAIL_LIMIT


class PortfolioMediaAdminSerializer(serializers.Serializer):
    """Admin serializer for portfolio media"""
    id = serializers.IntegerField(read_only=True)
    public_id = serializers.UUIDField(read_only=True)
    media_detail = MediaAdminSerializer(read_only=True, source='media')
    is_main_image = serializers.BooleanField(read_only=True)
    order = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    def to_representation(self, instance):
        """Convert instance to appropriate serializer based on media type"""
        # Serialize media detail once
        if isinstance(instance, PortfolioImage):
            media_detail = MediaAdminSerializer(instance.image, context=self.context).data
        elif isinstance(instance, PortfolioVideo):
            media_detail = MediaAdminSerializer(instance.video, context=self.context).data
        elif isinstance(instance, PortfolioAudio):
            media_detail = MediaAdminSerializer(instance.audio, context=self.context).data
        elif isinstance(instance, PortfolioDocument):
            media_detail = MediaAdminSerializer(instance.document, context=self.context).data
        else:
            return super().to_representation(instance)
        
        # Return with both media_detail and media (alias for frontend compatibility)
        result = {
            'id': instance.id,
            'public_id': instance.public_id,
            'media_detail': media_detail,
            'media': media_detail,  # Alias for frontend compatibility
            'order': instance.order,
            'created_at': instance.created_at,
            'updated_at': instance.updated_at,
        }
        
        # Add is_main_image only for PortfolioImage
        if isinstance(instance, PortfolioImage):
            result['is_main_image'] = instance.is_main
        
        return result


class PortfolioAdminListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for admin listing with SEO status and detailed media counts"""
    main_image = serializers.SerializerMethodField()
    categories = PortfolioCategorySimpleAdminSerializer(many=True, read_only=True)
    
    # Use annotated fields from queryset - no database queries!
    media_count = serializers.IntegerField(source='total_media_count', read_only=True)
    categories_count = serializers.IntegerField(read_only=True)
    tags_count = serializers.IntegerField(read_only=True)
    
    seo_status = serializers.SerializerMethodField()
    # Add media for display in list view
    media = serializers.SerializerMethodField()
    
    class Meta:
        model = Portfolio
        fields = [
            'id', 'public_id', 'status', 'title', 'slug',
            'short_description', 'description', 'is_featured', 'is_public', 'is_active',
            'main_image', 'categories_count', 'tags_count', 
            'media_count', 'categories', 'seo_status', 'media',
            'created_at', 'updated_at',
            # SEO fields
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'robots_meta', 'canonical_url'
        ]
    
    def get_media(self, obj):
        """Get media for list view - optimized with limit from settings"""
        media_limit = _MEDIA_LIST_LIMIT
        
        # Use queryset slicing for better performance (limit at DB level)
        images = list(obj.images.select_related('image').all()[:media_limit])
        videos = list(obj.videos.select_related('video', 'video__cover_image').all()[:media_limit])
        audios = list(obj.audios.select_related('audio', 'audio__cover_image').all()[:media_limit])
        documents = list(obj.documents.select_related('document', 'document__cover_image').all()[:media_limit])
        
        # Prefetch cover_image URLs efficiently (optimized single pass)
        for item in videos:
            if item.video and item.video.cover_image and item.video.cover_image.file:
                try:
                    _ = item.video.cover_image.file.url
                except:
                    pass
        for item in audios:
            if item.audio and item.audio.cover_image and item.audio.cover_image.file:
                try:
                    _ = item.audio.cover_image.file.url
                except:
                    pass
        for item in documents:
            if item.document and item.document.cover_image and item.document.cover_image.file:
                try:
                    _ = item.document.cover_image.file.url
                except:
                    pass
        
        # Combine and sort (optimized single pass)
        all_media = images + videos + audios + documents
        all_media.sort(key=lambda x: (x.order, x.created_at))
        
        # Serialize with cached serializer instance
        serializer = PortfolioMediaAdminSerializer(context=self.context)
        return [serializer.to_representation(media) for media in all_media]

    def get_main_image(self, obj):
        """Get main image details using model method with caching"""
        return obj.get_main_image_details()
    
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
    main_image = serializers.SerializerMethodField()
    categories = PortfolioCategorySimpleAdminSerializer(many=True, read_only=True)
    tags = PortfolioTagAdminSerializer(many=True, read_only=True)
    options = PortfolioOptionSimpleAdminSerializer(many=True, read_only=True, source="portfolio_options")
    media = serializers.SerializerMethodField()
    portfolio_media = serializers.SerializerMethodField()  # Alias for frontend compatibility
    
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
            'main_image', 'categories', 'tags', 'options', 'media', 'portfolio_media',
            # SEO fields from SEOMixin
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'structured_data', 'hreflang_data',
            # SEO computed fields
            'seo_data', 'seo_preview', 'seo_completeness',
            'created_at', 'updated_at',
        ]
    
    def get_main_image(self, obj):
        """Get main image details using model method with caching"""
        return obj.get_main_image_details()
    
    def get_media(self, obj):
        """Get all media for the portfolio with optimized queries"""
        media_limit = _MEDIA_DETAIL_LIMIT
        
        # Build querysets with select_related for optimal performance
        images_qs = obj.images.select_related('image').all()
        videos_qs = obj.videos.select_related('video', 'video__cover_image').all()
        audios_qs = obj.audios.select_related('audio', 'audio__cover_image').all()
        documents_qs = obj.documents.select_related('document', 'document__cover_image').all()
        
        # Apply limit at DB level if set (0 = unlimited)
        if media_limit > 0:
            images = list(images_qs[:media_limit])
            videos = list(videos_qs[:media_limit])
            audios = list(audios_qs[:media_limit])
            documents = list(documents_qs[:media_limit])
        else:
            images = list(images_qs)
            videos = list(videos_qs)
            audios = list(audios_qs)
            documents = list(documents_qs)
        
        # Prefetch cover_image URLs efficiently (optimized direct access)
        for item in videos:
            if item.video and item.video.cover_image and item.video.cover_image.file:
                try:
                    _ = item.video.cover_image.file.url
                except:
                    pass
        for item in audios:
            if item.audio and item.audio.cover_image and item.audio.cover_image.file:
                try:
                    _ = item.audio.cover_image.file.url
                except:
                    pass
        for item in documents:
            if item.document and item.document.cover_image and item.document.cover_image.file:
                try:
                    _ = item.document.cover_image.file.url
                except:
                    pass
        
        # Combine and sort (single pass)
        all_media = images + videos + audios + documents
        all_media.sort(key=lambda x: (x.order, x.created_at))
        
        # Serialize with cached serializer
        serializer = PortfolioMediaAdminSerializer(context=self.context)
        return [serializer.to_representation(media) for media in all_media]
    
    def get_portfolio_media(self, obj):
        """Alias for media field - frontend compatibility"""
        return self.get_media(obj)
    
    def get_seo_data(self, obj):
        """Get comprehensive SEO data using SEOMixin methods with caching"""
        # Try to get from cache first
        cache_key = f"portfolio_seo_data_{obj.pk}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
        
        seo_data = {
            'meta_title': obj.get_meta_title(),
            'meta_description': obj.get_meta_description(),
            'og_title': obj.get_og_title(),
            'og_description': obj.get_og_description(),
            'canonical_url': obj.get_canonical_url(),
            'structured_data': obj.generate_structured_data(),
        }
        
        # Cache for 30 minutes
        cache.set(cache_key, seo_data, 1800)
        return seo_data
    
    def get_seo_preview(self, obj):
        """SEO preview for admin panel (Google + Facebook) with caching"""
        # Try to get from cache first
        cache_key = f"portfolio_seo_preview_{obj.pk}"
        cached_preview = cache.get(cache_key)
        if cached_preview:
            return cached_preview
        
        # Generate preview data
        preview_data = {
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
        
        # Cache for 30 minutes
        cache.set(cache_key, preview_data, 1800)
        return preview_data
    
    def get_seo_completeness(self, obj):
        """Calculate SEO completeness percentage with caching"""
        # Try to get from cache first
        cache_key = f"portfolio_seo_completeness_{obj.pk}"
        cached_completeness = cache.get(cache_key)
        if cached_completeness:
            return cached_completeness
        
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
        completeness_data = {
            'score': score,
            'total': len(checks),
            'percentage': round((score / len(checks)) * 100, 1)
        }
        
        # Cache for 30 minutes
        cache.set(cache_key, completeness_data, 1800)
        return completeness_data


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
    options_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )
    # Media files - we'll handle this in the view, not in the serializer
    # This is just to document that media files can be sent
    media_files = serializers.ListField(
        child=serializers.FileField(),
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
            'categories_ids', 'tags_ids', 'options_ids',
            # Media
            'media_files'
        ]
    
    def create(self, validated_data):
        categories_ids = validated_data.pop('categories_ids', [])
        tags_ids = validated_data.pop('tags_ids', [])
        options_ids = validated_data.pop('options_ids', [])
        # Remove media_files from validated_data as we handle it in the view
        media_files = validated_data.pop('media_files', [])
        
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
        if options_ids:
            portfolio.options.set(options_ids)
            
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
    options_ids = serializers.ListField(
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
            'categories_ids', 'tags_ids', 'options_ids'
        ]
    
    def update(self, instance, validated_data):
        categories_ids = validated_data.pop('categories_ids', None)
        tags_ids = validated_data.pop('tags_ids', None)
        options_ids = validated_data.pop('options_ids', None)
        
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
        if options_ids is not None:
            instance.options.set(options_ids)
            
        return instance


# Backward compatibility - rename existing serializer
class PortfolioAdminSerializer(PortfolioAdminDetailSerializer):
    """Backward compatibility alias for existing code"""
    pass