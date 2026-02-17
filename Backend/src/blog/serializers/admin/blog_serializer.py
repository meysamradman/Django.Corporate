from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.conf import settings
from src.blog.models.blog import Blog
from src.blog.models.category import BlogCategory
from src.blog.models.tag import BlogTag
from src.blog.models.media import BlogImage, BlogVideo, BlogAudio, BlogDocument
from src.blog.serializers.admin.category_serializer import BlogCategorySimpleAdminSerializer
from src.blog.serializers.admin.tag_serializer import BlogTagAdminSerializer
from src.blog.services.admin.media_services import BlogAdminMediaService
from src.blog.messages.messages import BLOG_ERRORS
from src.media.serializers.media_serializer import MediaAdminSerializer, MediaCoverSerializer
from src.media.serializers.mixins import MediaAggregationMixin

_MEDIA_LIST_LIMIT = settings.BLOG_MEDIA_LIST_LIMIT
_MEDIA_DETAIL_LIMIT = settings.BLOG_MEDIA_DETAIL_LIMIT

class BlogMediaAdminSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    public_id = serializers.UUIDField(read_only=True)
    media_detail = MediaAdminSerializer(read_only=True, source='media')
    is_main_image = serializers.BooleanField(read_only=True)
    order = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    def to_representation(self, instance):
        if isinstance(instance, BlogImage):
            media_detail = MediaAdminSerializer(instance.image, context=self.context).data
        elif isinstance(instance, BlogVideo):
            media_detail = MediaAdminSerializer(instance.video, context=self.context).data
            self._apply_blog_cover_image(instance, media_detail)
        elif isinstance(instance, BlogAudio):
            media_detail = MediaAdminSerializer(instance.audio, context=self.context).data
            self._apply_blog_cover_image(instance, media_detail)
        elif isinstance(instance, BlogDocument):
            media_detail = MediaAdminSerializer(instance.document, context=self.context).data
            self._apply_blog_cover_image(instance, media_detail)
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
        
        if isinstance(instance, BlogImage):
            result['is_main_image'] = instance.is_main
        
        return result
    
    def _apply_blog_cover_image(self, instance, media_detail):
        if instance.cover_image is not None:
            media_detail['cover_image'] = MediaCoverSerializer(instance.cover_image, context=self.context).data
            media_detail['cover_image_url'] = instance.cover_image.file.url if instance.cover_image.file else None
        else:
            blog_cover = instance.get_cover_image()
            if blog_cover:
                media_detail['cover_image'] = MediaCoverSerializer(blog_cover, context=self.context).data
                media_detail['cover_image_url'] = blog_cover.file.url if blog_cover.file else None

class BlogAdminListSerializer(serializers.ModelSerializer):
    main_image = serializers.SerializerMethodField()
    categories = BlogCategorySimpleAdminSerializer(many=True, read_only=True)
    
    images_count = serializers.IntegerField(source='total_images_count', read_only=True)
    videos_count = serializers.IntegerField(source='total_videos_count', read_only=True)
    audios_count = serializers.IntegerField(source='total_audios_count', read_only=True)
    documents_count = serializers.IntegerField(source='total_docs_count', read_only=True)
    media_count = serializers.IntegerField(source='total_media_count', read_only=True)
    categories_count = serializers.IntegerField(read_only=True)
    tags_count = serializers.IntegerField(read_only=True)
    
    seo_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Blog
        fields = [
            'id', 'public_id', 'status', 'title', 'slug', 'short_description',
            'is_featured', 'is_public', 'is_active',
            'main_image', 'categories', 'categories_count', 'tags_count',
            'images_count', 'videos_count', 'audios_count', 'documents_count', 'media_count',
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

class BlogAdminDetailSerializer(MediaAggregationMixin, serializers.ModelSerializer):
    main_image = serializers.SerializerMethodField()
    categories = BlogCategorySimpleAdminSerializer(many=True, read_only=True)
    tags = BlogTagAdminSerializer(many=True, read_only=True)
    media = serializers.SerializerMethodField()
    blog_media = serializers.SerializerMethodField()
    
    seo_data = serializers.SerializerMethodField()
    seo_preview = serializers.SerializerMethodField()
    seo_completeness = serializers.SerializerMethodField()
    
    categories_count = serializers.IntegerField(read_only=True)
    tags_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Blog
        fields = [
            'id', 'public_id', 'status', 'title', 'slug',
            'short_description', 'description',
            'is_featured', 'is_public', 'is_active',
            'main_image', 'categories', 'tags', 'media', 'blog_media',
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
            media_serializer_class=BlogMediaAdminSerializer
        )
    
    def get_blog_media(self, obj):
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

class BlogAdminCreateSerializer(serializers.ModelSerializer):
    categories = serializers.PrimaryKeyRelatedField(
        queryset=BlogCategory.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    tags = serializers.PrimaryKeyRelatedField(
        queryset=BlogTag.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    media_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )
    
    media_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True,
        help_text="List of media IDs to link to this article"
    )
    
    class Meta:
        model = Blog
        fields = [
            'title', 'slug', 'short_description', 'description',
            'status', 'is_featured', 'is_public',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'categories', 'tags',
            'media_files', 'media_ids'
        ]
        extra_kwargs = {
            'slug': {
                'validators': [
                    UniqueValidator(
                        queryset=Blog.objects.all(),
                        message=BLOG_ERRORS["blog_slug_exists"]
                    )
                ]
            },
        }
    
    def validate(self, attrs):
        return attrs

class BlogAdminUpdateSerializer(serializers.ModelSerializer):
    categories = serializers.PrimaryKeyRelatedField(
        queryset=BlogCategory.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    tags = serializers.PrimaryKeyRelatedField(
        queryset=BlogTag.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    media_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True,
        help_text="List of media IDs to sync with blog (removes deleted, adds new)"
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
        help_text="Mapping of media_id to cover_image_id for blog-specific covers. Format: {media_id: cover_image_id}"
    )
    media_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Blog
        fields = [
            'title', 'slug', 'short_description', 'description',
            'status', 'is_featured', 'is_public', 'is_active',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'robots_meta',
            'categories', 'tags', 'media_ids', 'media_files', 'main_image_id', 'media_covers'
        ]
        extra_kwargs = {
            'slug': {
                'validators': [
                    UniqueValidator(
                        queryset=Blog.objects.all(),
                        message=BLOG_ERRORS["blog_slug_exists"]
                    )
                ]
            },
        }

class BlogAdminSerializer(BlogAdminDetailSerializer):
    pass