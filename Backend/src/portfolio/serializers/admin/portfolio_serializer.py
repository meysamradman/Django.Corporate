from rest_framework import serializers
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
                'is_main_image': False,  # Videos don't have is_main field
                'order': instance.order,
                'created_at': instance.created_at,
                'updated_at': instance.updated_at,
            }
        elif isinstance(instance, PortfolioAudio):
            return {
                'id': instance.id,
                'public_id': instance.public_id,
                'media_detail': MediaAdminSerializer(instance.audio, context=self.context).data,
                'is_main_image': False,  # Audios don't have is_main field
                'order': instance.order,
                'created_at': instance.created_at,
                'updated_at': instance.updated_at,
            }
        elif isinstance(instance, PortfolioDocument):
            return {
                'id': instance.id,
                'public_id': instance.public_id,
                'media_detail': MediaAdminSerializer(instance.document, context=self.context).data,
                'is_main_image': False,  # Documents don't have is_main field
                'order': instance.order,
                'created_at': instance.created_at,
                'updated_at': instance.updated_at,
            }
        return super().to_representation(instance)


class PortfolioAdminListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for admin listing with SEO status and detailed media counts"""
    main_image_url = serializers.SerializerMethodField()
    categories_count = serializers.SerializerMethodField()
    tags_count = serializers.SerializerMethodField()
    images_count = serializers.SerializerMethodField()
    videos_count = serializers.SerializerMethodField()
    audios_count = serializers.SerializerMethodField()
    documents_count = serializers.SerializerMethodField()
    media_count = serializers.SerializerMethodField()
    seo_status = serializers.SerializerMethodField()
    # Add separate media arrays for detailed view in list
    images = serializers.SerializerMethodField()
    videos = serializers.SerializerMethodField()
    audios = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    
    class Meta:
        model = Portfolio
        fields = [
            'id', 'public_id', 'status', 'title', 'slug',
            'short_description', 'description', 'is_featured', 'is_public',
            'main_image_url', 'categories_count', 'tags_count', 
            'images_count', 'videos_count', 'audios_count', 'documents_count', 'media_count',
            'images', 'videos', 'audios', 'documents',  # Add media arrays
            'seo_status', 'created_at', 'updated_at',
            # SEO fields
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'robots_meta', 'canonical_url'
        ]
    
    def get_main_image_url(self, obj):
        """Get main image efficiently from prefetched data with caching"""
        try:
            # First check if we have prefetched data
            if hasattr(obj, 'main_image_media'):
                main_image_media = getattr(obj, 'main_image_media', [])
                if main_image_media and len(main_image_media) > 0 and main_image_media[0].image:
                    return main_image_media[0].image.file.url if main_image_media[0].image.file else None
            
            # Fallback to model's method
            main_image = obj.get_main_image()
            if main_image and hasattr(main_image, 'file') and main_image.file:
                return main_image.file.url
        except Exception:
            pass
        return None
    
    def get_categories_count(self, obj):
        """Get categories count from prefetched data"""
        return obj.categories.count() if hasattr(obj, 'categories') else 0
    
    def get_tags_count(self, obj):
        """Get tags count from prefetched data"""
        return obj.tags.count() if hasattr(obj, 'tags') else 0
    
    def get_images_count(self, obj):
        """Get images count"""
        return obj.images.count() if hasattr(obj, 'images') else 0
    
    def get_videos_count(self, obj):
        """Get videos count"""
        return obj.videos.count() if hasattr(obj, 'videos') else 0
    
    def get_audios_count(self, obj):
        """Get audios count"""
        return obj.audios.count() if hasattr(obj, 'audios') else 0
    
    def get_documents_count(self, obj):
        """Get documents count"""
        return obj.documents.count() if hasattr(obj, 'documents') else 0
    
    def get_media_count(self, obj):
        """Get media count from all media types"""
        image_count = obj.images.count() if hasattr(obj, 'images') else 0
        video_count = obj.videos.count() if hasattr(obj, 'videos') else 0
        audio_count = obj.audios.count() if hasattr(obj, 'audios') else 0
        document_count = obj.documents.count() if hasattr(obj, 'documents') else 0
        return image_count + video_count + audio_count + document_count
    
    def get_images(self, obj):
        """Get basic image information for list view"""
        if hasattr(obj, 'images'):
            # Only get basic info to keep list view lightweight
            try:
                images = obj.images.select_related('image').filter(is_main=False)[:3]
                return [
                    {
                        'id': img.id,
                        'title': img.image.title if img.image else '',
                        'url': img.image.file.url if img.image and img.image.file else None,
                        'order': img.order
                    }
                    for img in images
                ]
            except Exception:
                # Fallback if there are any issues with the query
                return []
        return []
    
    def get_videos(self, obj):
        """Get basic video information for list view"""
        if hasattr(obj, 'videos'):
            # Only get basic info to keep list view lightweight
            try:
                videos = obj.videos.select_related('video__cover_image')[:2]
                return [
                    {
                        'id': vid.id,
                        'title': vid.video.title if vid.video else '',
                        'cover_url': vid.video.cover_image.file.url if vid.video and vid.video.cover_image and vid.video.cover_image.file else None,
                        'order': vid.order
                    }
                    for vid in videos
                ]
            except Exception:
                # Fallback if there are any issues with the query
                return []
        return []
    
    def get_audios(self, obj):
        """Get basic audio information for list view"""
        if hasattr(obj, 'audios'):
            # Only get basic info to keep list view lightweight
            try:
                audios = obj.audios.select_related('audio__cover_image')[:2]
                return [
                    {
                        'id': aud.id,
                        'title': aud.audio.title if aud.audio else '',
                        'cover_url': aud.audio.cover_image.file.url if aud.audio and aud.audio.cover_image and aud.audio.cover_image.file else None,
                        'order': aud.order
                    }
                    for aud in audios
                ]
            except Exception:
                # Fallback if there are any issues with the query
                return []
        return []
    
    def get_documents(self, obj):
        """Get basic document information for list view"""
        if hasattr(obj, 'documents'):
            # Only get basic info to keep list view lightweight
            try:
                documents = obj.documents.select_related('document__cover_image')[:2]
                return [
                    {
                        'id': doc.id,
                        'title': doc.document.title if doc.document else '',
                        'cover_url': doc.document.cover_image.file.url if doc.document and doc.document.cover_image and doc.document.cover_image.file else None,
                        'order': doc.order
                    }
                    for doc in documents
                ]
            except Exception:
                # Fallback if there are any issues with the query
                return []
        return []
    
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
            'categories', 'tags', 'options', 'media',
            # SEO fields from SEOMixin
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'structured_data', 'hreflang_data',
            # SEO computed fields
            'seo_data', 'seo_preview', 'seo_completeness',
            'created_at', 'updated_at',
        ]
    
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