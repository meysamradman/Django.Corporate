from django.db import models
from django.db.models import Prefetch, Count, Q


class BlogQuerySet(models.QuerySet):
    """Optimized QuerySet for Blog with SEO support"""
    
    def published(self):
        """Published and public blogs"""
        return self.filter(status='published', is_public=True)
    
    def active(self):
        """Active blogs (published or draft)"""
        return self.filter(is_active=True)
    
    def with_seo(self):
        """Load only essential SEO fields for performance"""
        return self.only(
            'id', 'title', 'slug', 'short_description', 'status',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'og_image', 'canonical_url', 'created_at', 'updated_at', 'public_id'
        )
    
    def for_admin_listing(self):
        """Optimized for admin listing pages with SEO status and all media types"""
        from src.blog.models.media import BlogImage
        return self.select_related('og_image').prefetch_related(
            'categories',
            'tags',
            Prefetch(
                'images',
                queryset=BlogImage.objects.select_related('image').order_by('is_main', 'order', 'created_at'),
                to_attr='all_images'
            ),
            Prefetch(
                'images',
                queryset=BlogImage.objects.select_related('image').filter(is_main=True),
                to_attr='main_images'
            ),
            'videos__video',
            'videos__video__cover_image',
            'audios__audio',
            'audios__audio__cover_image',
            'documents__document'
        ).annotate(
            total_media_count=Count('images', distinct=True) + 
                             Count('videos', distinct=True) +
                             Count('audios', distinct=True) +
                             Count('documents', distinct=True),
            categories_count=Count('categories', distinct=True),
            tags_count=Count('tags', distinct=True)
        )
    
    def for_public_listing(self):
        """Optimized for public listing pages"""
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
        """Optimized for detail pages with all relations"""
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
        """Add SEO completeness annotations"""
        from django.db.models import Case, When, IntegerField
        return self.annotate(
            seo_score=Case(
                # Complete SEO (all 3 fields)
                When(
                    meta_title__isnull=False,
                    meta_description__isnull=False,
                    og_image__isnull=False,
                    then=3
                ),
                # Partial SEO (1-2 fields)
                When(
                    Q(meta_title__isnull=False) | 
                    Q(meta_description__isnull=False) | 
                    Q(og_image__isnull=False),
                    then=1
                ),
                # No SEO
                default=0,
                output_field=IntegerField()
            )
        )
    
    def complete_seo(self):
        """Blogs with complete SEO data"""
        return self.filter(
            meta_title__isnull=False,
            meta_description__isnull=False,
            og_image__isnull=False
        )
    
    def incomplete_seo(self):
        """Blogs with partial SEO data"""
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
        """Blogs with no SEO data"""
        return self.filter(
            meta_title__isnull=True,
            meta_description__isnull=True,
            og_image__isnull=True
        )
    
    def search(self, query):
        """Enhanced full-text search with SEO fields"""
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
        """Featured blogs"""
        return self.filter(is_featured=True)
    
    def by_category(self, category_slug):
        """Filter by category slug"""
        return self.filter(categories__slug=category_slug)
    
    def by_tag(self, tag_slug):
        """Filter by tag slug"""
        return self.filter(tags__slug=tag_slug)


class BlogCategoryQuerySet(models.QuerySet):
    """Optimized QuerySet for Categories"""
    
    def public(self):
        return self.filter(is_public=True)
    
    def with_counts(self):
        """Add blog counts"""
        return self.annotate(
            blog_count=Count('blog_categories', 
                                filter=Q(blog_categories__status='published'))
        )
    
    def roots(self):
        """Root categories only"""
        return self.filter(depth=1)
    
    def for_tree(self):
        """Optimized for tree display"""
        return self.only('id', 'name', 'slug', 'depth', 'path', 'public_id')


class BlogTagQuerySet(models.QuerySet):
    """Optimized QuerySet for Tags"""
    
    def public(self):
        return self.filter(is_public=True)
    
    def popular(self, limit=10):
        """Most used tags"""
        return self.annotate(
            usage_count=Count('blog_tags')
        ).order_by('-usage_count')[:limit]
    
    def with_counts(self):
        return self.annotate(
            blog_count=Count('blog_tags',
                                filter=Q(blog_tags__status='published'))
        )


