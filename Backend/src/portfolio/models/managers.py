from django.db import models
from django.db.models import Prefetch, Count, Q


class PortfolioQuerySet(models.QuerySet):
    
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
        from src.portfolio.models.media import PortfolioImage, PortfolioVideo, PortfolioAudio, PortfolioDocument
        return self.select_related('og_image').prefetch_related(
            'categories',
            'tags',
            Prefetch(
                'images',
                queryset=PortfolioImage.objects.select_related('image').order_by('is_main', 'order', 'created_at'),
                to_attr='all_images'
            ),
            Prefetch(
                'images',
                queryset=PortfolioImage.objects.select_related('image').filter(is_main=True),
                to_attr='main_images'
            ),
            Prefetch(
                'videos',
                queryset=PortfolioVideo.objects.select_related('video', 'video__cover_image').order_by('order', 'created_at')
            ),
            Prefetch(
                'audios',
                queryset=PortfolioAudio.objects.select_related('audio', 'audio__cover_image').order_by('order', 'created_at')
            ),
            Prefetch(
                'documents',
                queryset=PortfolioDocument.objects.select_related('document', 'document__cover_image').order_by('order', 'created_at')
            )
        ).annotate(
            total_media_count=Count('images', distinct=True) + 
                             Count('videos', distinct=True) +
                             Count('audios', distinct=True) +
                             Count('documents', distinct=True),
            categories_count=Count('categories', distinct=True),
            tags_count=Count('tags', distinct=True)
        )
    
    def for_public_listing(self):
        from src.portfolio.models.media import PortfolioImage
        return self.published().select_related('og_image').prefetch_related(
            'categories__image',
            Prefetch(
                'images',
                queryset=PortfolioImage.objects.filter(is_main=True).select_related('image'),
                to_attr='main_image_media'
            )
        )
    
    def for_detail(self):
        from src.portfolio.models.media import PortfolioImage, PortfolioVideo, PortfolioAudio, PortfolioDocument
        return self.select_related('og_image').prefetch_related(
            'categories',
            'tags', 
            'options',
            Prefetch(
                'images',
                queryset=PortfolioImage.objects.select_related('image').order_by('is_main', 'order', 'created_at'),
                to_attr='all_images'
            ),
            'images__image',
            Prefetch(
                'videos',
                queryset=PortfolioVideo.objects.select_related('video', 'video__cover_image', 'cover_image').order_by('order', 'created_at')
            ),
            'videos__video',
            'videos__video__cover_image',
            Prefetch(
                'audios',
                queryset=PortfolioAudio.objects.select_related('audio', 'audio__cover_image', 'cover_image').order_by('order', 'created_at')
            ),
            'audios__audio',
            'audios__audio__cover_image',
            Prefetch(
                'documents',
                queryset=PortfolioDocument.objects.select_related('document', 'document__cover_image', 'cover_image').order_by('order', 'created_at')
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


class PortfolioCategoryQuerySet(models.QuerySet):
    
    def public(self):
        return self.filter(is_public=True)
    
    def with_counts(self):
        return self.annotate(
            portfolio_count=Count('portfolio_categories', 
                                filter=Q(portfolio_categories__status='published'))
        )
    
    def roots(self):
        return self.filter(depth=1)
    
    def for_tree(self):
        return self.only('id', 'name', 'slug', 'depth', 'path', 'public_id')


class PortfolioTagQuerySet(models.QuerySet):
    
    def public(self):
        return self.filter(is_public=True)
    
    def popular(self, limit=10):
        return self.annotate(
            usage_count=Count('portfolio_tags')
        ).order_by('-usage_count')[:limit]
    
    def with_counts(self):
        return self.annotate(
            portfolio_count=Count('portfolio_tags',
                                filter=Q(portfolio_tags__status='published'))
        )


class PortfolioOptionQuerySet(models.QuerySet):
    
    def public(self):
        return self.filter(is_public=True)
    
    def with_portfolio_counts(self):
        return self.annotate(
            portfolio_count=Count('portfolio_options',
                                filter=Q(portfolio_options__is_public=True))
        )
