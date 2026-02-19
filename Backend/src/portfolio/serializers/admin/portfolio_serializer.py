from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.conf import settings
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.category import PortfolioCategory
from src.portfolio.models.tag import PortfolioTag
from src.portfolio.models.option import PortfolioOption
from src.portfolio.models.media import PortfolioImage, PortfolioVideo, PortfolioAudio, PortfolioDocument
from src.portfolio.serializers.admin.category_serializer import PortfolioCategorySimpleAdminSerializer
from src.portfolio.serializers.admin.tag_serializer import PortfolioTagAdminSerializer
from src.portfolio.serializers.admin.option_serializer import PortfolioOptionSimpleAdminSerializer
from src.portfolio.services.admin.media_services import PortfolioAdminMediaService
from src.portfolio.messages.messages import PORTFOLIO_ERRORS
from src.media.serializers.media_serializer import MediaAdminSerializer, MediaCoverSerializer
from src.media.serializers.mixins import MediaAggregationMixin

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
            'media_type': self._get_media_type(instance),
            'order': instance.order,
            'created_at': instance.created_at,
            'updated_at': instance.updated_at,
        }
        
        if isinstance(instance, PortfolioImage):
            result['is_main_image'] = instance.is_main
        
        return result
    
    def _get_media_type(self, instance):
        if hasattr(instance, 'image') and instance.image:
            return 'image'
        elif hasattr(instance, 'video') and instance.video:
            return 'video'
        elif hasattr(instance, 'audio') and instance.audio:
            return 'audio'
        elif hasattr(instance, 'document') and instance.document:
            return 'pdf'
        
        if isinstance(instance, PortfolioImage):
            return 'image'
        elif isinstance(instance, PortfolioVideo):
            return 'video'
        elif isinstance(instance, PortfolioAudio):
            return 'audio'
        elif isinstance(instance, PortfolioDocument):
            return 'pdf'
            
        return 'image'

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
    
    seo_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Portfolio
        fields = [
            'id', 'public_id', 'status', 'title', 'slug', 'short_description',
            'is_featured', 'is_public', 'is_active',
            'main_image', 'categories',
            'seo_status',
            'meta_title', 'meta_description',
            'created_at', 'updated_at', # ✅ همیشه در انتها
        ]
    
    def get_main_image(self, obj):
        main_images = getattr(obj, 'main_image_prefetch', [])
        if main_images:
            img_obj = main_images[0]
            if img_obj.image:
                file_url = None
                try:
                    file_url = img_obj.image.file.url if img_obj.image.file else None
                except Exception:
                    pass
                return {
                    'id': img_obj.image.id,
                    'url': file_url,
                    'file_url': file_url,
                    'title': img_obj.image.title,
                    'alt_text': img_obj.image.alt_text
                }
        return None
    def get_seo_status(self, obj):
        has_meta_title = bool(obj.meta_title)
        has_meta_description = bool(obj.meta_description)
        has_og_image = bool(getattr(obj, 'og_image_id', None))
        
        score = sum([has_meta_title, has_meta_description, has_og_image])
        return {
            'score': score,
            'total': 3,
            'status': 'complete' if score == 3 else 'incomplete' if score > 0 else 'missing'
        }

class PortfolioAdminDetailSerializer(MediaAggregationMixin, serializers.ModelSerializer):
    main_image = serializers.SerializerMethodField()
    categories = PortfolioCategorySimpleAdminSerializer(many=True, read_only=True)
    tags = PortfolioTagAdminSerializer(many=True, read_only=True)
    options = PortfolioOptionSimpleAdminSerializer(many=True, read_only=True)
    media = serializers.SerializerMethodField()
    portfolio_media = serializers.SerializerMethodField()
    
    seo_data = serializers.SerializerMethodField()
    seo_preview = serializers.SerializerMethodField()
    seo_completeness = serializers.SerializerMethodField()
    
    categories_count = serializers.IntegerField(read_only=True)
    tags_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Portfolio
        fields = [
            'id', 'public_id', 'status', 'title', 'slug',
            'short_description', 'description',
            'is_featured', 'is_public', 'is_active',
            'main_image', 'categories', 'tags', 'options', 'media', 'portfolio_media',
            'extra_attributes',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'structured_data', 'hreflang_data',
            'seo_data', 'seo_preview', 'seo_completeness',
            'categories_count', 'tags_count', 'views_count',
            'created_at', 'updated_at',
        ]
    
    def get_main_image(self, obj):
        return obj.get_main_image_details()
    
    def get_media(self, obj):
        return self.aggregate_media(
            obj=obj,
            media_limit=_MEDIA_DETAIL_LIMIT,
            media_serializer_class=PortfolioMediaAdminSerializer
        )
    
    def get_portfolio_media(self, obj):
        return self.get_media(obj)
    
    def get_seo_data(self, obj):
        seo_data = {
            'meta_title': obj.get_meta_title(),
            'meta_description': obj.get_meta_description(),
            'og_title': obj.get_og_title(),
            'og_description': obj.get_og_description(),
            'canonical_url': obj.get_canonical_url(),
            'structured_data': obj.generate_structured_data(),
        }
        return seo_data
    
    def get_seo_preview(self, obj):
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
        return preview_data
    
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
        completeness_data = {
            'score': score,
            'total': len(checks),
            'percentage': round((score / len(checks)) * 100, 1)
        }
        return completeness_data

class PortfolioAdminCreateSerializer(serializers.ModelSerializer):
    categories = serializers.PrimaryKeyRelatedField(
        queryset=PortfolioCategory.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    tags = serializers.PrimaryKeyRelatedField(
        queryset=PortfolioTag.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    options = serializers.PrimaryKeyRelatedField(
        queryset=PortfolioOption.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    media_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True,
        help_text="List of media IDs to link to this portfolio"
    )
    image_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    video_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    audio_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    document_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
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
            'extra_attributes',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'categories', 'tags', 'options',
            'media_files', 'media_ids', 'image_ids', 'video_ids', 'audio_ids', 'document_ids'
        ]
        extra_kwargs = {
            'slug': {
                'validators': [
                    UniqueValidator(
                        queryset=Portfolio.objects.all(),
                        message=PORTFOLIO_ERRORS["portfolio_slug_exists"]
                    )
                ]
            },
        }
    
    def validate(self, attrs):
        return attrs

class PortfolioAdminUpdateSerializer(serializers.ModelSerializer):
    categories = serializers.PrimaryKeyRelatedField(
        queryset=PortfolioCategory.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    tags = serializers.PrimaryKeyRelatedField(
        queryset=PortfolioTag.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    options = serializers.PrimaryKeyRelatedField(
        queryset=PortfolioOption.objects.all(),
        many=True,
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
    image_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    video_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    audio_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    document_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
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
        help_text="Legacy: Mapping of media_id to cover_image_id for portfolio-specific covers. Format: {media_id: cover_image_id}"
    )
    image_covers = serializers.DictField(child=serializers.IntegerField(allow_null=True), write_only=True, required=False)
    video_covers = serializers.DictField(child=serializers.IntegerField(allow_null=True), write_only=True, required=False)
    audio_covers = serializers.DictField(child=serializers.IntegerField(allow_null=True), write_only=True, required=False)
    document_covers = serializers.DictField(child=serializers.IntegerField(allow_null=True), write_only=True, required=False)
    media_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Portfolio
        fields = [
            'title', 'slug', 'short_description', 'description',
            'status', 'is_featured', 'is_public', 'is_active',
            'extra_attributes',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'categories', 'tags', 'options', 'media_ids', 'media_files', 'main_image_id', 'media_covers',
            'image_ids', 'video_ids', 'audio_ids', 'document_ids',
            'image_covers', 'video_covers', 'audio_covers', 'document_covers'
        ]
        extra_kwargs = {
            'slug': {
                'validators': [
                    UniqueValidator(
                        queryset=Portfolio.objects.all(),
                        message=PORTFOLIO_ERRORS["portfolio_slug_exists"]
                    )
                ]
            },
        }

class PortfolioAdminSerializer(PortfolioAdminDetailSerializer):
    pass