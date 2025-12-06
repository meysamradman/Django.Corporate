from django.db import models
from django.db.models import Prefetch, Count, Q


class ProductQuerySet(models.QuerySet):
    
    def published(self):
        return self.filter(status='published', is_public=True)
    
    def active(self):
        return self.filter(is_active=True)
    
    def with_relations(self):
        from src.store.models.media import ProductImage
        
        return self.select_related(
            'category',
        ).prefetch_related(
            'tags',
            Prefetch(
                'images',
                queryset=ProductImage.objects.select_related('image').order_by('is_main', 'order', 'created_at'),
                to_attr='all_images'
            ),
            Prefetch(
                'images',
                queryset=ProductImage.objects.select_related('image').filter(is_main=True),
                to_attr='main_images'
            ),
            'videos__video',
            'videos__video__cover_image',
            'audios__audio',
            'audios__audio__cover_image',
            'documents__document',
            'documents__document__cover_image'
        )
    
    def search(self, query):
        return self.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(sku__icontains=query) |
            Q(short_description__icontains=query)
        ).distinct()
    
    def featured(self):
        return self.filter(is_featured=True)
    
    def in_stock(self):
        return self.filter(stock_quantity__gt=0)
    
    def out_of_stock(self):
        return self.filter(stock_quantity=0)
    
    def by_category(self, category_id):
        return self.filter(category_id=category_id)
    
    def for_admin_listing(self):
        from src.store.models.media import ProductImage
        return self.select_related('category', 'og_image').prefetch_related(
            'tags',
            Prefetch(
                'images',
                queryset=ProductImage.objects.select_related('image').order_by('is_main', 'order', 'created_at'),
                to_attr='all_images'
            ),
            Prefetch(
                'images',
                queryset=ProductImage.objects.select_related('image').filter(is_main=True),
                to_attr='main_images'
            ),
        ).annotate(
            total_media_count=Count('images', distinct=True) + 
                             Count('videos', distinct=True) +
                             Count('audios', distinct=True) +
                             Count('documents', distinct=True),
            tags_count=Count('tags', distinct=True)
        )
    
    def for_public_listing(self):
        from src.store.models.media import ProductImage
        return self.published().select_related('category').prefetch_related(
            'tags',
            Prefetch(
                'images',
                queryset=ProductImage.objects.select_related('image').filter(is_main=True).order_by('order', 'created_at'),
                to_attr='main_images'
            ),
        ).annotate(
            tags_count=Count('tags', distinct=True)
        )


class ProductCategoryQuerySet(models.QuerySet):
    
    def active(self):
        return self.filter(is_public=True, is_active=True)
    
    def public(self):
        return self.filter(is_public=True)
    
    def root_categories(self):
        return self.filter(depth=1)
    
    def with_counts(self):
        return self.annotate(
            products_count=Count('products', 
                                filter=Q(products__status='published', products__is_public=True))
        )


class ProductTagQuerySet(models.QuerySet):
    
    def active(self):
        return self.filter(is_public=True, is_active=True)
    
    def public(self):
        return self.filter(is_public=True)
    
    def popular(self, limit=10):
        return self.filter(is_public=True).annotate(
            usage_count=Count('products', filter=Q(products__status='published', products__is_public=True))
        ).order_by('-usage_count')[:limit]
    
    def with_counts(self):
        return self.annotate(
            products_count=Count('products', 
                                filter=Q(products__status='published', products__is_public=True))
        )
