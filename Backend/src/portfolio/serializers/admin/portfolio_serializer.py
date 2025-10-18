from rest_framework import serializers
from django.core.cache import cache
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.media import PortfolioImage, PortfolioVideo, PortfolioAudio, PortfolioDocument
from src.portfolio.serializers.admin.category_serializer import PortfolioCategorySimpleAdminSerializer
from src.portfolio.serializers.admin.tag_serializer import PortfolioTagAdminSerializer
from src.portfolio.serializers.admin.option_serializer import PortfolioOptionAdminSerializer
from src.media.serializers.media_serializer import MediaAdminSerializer


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
        # Determine media type based on instance class
        if isinstance(instance, PortfolioImage):
            return {
                'id': instance.id,
                'public_id': instance.public_id,
                'media_detail': MediaAdminSerializer(instance.image, context=self.context).data,
                'is_main_image': instance.is_main,
                'order': instance.order,
                'created_at': instance.created_at,
                'updated_at': instance.updated_at,
            }
        elif isinstance(instance, PortfolioVideo):
            return {
                'id': instance.id,
                'public_id': instance.public_id,
                'media_detail': MediaAdminSerializer(instance.video, context=self.context).data,
                'order': instance.order,
                'created_at': instance.created_at,
                'updated_at': instance.updated_at,
            }
        elif isinstance(instance, PortfolioAudio):
            return {
                'id': instance.id,
                'public_id': instance.public_id,
                'media_detail': MediaAdminSerializer(instance.audio, context=self.context).data,
                'order': instance.order,
                'created_at': instance.created_at,
                'updated_at': instance.updated_at,
            }
        elif isinstance(instance, PortfolioDocument):
            return {
                'id': instance.id,
                'public_id': instance.public_id,
                'media_detail': MediaAdminSerializer(instance.document, context=self.context).data,
                'order': instance.order,
                'created_at': instance.created_at,
                'updated_at': instance.updated_at,
            }
        return super().to_representation(instance)


class PortfolioAdminListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for admin listing with SEO status and detailed media counts"""
    main_image = serializers.SerializerMethodField()
    categories_count = serializers.SerializerMethodField()
    tags_count = serializers.SerializerMethodField()
    media_count = serializers.SerializerMethodField()
    seo_status = serializers.SerializerMethodField()
    # Add media for display in list view
    media = serializers.SerializerMethodField()
    # Add categories for display in list view
    categories = PortfolioCategorySimpleAdminSerializer(many=True, read_only=True)
    
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
        """Get all media for the portfolio with optimized queries for list view"""
        try:
            # Get main image ID to exclude it from media list
            main_image_id = None
            main_image_data = self.get_main_image(obj)
            if main_image_data and 'id' in main_image_data:
                main_image_id = main_image_data['id']
            
            # Use prefetch_related to reduce database queries if available
            if hasattr(obj, 'images') and hasattr(obj, 'videos') and hasattr(obj, 'audios') and hasattr(obj, 'documents'):
                # Use prefetched data if available
                images = list(obj.images.all())
                videos = list(obj.videos.all())
                audios = list(obj.audios.all())
                documents = list(obj.documents.all())
            else:
                # Fallback to database queries
                images = list(obj.images.select_related('image').all())
                videos = list(obj.videos.select_related('video').all())
                audios = list(obj.audios.select_related('audio').all())
                documents = list(obj.documents.select_related('document').all())
            
            # Combine all media with type information
            all_media = images + videos + audios + documents
            
            # Filter out main image from media list
            if main_image_id:
                filtered_media = []
                for m in all_media:
                    # Check if this is the main image and skip it
                    if hasattr(m, 'is_main') and m.is_main:
                        continue
                    if hasattr(m, 'image') and m.image and m.image.id == main_image_id:
                        continue
                    filtered_media.append(m)
                all_media = filtered_media
            
            # Sort by order field, then by creation date
            all_media.sort(key=lambda x: (getattr(x, 'order', 0), x.created_at))
            
            # Serialize all media (limit to first 5 for performance in list view)
            media_list = []
            for media in all_media[:5]:  # Limit to 5 items in list view
                media_list.append(PortfolioMediaAdminSerializer(media, context=self.context).data)
                
            return media_list
        except Exception:
            return []

    def get_main_image(self, obj):
        """Get main image details by querying database directly"""
        try:
            # First try to get main image from PortfolioImage
            main_image = obj.images.select_related('image').filter(is_main=True).first()
            if main_image and main_image.image:
                return {
                    'id': main_image.image.id,
                    'file_url': main_image.image.file.url if hasattr(main_image.image, 'file') and main_image.image.file else None,
                    'title': main_image.image.title,
                    'alt_text': main_image.image.alt_text
                }
            else:
                # If no main image, try to get cover image from first video
                video = obj.videos.select_related('video__cover_image').first()
                if video and video.video.cover_image:
                    cover_image = video.video.cover_image
                    return {
                        'id': cover_image.id,
                        'file_url': cover_image.file.url if hasattr(cover_image, 'file') and cover_image.file else None,
                        'title': cover_image.title,
                        'alt_text': cover_image.alt_text
                    }
                else:
                    # If no video cover, try to get cover image from first audio
                    audio = obj.audios.select_related('audio__cover_image').first()
                    if audio and audio.audio.cover_image:
                        cover_image = audio.audio.cover_image
                        return {
                            'id': cover_image.id,
                            'file_url': cover_image.file.url if hasattr(cover_image, 'file') and cover_image.file else None,
                            'title': cover_image.title,
                            'alt_text': cover_image.alt_text
                        }
                    else:
                        # If no audio cover, try to get cover image from first document
                        document = obj.documents.select_related('document__cover_image').first()
                        if document and document.document.cover_image:
                            cover_image = document.document.cover_image
                            return {
                                'id': cover_image.id,
                                'file_url': cover_image.file.url if hasattr(cover_image, 'file') and cover_image.file else None,
                                'title': cover_image.title,
                                'alt_text': cover_image.alt_text
                            }
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
        """Get media count from all media types"""
        image_count = obj.images.count() if hasattr(obj, 'images') else 0
        video_count = obj.videos.count() if hasattr(obj, 'videos') else 0
        audio_count = obj.audios.count() if hasattr(obj, 'audios') else 0
        document_count = obj.documents.count() if hasattr(obj, 'documents') else 0
        return image_count + video_count + audio_count + document_count
    
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
    options = PortfolioOptionAdminSerializer(many=True, read_only=True, source="portfolio_options")
    media = serializers.SerializerMethodField()
    
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
            'main_image', 'categories', 'tags', 'options', 'media',
            # SEO fields from SEOMixin
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'structured_data', 'hreflang_data',
            # SEO computed fields
            'seo_data', 'seo_preview', 'seo_completeness',
            'created_at', 'updated_at',
        ]
    
    def get_main_image(self, obj):
        """Get main image details by querying database directly"""
        try:
            # First try to get main image from PortfolioImage
            main_image = obj.images.select_related('image').filter(is_main=True).first()
            if main_image and main_image.image:
                return {
                    'id': main_image.image.id,
                    'file_url': main_image.image.file.url if hasattr(main_image.image, 'file') and main_image.image.file else None,
                    'title': main_image.image.title,
                    'alt_text': main_image.image.alt_text
                }
            else:
                # If no main image, try to get cover image from first video
                video = obj.videos.select_related('video__cover_image').first()
                if video and video.video.cover_image:
                    cover_image = video.video.cover_image
                    return {
                        'id': cover_image.id,
                        'file_url': cover_image.file.url if hasattr(cover_image, 'file') and cover_image.file else None,
                        'title': cover_image.title,
                        'alt_text': cover_image.alt_text
                    }
                else:
                    # If no video cover, try to get cover image from first audio
                    audio = obj.audios.select_related('audio__cover_image').first()
                    if audio and audio.audio.cover_image:
                        cover_image = audio.audio.cover_image
                        return {
                            'id': cover_image.id,
                            'file_url': cover_image.file.url if hasattr(cover_image, 'file') and cover_image.file else None,
                            'title': cover_image.title,
                            'alt_text': cover_image.alt_text
                        }
                    else:
                        # If no audio cover, try to get cover image from first document
                        document = obj.documents.select_related('document__cover_image').first()
                        if document and document.document.cover_image:
                            cover_image = document.document.cover_image
                            return {
                                'id': cover_image.id,
                                'file_url': cover_image.file.url if hasattr(cover_image, 'file') and cover_image.file else None,
                                'title': cover_image.title,
                                'alt_text': cover_image.alt_text
                            }
        except Exception:
            pass
        return None
    
    def get_media(self, obj):
        """Get all media for the portfolio with optimized queries"""
        # Use prefetch_related to reduce database queries
        images = obj.images.select_related('image').all()
        videos = obj.videos.select_related('video').all()
        audios = obj.audios.select_related('audio').all()
        documents = obj.documents.select_related('document').all()
        
        # Combine all media with type information
        all_media = list(images) + list(videos) + list(audios) + list(documents)
        
        # Sort by order field, then by creation date
        all_media.sort(key=lambda x: (getattr(x, 'order', 0), x.created_at))
        
        # Serialize all media
        media_list = []
        for media in all_media:
            media_list.append(PortfolioMediaAdminSerializer(media, context=self.context).data)
            
        return media_list
    
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
            'canonical_url', 'robots_meta',
            # Relations
            'categories_ids', 'tags_ids',
            # Media
            'media_files'
        ]
    
    def create(self, validated_data):
        categories_ids = validated_data.pop('categories_ids', [])
        tags_ids = validated_data.pop('tags_ids', [])
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