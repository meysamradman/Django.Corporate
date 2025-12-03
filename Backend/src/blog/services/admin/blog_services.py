from django.db.models import Prefetch, Count, Q
from django.core.paginator import Paginator
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from src.blog.models.blog import Blog
from src.blog.utils.cache import BlogCacheManager, BlogCacheKeys
from src.blog.models.media import BlogImage, BlogVideo, BlogAudio, BlogDocument
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
from src.blog.services.admin import BlogAdminMediaService
from src.blog.messages.messages import BLOG_ERRORS


class BlogAdminService:
    
    @staticmethod
    def get_blog_queryset(filters=None, search=None, order_by=None, order_desc=None):
        queryset = Blog.objects.select_related('og_image').prefetch_related(
            'categories',
            'tags',
            Prefetch(
                'images',
                queryset=BlogImage.objects.filter(is_main=True).select_related('image'),
                to_attr='main_image_media'
            ),
            'images',
            'videos',
            'audios',
            'documents'
        )
        
        if filters:
            if filters.get('status'):
                queryset = queryset.filter(status=filters['status'])
            if filters.get('is_featured') is not None:
                queryset = queryset.filter(is_featured=filters['is_featured'])
            if filters.get('is_public') is not None:
                queryset = queryset.filter(is_public=filters['is_public'])
            if filters.get('category_id'):
                queryset = queryset.filter(categories__id=filters['category_id'])
            
            if filters.get('seo_status'):
                if filters['seo_status'] == 'complete':
                    queryset = queryset.filter(
                        meta_title__isnull=False,
                        meta_description__isnull=False,
                        og_image__isnull=False
                    )
                elif filters['seo_status'] == 'incomplete':
                    queryset = queryset.filter(
                        Q(meta_title__isnull=False) | Q(meta_description__isnull=False)
                    ).exclude(
                        meta_title__isnull=False,
                        meta_description__isnull=False,
                        og_image__isnull=False
                    )
                elif filters['seo_status'] == 'missing':
                    queryset = queryset.filter(
                        meta_title__isnull=True,
                        meta_description__isnull=True
                    )
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(short_description__icontains=search) |
                Q(meta_title__icontains=search) |
                Q(meta_description__icontains=search)
            )
        
        if order_by:
            ordering_field = order_by
            if order_desc:
                ordering_field = f'-{order_by}'
            queryset = queryset.order_by(ordering_field)
        else:
            queryset = queryset.order_by('-created_at')
        
        queryset = queryset.annotate(
            categories_count=Count('categories', distinct=True),
            tags_count=Count('tags', distinct=True),
            media_count=Count('images', distinct=True) + Count('videos', distinct=True) + 
                       Count('audios', distinct=True) + Count('documents', distinct=True)
        )
        
        return queryset
    
    @staticmethod
    def get_blog_detail(blog_id):
        try:
            return Blog.objects.select_related('og_image').prefetch_related(
                'categories',
                'tags',
                'images',
                'videos',
                'audios',
                'documents'
            ).get(id=blog_id)
        except Blog.DoesNotExist:
            return None
    
    @staticmethod
    def create_blog(validated_data, created_by=None):
        if not validated_data.get('meta_title') and validated_data.get('title'):
            validated_data['meta_title'] = validated_data['title'][:70]
            
        if not validated_data.get('meta_description') and validated_data.get('short_description'):
            validated_data['meta_description'] = validated_data['short_description'][:300]
        
        if not validated_data.get('og_title') and validated_data.get('meta_title'):
            validated_data['og_title'] = validated_data['meta_title']
            
        if not validated_data.get('og_description') and validated_data.get('meta_description'):
            validated_data['og_description'] = validated_data['meta_description']
        
        if 'canonical_url' in validated_data and validated_data.get('canonical_url'):
            canonical_url = validated_data['canonical_url']
            if not canonical_url.startswith(('http://', 'https://')):
                validated_data['canonical_url'] = None
        
        return Blog.objects.create(**validated_data)
    
    @staticmethod
    def create_blog_with_media(validated_data, media_files, created_by=None):
        blog = BlogAdminService.create_blog(validated_data, created_by)
        
        if media_files:
            result = BlogAdminMediaService.add_media_bulk(
                blog_id=blog.id,
                media_files=media_files,
                created_by=created_by
            )
        
        return blog

    @staticmethod
    def set_main_image(blog_id, media_id):
        try:
            blog = Blog.objects.get(id=blog_id)
        except Blog.DoesNotExist:
            raise Blog.DoesNotExist("Blog not found")
        
        BlogImage.objects.filter(
            blog=blog,
            is_main=True
        ).update(is_main=False)
        
        try:
            blog_image = BlogImage.objects.get(
                blog=blog,
                image_id=media_id
            )
        except BlogImage.DoesNotExist:
            raise BlogImage.DoesNotExist("Blog image not found")
        blog_image.is_main = True
        blog_image.save()
        
        if not blog.og_image:
            blog.og_image = blog_image.image
            blog.save(update_fields=['og_image'])
        
        return blog_image
    
    @staticmethod
    def bulk_update_status(blog_ids, new_status):
        if new_status not in dict(Blog.STATUS_CHOICES):
            return False
            
        Blog.objects.filter(id__in=blog_ids).update(
            status=new_status,
            updated_at=timezone.now()
        )
        return True
    
    @staticmethod
    def bulk_update_seo(blog_ids, seo_data):
        blogs = Blog.objects.filter(id__in=blog_ids)
        
        for blog in blogs:
            if not blog.meta_title and blog.title:
                blog.meta_title = blog.title[:70]
            if not blog.meta_description and blog.short_description:
                blog.meta_description = blog.short_description[:300]
            if not blog.og_title and blog.meta_title:
                blog.og_title = blog.meta_title
            if not blog.og_description and blog.meta_description:
                blog.og_description = blog.meta_description
            
            blog.save()
        
        return True
    
    @staticmethod
    def get_seo_report():
        cache_key = BlogCacheKeys.seo_report()
        cached_report = cache.get(cache_key)
        if cached_report:
            return cached_report
        
        total = Blog.objects.count()
        
        if total == 0:
            report_data = {
                'total': 0,
                'complete_seo': 0,
                'partial_seo': 0,
                'no_seo': 0,
                'completion_percentage': 0,
                'og_image_count': 0,
                'canonical_url_count': 0
            }
            cache.set(cache_key, report_data, 600)
            return report_data
        
        complete_seo = Blog.objects.filter(
            meta_title__isnull=False,
            meta_description__isnull=False,
            og_image__isnull=False
        ).count()
        
        partial_seo = Blog.objects.filter(
            Q(meta_title__isnull=False) | Q(meta_description__isnull=False) | Q(og_image__isnull=False)
        ).exclude(
            meta_title__isnull=False,
            meta_description__isnull=False,
            og_image__isnull=False
        ).count()
        
        no_seo = total - complete_seo - partial_seo
        
        og_image_count = Blog.objects.filter(og_image__isnull=False).count()
        canonical_url_count = Blog.objects.filter(canonical_url__isnull=False).count()
        
        report_data = {
            'total': total,
            'complete_seo': complete_seo,
            'partial_seo': partial_seo,
            'no_seo': no_seo,
            'completion_percentage': round((complete_seo / total * 100), 1),
            'og_image_count': og_image_count,
            'canonical_url_count': canonical_url_count
        }
        
        cache.set(cache_key, report_data, 600)
        return report_data
    
    @staticmethod
    def delete_blog(blog_id):
        try:
            blog = Blog.objects.get(id=blog_id)
        except Blog.DoesNotExist:
            raise Blog.DoesNotExist("Blog not found")
        
        blog_medias = BlogImage.objects.filter(blog=blog)
        media_ids = list(blog_medias.values_list('image_id', flat=True))
        
        blog.delete()
        
        return True
    
    @staticmethod
    def bulk_delete_blogs(blog_ids):
        if not blog_ids:
            raise ValidationError(BLOG_ERRORS["blog_ids_required"])
        
        blogs = Blog.objects.filter(id__in=blog_ids)
        
        if not blogs.exists():
            raise ValidationError(BLOG_ERRORS["blogs_not_found"])
        
        with transaction.atomic():
            deleted_count = blogs.count()
            blogs.delete()
            
            BlogCacheManager.invalidate_blogs(blog_ids)
        
        return deleted_count


class BlogAdminStatusService:
    
    @staticmethod
    def change_status(blog_id, new_status):
        try:
            blog = Blog.objects.get(id=blog_id)
        except Blog.DoesNotExist:
            raise Blog.DoesNotExist("Blog not found")

        if new_status not in dict(Blog.STATUS_CHOICES):
            return None

        blog.status = new_status
        blog.save(update_fields=['status', 'updated_at'])
        return blog
    
    @staticmethod
    def publish_blog(blog_id):
        try:
            blog = Blog.objects.get(id=blog_id)
        except Blog.DoesNotExist:
            raise Blog.DoesNotExist("Blog not found")
        
        seo_warnings = []
        if not blog.meta_title:
            seo_warnings.append("Meta title is missing")
        if not blog.meta_description:
            seo_warnings.append("Meta description is missing")
        if not blog.og_image:
            seo_warnings.append("OG image is missing")
        
        blog.status = 'published'
        blog.save(update_fields=['status', 'updated_at'])
        
        return {
            'blog': blog,
            'seo_warnings': seo_warnings
        }


class BlogAdminSEOService:
    
    @staticmethod
    def auto_generate_seo(blog_id):
        try:
            blog = Blog.objects.get(id=blog_id)
        except Blog.DoesNotExist:
            raise Blog.DoesNotExist("Blog not found")
        
        updates = {}
        
        if not blog.meta_title and blog.title:
            updates['meta_title'] = blog.title[:70]
        
        if not blog.meta_description and blog.short_description:
            updates['meta_description'] = blog.short_description[:300]
        
        if not blog.og_title and (blog.meta_title or blog.title):
            updates['og_title'] = (blog.meta_title or blog.title)[:70]
        
        if not blog.og_description and (blog.meta_description or blog.short_description):
            updates['og_description'] = (blog.meta_description or blog.short_description)[:300]
        
        if blog.canonical_url and not blog.canonical_url.startswith(('http://', 'https://')):
            updates['canonical_url'] = None
        
        if not blog.og_image:
            main_image = blog.get_main_image()
            if main_image:
                updates['og_image'] = main_image
        
        if updates:
            for field, value in updates.items():
                setattr(blog, field, value)
            blog.save()
        
        return blog
    
    @staticmethod
    def validate_seo_data(blog_id):
        try:
            blog = Blog.objects.get(id=blog_id)
        except Blog.DoesNotExist:
            raise Blog.DoesNotExist("Blog not found")
        
        suggestions = []
        
        if blog.meta_title:
            if len(blog.meta_title) > 60:
                suggestions.append("Meta title should be under 60 characters for optimal display")
        
        if blog.meta_description:
            if len(blog.meta_description) < 120:
                suggestions.append("Meta description should be at least 120 characters")
            elif len(blog.meta_description) > 160:
                suggestions.append("Meta description should be under 160 characters")
        
        if not blog.og_image:
            suggestions.append("Adding an OG image improves social media sharing")
        
        return {
            'is_valid': len(suggestions) == 0,
            'suggestions': suggestions,
            'completeness_score': blog.seo_completeness_score() if hasattr(blog, 'seo_completeness_score') else None
        }