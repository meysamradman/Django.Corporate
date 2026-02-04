from django.db import models
from django.db.models import Prefetch, Count, Q

class BlogQuerySet(models.QuerySet):
    
    def published(self):
        return self.filter(status='published', is_public=True)
    
    def active(self):
        return self.filter(is_active=True)
    
    def with_seo(self):
        return self.only(
            'id', 'title', 'slug', 'short_description', 'status',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'created_at', 'updated_at', 'public_id'
        )
    
    def for_admin_listing(self):
        
        from src.blog.models.media import BlogImage, BlogVideo, BlogAudio, BlogDocument
        from django.db.models.functions import Coalesce
        
        return self.select_related('og_image').prefetch_related(
            'categories',
            'tags',
            Prefetch(
                'images',
                queryset=BlogImage.objects.select_related('image')
                    .filter(is_main=True)
                    .only('id', 'image_id', 'is_main', 'order', 'blog_id'),
                to_attr='main_image_prefetch'
            ),
            Prefetch(
                'videos',
                queryset=BlogVideo.objects.select_related('video', 'cover_image', 'video__cover_image')
                    .only('id', 'video_id', 'cover_image_id', 'video__cover_image_id', 'blog_id')
                    .order_by('order', 'created_at'),
                to_attr='primary_video_prefetch'
            ),
            Prefetch(
                'audios',
                queryset=BlogAudio.objects.select_related('audio', 'cover_image', 'audio__cover_image')
                    .only('id', 'audio_id', 'cover_image_id', 'audio__cover_image_id', 'blog_id')
                    .order_by('order', 'created_at'),
                to_attr='primary_audio_prefetch'
            ),
            Prefetch(
                'documents',
                queryset=BlogDocument.objects.select_related('document', 'cover_image', 'document__cover_image')
                    .only('id', 'document_id', 'cover_image_id', 'document__cover_image_id', 'blog_id')
                    .order_by('order', 'created_at'),
                to_attr='primary_document_prefetch'
            ),
        ).annotate(
            total_images_count=Count('images', distinct=True),
            total_videos_count=Count('videos', distinct=True),
            total_audios_count=Count('audios', distinct=True),
            total_docs_count=Count('documents', distinct=True),
            categories_count=Count('categories', distinct=True),
            tags_count=Count('tags', distinct=True)
        ).annotate(
            total_media_count=Coalesce(
                models.F('total_images_count') + 
                models.F('total_videos_count') + 
                models.F('total_audios_count') + 
                models.F('total_docs_count'),
                0,
                output_field=models.PositiveIntegerField()
            )
        )
    
    def for_public_listing(self):
        from src.blog.models.media import BlogImage
        return self.published().select_related('og_image').prefetch_related(
            'categories__image',
            Prefetch(
                'images',
                queryset=BlogImage.objects.filter(is_main=True).select_related('image'),
                to_attr='main_image_media'
            )
        )
    
    def for_detail(self):
        from src.blog.models.media import BlogImage, BlogVideo, BlogAudio, BlogDocument
        return self.select_related('og_image').prefetch_related(
            'categories',
            'tags', 
            Prefetch(
                'images',
                queryset=BlogImage.objects.select_related('image').order_by('is_main', 'order', 'created_at'),
                to_attr='all_images'
            ),
            'images__image',
            Prefetch(
                'videos',
                queryset=BlogVideo.objects.select_related('video', 'video__cover_image', 'cover_image').order_by('order', 'created_at')
            ),
            'videos__video',
            'videos__video__cover_image',
            Prefetch(
                'audios',
                queryset=BlogAudio.objects.select_related('audio', 'audio__cover_image', 'cover_image').order_by('order', 'created_at')
            ),
            'audios__audio',
            'audios__audio__cover_image',
            Prefetch(
                'documents',
                queryset=BlogDocument.objects.select_related('document', 'document__cover_image', 'cover_image').order_by('order', 'created_at')
            ),
            'documents__document',
            'documents__document__cover_image'
        )
    
    def with_seo_status(self):
        from django.db.models import Case, When, IntegerField
        return self.annotate(
            seo_score=Case(
                When(
                    meta_title__isnull=False,
                    meta_description__isnull=False,
                    og_image__isnull=False,
                    then=3
                ),
                When(
                    Q(meta_title__isnull=False) | 
                    Q(meta_description__isnull=False) | 
                    Q(og_image__isnull=False),
                    then=1
                ),
                default=0,
                output_field=IntegerField()
            )
        )
    
    def complete_seo(self):
        return self.filter(
            meta_title__isnull=False,
            meta_description__isnull=False,
            og_image__isnull=False
        )
    
    def incomplete_seo(self):
        return self.filter(
            Q(meta_title__isnull=False) | 
            Q(meta_description__isnull=False) | 
            Q(og_image__isnull=False)
        ).exclude(
            meta_title__isnull=False,
            meta_description__isnull=False,
            og_image__isnull=False
        )
    
    def missing_seo(self):
        return self.filter(
            meta_title__isnull=True,
            meta_description__isnull=True,
            og_image__isnull=True
        )
    
    def search(self, query):
        return self.filter(
            Q(title__icontains=query) |
            Q(short_description__icontains=query) |
            Q(description__icontains=query) |
            Q(meta_title__icontains=query) |
            Q(meta_description__icontains=query) |
            Q(categories__name__icontains=query) |
            Q(tags__name__icontains=query)
        ).distinct()
    
    def featured(self):
        return self.filter(is_featured=True)
    
    def by_category(self, category_slug):
        return self.filter(categories__slug=category_slug)
    
    def by_tag(self, tag_slug):
        return self.filter(tags__slug=tag_slug)

class BlogCategoryQuerySet(models.QuerySet):
    
    def public(self):
        return self.filter(is_public=True)
    
    def with_counts(self):
        return self.annotate(
            blog_count=Count('blog_categories', 
                                filter=Q(blog_categories__status='published'))
        )
    
    def roots(self):
        return self.filter(depth=1)
    
    def for_tree(self):
        return self.only('id', 'name', 'slug', 'depth', 'path', 'public_id')

class BlogTagQuerySet(models.QuerySet):
    
    def public(self):
        return self.filter(is_public=True)
    
    def popular(self, limit=10):
        return self.annotate(
            usage_count=Count('blog_tags')
        ).order_by('-usage_count')[:limit]
    
    def with_counts(self):
        return self.annotate(
            blog_count=Count('blog_tags',
                                filter=Q(blog_tags__status='published'))
        )

