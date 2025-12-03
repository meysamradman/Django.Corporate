from rest_framework import serializers
from django.core.cache import cache
from django.conf import settings
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.media import PortfolioImage, PortfolioVideo, PortfolioAudio, PortfolioDocument
from src.portfolio.serializers.admin.category_serializer import PortfolioCategorySimpleAdminSerializer
from src.portfolio.serializers.admin.tag_serializer import PortfolioTagAdminSerializer
from src.portfolio.serializers.admin.option_serializer import PortfolioOptionSimpleAdminSerializer
from src.portfolio.services.admin.media_services import PortfolioAdminMediaService
from src.portfolio.utils.cache import PortfolioCacheKeys
from src.media.serializers.media_serializer import MediaAdminSerializer, MediaCoverSerializer

_MEDIA_LIST_LIMIT = settings.PORTFOLIO_MEDIA_LIST_LIMIT
_MEDIA_DETAIL_LIMIT = settings.PORTFOLIO_MEDIA_DETAIL_LIMIT


class PortfolioMediaAdminSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    public_id = serializers.UUIDField(read_only=True)
    media_detail = MediaAdminSerializer(read_only=True, source='media')
    is_main_image = serializers.BooleanField(read_only=True)
    order = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    def to_representation(self, instance):
        if isinstance(instance, PortfolioImage):
            media_detail = MediaAdminSerializer(instance.image, context=self.context).data
        elif isinstance(instance, PortfolioVideo):
            media_detail = MediaAdminSerializer(instance.video, context=self.context).data
            self._apply_portfolio_cover_image(instance, media_detail)
        elif isinstance(instance, PortfolioAudio):
            media_detail = MediaAdminSerializer(instance.audio, context=self.context).data
            self._apply_portfolio_cover_image(instance, media_detail)
        elif isinstance(instance, PortfolioDocument):
            media_detail = MediaAdminSerializer(instance.document, context=self.context).data
            self._apply_portfolio_cover_image(instance, media_detail)
        else:
            return super().to_representation(instance)
        
        result = {
            'id': instance.id,
            'public_id': instance.public_id,
            'media_detail': media_detail,
            'media': media_detail,
            'order': instance.order,
            'created_at': instance.created_at,
            'updated_at': instance.updated_at,
        }
        
        if isinstance(instance, PortfolioImage):
            result['is_main_image'] = instance.is_main
        
        return result
    
    def _apply_portfolio_cover_image(self, instance, media_detail):
        if instance.cover_image is not None:
            media_detail['cover_image'] = MediaCoverSerializer(instance.cover_image, context=self.context).data
            media_detail['cover_image_url'] = instance.cover_image.file.url if instance.cover_image.file else None
        else:
            portfolio_cover = instance.get_cover_image()
            if portfolio_cover:
                media_detail['cover_image'] = MediaCoverSerializer(portfolio_cover, context=self.context).data
                media_detail['cover_image_url'] = portfolio_cover.file.url if portfolio_cover.file else None


class PortfolioAdminListSerializer(serializers.ModelSerializer):
    main_image = serializers.SerializerMethodField()
    categories = PortfolioCategorySimpleAdminSerializer(many=True, read_only=True)
    
    media_count = serializers.IntegerField(source='total_media_count', read_only=True)
    categories_count = serializers.IntegerField(read_only=True)
    tags_count = serializers.IntegerField(read_only=True)
    
    seo_status = serializers.SerializerMethodField()
    media = serializers.SerializerMethodField()
    
    class Meta:
        model = Portfolio
        fields = [
            'id', 'public_id', 'status', 'title', 'slug',
            'short_description', 'description', 'is_featured', 'is_public', 'is_active',
            'main_image', 'categories_count', 'tags_count', 
            'media_count', 'categories', 'seo_status', 'media',
            'created_at', 'updated_at',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'robots_meta', 'canonical_url'
        ]
    
    def get_media(self, obj):
        media_limit = _MEDIA_LIST_LIMIT
        
        if hasattr(obj, 'all_images'):
            all_images = getattr(obj, 'all_images', [])[:media_limit]
        else:
            all_images = list(obj.images.select_related('image').all()[:media_limit])
        
        videos = list(obj.videos.select_related('video', 'video__cover_image').all()[:media_limit])
        audios = list(obj.audios.select_related('audio', 'audio__cover_image').all()[:media_limit])
        documents = list(obj.documents.select_related('document', 'document__cover_image').all()[:media_limit])
        for item in videos:
            if item.video and hasattr(item.video, 'cover_image') and item.video.cover_image:
                if hasattr(item.video.cover_image, 'file') and item.video.cover_image.file:
                    try:
                        _ = item.video.cover_image.file.url
                    except:
                        pass
        for item in audios:
            if item.audio and hasattr(item.audio, 'cover_image') and item.audio.cover_image:
                if hasattr(item.audio.cover_image, 'file') and item.audio.cover_image.file:
                    try:
                        _ = item.audio.cover_image.file.url
                    except:
                        pass
        for item in documents:
            if item.document and hasattr(item.document, 'cover_image') and item.document.cover_image:
                if hasattr(item.document.cover_image, 'file') and item.document.cover_image.file:
                    try:
                        _ = item.document.cover_image.file.url
                    except:
                        pass
            if item.document and hasattr(item.document, 'file') and item.document.file:
                try:
                    _ = item.document.file.url
                except:
                    pass
        
        all_media = list(all_images) + videos + audios + documents
        all_media.sort(key=lambda x: (x.order, x.created_at))
        
        serializer = PortfolioMediaAdminSerializer(context=self.context)
        return [serializer.to_representation(media) for media in all_media]

    def get_main_image(self, obj):
        return obj.get_main_image_details()
    
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


class PortfolioAdminDetailSerializer(serializers.ModelSerializer):
    main_image = serializers.SerializerMethodField()
    categories = PortfolioCategorySimpleAdminSerializer(many=True, read_only=True)
    tags = PortfolioTagAdminSerializer(many=True, read_only=True)
    options = PortfolioOptionSimpleAdminSerializer(many=True, read_only=True)
    media = serializers.SerializerMethodField()
    portfolio_media = serializers.SerializerMethodField()
    
    seo_data = serializers.SerializerMethodField()
    seo_preview = serializers.SerializerMethodField()
    seo_completeness = serializers.SerializerMethodField()
    
    class Meta:
        model = Portfolio
        fields = [
            'id', 'public_id', 'status', 'title', 'slug',
            'short_description', 'description',
            'is_featured', 'is_public', 'is_active',
            'main_image', 'categories', 'tags', 'options', 'media', 'portfolio_media',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'structured_data', 'hreflang_data',
            'seo_data', 'seo_preview', 'seo_completeness',
            'created_at', 'updated_at',
        ]
    
    def get_main_image(self, obj):
        return obj.get_main_image_details()
    
    def get_media(self, obj):
        media_limit = _MEDIA_DETAIL_LIMIT
        
        if hasattr(obj, 'all_images'):
            all_images = getattr(obj, 'all_images', [])
            if media_limit > 0:
                all_images = all_images[:media_limit]
        else:
            images_qs = obj.images.select_related('image').all()
            all_images = list(images_qs[:media_limit]) if media_limit > 0 else list(images_qs)
        if hasattr(obj, '_prefetched_objects_cache') and 'videos' in obj._prefetched_objects_cache:
            videos = obj._prefetched_objects_cache['videos']
            if media_limit > 0:
                videos = videos[:media_limit]
        else:
            videos_qs = obj.videos.select_related('video', 'video__cover_image', 'cover_image').all()
            videos = list(videos_qs[:media_limit]) if media_limit > 0 else list(videos_qs)
        
        if hasattr(obj, '_prefetched_objects_cache') and 'audios' in obj._prefetched_objects_cache:
            audios = obj._prefetched_objects_cache['audios']
            if media_limit > 0:
                audios = audios[:media_limit]
        else:
            audios_qs = obj.audios.select_related('audio', 'audio__cover_image', 'cover_image').all()
            audios = list(audios_qs[:media_limit]) if media_limit > 0 else list(audios_qs)
        
        if hasattr(obj, '_prefetched_objects_cache') and 'documents' in obj._prefetched_objects_cache:
            documents = obj._prefetched_objects_cache['documents']
            if media_limit > 0:
                documents = documents[:media_limit]
        else:
            documents_qs = obj.documents.select_related('document', 'document__cover_image', 'cover_image').all()
            documents = list(documents_qs[:media_limit]) if media_limit > 0 else list(documents_qs)
        
        self._prefetch_cover_image_urls(videos, 'video')
        self._prefetch_cover_image_urls(audios, 'audio')
        self._prefetch_cover_image_urls(documents, 'document')
        
        all_media = list(all_images) + list(videos) + list(audios) + list(documents)
        all_media.sort(key=lambda x: (x.order, x.created_at))
        
        serializer = PortfolioMediaAdminSerializer(context=self.context)
        return [serializer.to_representation(media) for media in all_media]
    
    def _prefetch_cover_image_urls(self, items, media_type):
        for item in items:
            media_obj = getattr(item, media_type, None)
            if media_obj and hasattr(media_obj, 'cover_image') and media_obj.cover_image:
                if hasattr(media_obj.cover_image, 'file') and media_obj.cover_image.file:
                    try:
                        _ = media_obj.cover_image.file.url
                    except Exception:
                        pass
            
            if media_type == 'document' and hasattr(item, 'document') and item.document:
                if hasattr(item.document, 'file') and item.document.file:
                    try:
                        _ = item.document.file.url
                    except Exception:
                        pass
    
    def get_portfolio_media(self, obj):
        return self.get_media(obj)
    
    def get_seo_data(self, obj):
        cache_key = PortfolioCacheKeys.seo_data(obj.pk)
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
        
        cache.set(cache_key, seo_data, 1800)
        return seo_data
    
    def get_seo_preview(self, obj):
        cache_key = PortfolioCacheKeys.seo_preview(obj.pk)
        cached_preview = cache.get(cache_key)
        if cached_preview:
            return cached_preview
        
        preview_data = {
            'google': {
                'title': obj.get_meta_title()[:60],
                'description': obj.get_meta_description()[:160],
                'url': obj.get_public_url()
            },
            'facebook': {
                'title': obj.get_og_title(),
                'description': obj.get_og_description(),
                'image': obj.og_image.file.url if obj.og_image else None
            }
        }
        
        cache.set(cache_key, preview_data, 1800)
        return preview_data
    
    def get_seo_completeness(self, obj):
        cache_key = PortfolioCacheKeys.seo_completeness(obj.pk)
        cached_completeness = cache.get(cache_key)
        if cached_completeness:
            return cached_completeness
        
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
        completeness_data = {
            'score': score,
            'total': len(checks),
            'percentage': round((score / len(checks)) * 100, 1)
        }
        
        cache.set(cache_key, completeness_data, 1800)
        return completeness_data


class PortfolioAdminCreateSerializer(serializers.ModelSerializer):
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
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'categories_ids', 'tags_ids', 'options_ids',
            'media_files'
        ]
    
    def create(self, validated_data):
        categories_ids = validated_data.pop('categories_ids', [])
        tags_ids = validated_data.pop('tags_ids', [])
        options_ids = validated_data.pop('options_ids', [])
        media_files = validated_data.pop('media_files', [])
        
        if not validated_data.get('meta_title') and validated_data.get('title'):
            validated_data['meta_title'] = validated_data['title'][:70]
            
        if not validated_data.get('meta_description') and validated_data.get('short_description'):
            validated_data['meta_description'] = validated_data['short_description'][:300]
        
        portfolio = Portfolio.objects.create(**validated_data)
        
        if categories_ids:
            portfolio.categories.set(categories_ids)
        if tags_ids:
            portfolio.tags.set(tags_ids)
        if options_ids:
            portfolio.options.set(options_ids)
            
        return portfolio


class PortfolioAdminUpdateSerializer(serializers.ModelSerializer):
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
    media_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True,
        help_text="List of media IDs to sync with portfolio (removes deleted, adds new)"
    )
    main_image_id = serializers.IntegerField(
        write_only=True,
        required=False,
        allow_null=True,
        help_text="ID of media to set as main image"
    )
    media_covers = serializers.DictField(
        child=serializers.IntegerField(allow_null=True),
        write_only=True,
        required=False,
        help_text="Mapping of media_id to cover_image_id for portfolio-specific covers. Format: {media_id: cover_image_id}"
    )
    
    class Meta:
        model = Portfolio
        fields = [
            'title', 'slug', 'short_description', 'description',
            'status', 'is_featured', 'is_public', 'is_active',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'categories_ids', 'tags_ids', 'options_ids', 'media_ids', 'main_image_id', 'media_covers'
        ]
    
    def update(self, instance, validated_data):
        categories_ids = validated_data.pop('categories_ids', None)
        tags_ids = validated_data.pop('tags_ids', None)
        options_ids = validated_data.pop('options_ids', None)
        media_ids = validated_data.pop('media_ids', None)
        main_image_id = validated_data.pop('main_image_id', None)
        media_covers = validated_data.pop('media_covers', None)
        
        if not validated_data.get('meta_title') and validated_data.get('title'):
            validated_data['meta_title'] = validated_data['title'][:70]
            
        if not validated_data.get('meta_description') and validated_data.get('short_description'):
            validated_data['meta_description'] = validated_data['short_description'][:300]
        
        for field, value in validated_data.items():
            setattr(instance, field, value)
        
        instance.save()
        
        if categories_ids is not None:
            instance.categories.set(categories_ids)
        if tags_ids is not None:
            instance.tags.set(tags_ids)
        if options_ids is not None:
            instance.options.set(options_ids)
        
        if media_ids is not None:
            PortfolioAdminMediaService.sync_media(
                portfolio_id=instance.id,
                media_ids=media_ids,
                main_image_id=main_image_id,
                media_covers=media_covers
            )
            
            return instance


class PortfolioAdminSerializer(PortfolioAdminDetailSerializer):
    pass