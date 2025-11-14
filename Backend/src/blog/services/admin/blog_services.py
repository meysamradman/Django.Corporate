from django.db.models import Prefetch, Count, Q
from django.core.paginator import Paginator
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone
from src.blog.models.blog import Blog
from src.blog.utils.cache import BlogCacheManager
from src.blog.models.media import BlogImage, BlogVideo, BlogAudio, BlogDocument
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia


class BlogAdminService:
    """
    Optimized Blog service with SEO support and media integration
    Compatible with central media app
    """
    
    @staticmethod
    def get_blog_queryset(filters=None, search=None, order_by=None, order_desc=None):
        """Return optimized queryset for admin listing; pagination handled at view layer"""
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
        
        # Apply filters
        if filters:
            if filters.get('status'):
                queryset = queryset.filter(status=filters['status'])
            if filters.get('is_featured') is not None:
                queryset = queryset.filter(is_featured=filters['is_featured'])
            if filters.get('is_public') is not None:
                queryset = queryset.filter(is_public=filters['is_public'])
            if filters.get('category_id'):
                queryset = queryset.filter(categories__id=filters['category_id'])
            
            # SEO filters
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
        
        # Apply search
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(short_description__icontains=search) |
                Q(meta_title__icontains=search) |
                Q(meta_description__icontains=search)
            )
        
        # Apply ordering
        if order_by:
            ordering_field = order_by
            if order_desc:
                ordering_field = f'-{order_by}'
            queryset = queryset.order_by(ordering_field)
        else:
            # Default ordering
            queryset = queryset.order_by('-created_at')
        
        # Add annotation for counts (optimized)
        queryset = queryset.annotate(
            categories_count=Count('categories', distinct=True),
            tags_count=Count('tags', distinct=True),
            media_count=Count('images', distinct=True) + Count('videos', distinct=True) + 
                       Count('audios', distinct=True) + Count('documents', distinct=True)
        )
        
        return queryset
    
    @staticmethod
    def get_blog_detail(blog_id):
        """Get single blog with all relations for admin"""
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
        """Create blog with auto SEO generation"""
        # Auto-generate SEO if not provided
        if not validated_data.get('meta_title') and validated_data.get('title'):
            validated_data['meta_title'] = validated_data['title'][:70]
            
        if not validated_data.get('meta_description') and validated_data.get('short_description'):
            validated_data['meta_description'] = validated_data['short_description'][:300]
        
        # Auto-generate OG fields if not provided
        if not validated_data.get('og_title') and validated_data.get('meta_title'):
            validated_data['og_title'] = validated_data['meta_title']
            
        if not validated_data.get('og_description') and validated_data.get('meta_description'):
            validated_data['og_description'] = validated_data['meta_description']
        
        # Handle canonical URL - set to None if it's an invalid relative path
        # The model will auto-generate it properly in the save method
        if 'canonical_url' in validated_data and validated_data.get('canonical_url'):
            canonical_url = validated_data['canonical_url']
            # Check if it's a valid URL (starts with http or https)
            if not canonical_url.startswith(('http://', 'https://')):
                # If it's not a valid URL, set it to None
                validated_data['canonical_url'] = None
        
        return Blog.objects.create(**validated_data)
    
    @staticmethod
    def create_blog_with_media(validated_data, media_files, created_by=None):
        """Create blog with media files from central media app using optimized service"""
        # First create the blog
        blog = BlogAdminService.create_blog(validated_data, created_by)
        
        if media_files:
            # Add media using the new optimized service
            from src.blog.services.admin import BlogAdminMediaService
            result = BlogAdminMediaService.add_media_bulk(
                blog_id=blog.id,
                media_files=media_files,
                created_by=created_by
            )
            
            # The service handles setting the main image automatically
        
        return blog

    # Removed: This method is now handled by BlogAdminMediaService.add_media_bulk
    # which provides better performance and avoids N+1 query problems

    @staticmethod
    def set_main_image(blog_id, media_id):
        """Set main image for blog"""
        try:
            blog = Blog.objects.get(id=blog_id)
        except Blog.DoesNotExist:
            raise Blog.DoesNotExist("Blog not found")
        
        # Remove current main image
        BlogImage.objects.filter(
            blog=blog,
            is_main=True
        ).update(is_main=False)
        
        # Set new main image
        try:
            blog_image = BlogImage.objects.get(
                blog=blog,
                image_id=media_id
            )
        except BlogImage.DoesNotExist:
            raise BlogImage.DoesNotExist("Blog image not found")
        blog_image.is_main = True
        blog_image.save()
        
        # Also set as OG image if not set
        if not blog.og_image:
            blog.og_image = blog_image.image
            blog.save(update_fields=['og_image'])
        
        return blog_image
    
    @staticmethod
    def bulk_update_status(blog_ids, new_status):
        """Bulk status update"""
        if new_status not in dict(Blog.STATUS_CHOICES):
            return False
            
        Blog.objects.filter(id__in=blog_ids).update(
            status=new_status,
            updated_at=timezone.now()
        )
        return True
    
    @staticmethod
    def bulk_update_seo(blog_ids, seo_data):
        """Bulk SEO update"""
        blogs = Blog.objects.filter(id__in=blog_ids)
        
        for blog in blogs:
            # Auto-generate missing SEO data
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
        """Get comprehensive SEO report with caching"""
        from src.blog.utils.cache import BlogCacheKeys
        # Try to get from cache first
        cache_key = BlogCacheKeys.seo_report()
        cached_report = cache.get(cache_key)
        if cached_report:
            return cached_report
        
        """Get comprehensive SEO report"""
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
            # Cache for 10 minutes
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
        
        # Cache for 10 minutes
        cache.set(cache_key, report_data, 600)
        return report_data
    
    @staticmethod
    def delete_blog(blog_id):
        """Delete blog and handle media cleanup"""
        try:
            blog = Blog.objects.get(id=blog_id)
        except Blog.DoesNotExist:
            raise Blog.DoesNotExist("Blog not found")
        
        # Get associated media files for potential cleanup
        blog_medias = BlogImage.objects.filter(blog=blog)
        media_ids = list(blog_medias.values_list('image_id', flat=True))
        
        # Delete blog (will cascade to BlogMedia)
        blog.delete()
        
        # Note: Media cleanup is not implemented as there's no cleanup_orphaned_media method
        # This should be handled separately if needed
        
        return True
    
    @staticmethod
    def bulk_delete_blogs(blog_ids):
        """Bulk delete multiple blogs with optimized query"""
        from django.core.exceptions import ValidationError
        
        if not blog_ids:
            raise ValidationError("Blog IDs required")
        
        blogs = Blog.objects.filter(id__in=blog_ids)
        
        if not blogs.exists():
            raise ValidationError("Selected blogs not found")
        
        with transaction.atomic():
            deleted_count = blogs.count()
            blogs.delete()
            
            # Clear cache if needed
            BlogCacheManager.invalidate_blogs(blog_ids)
        
        return deleted_count


class BlogAdminStatusService:
    """Service for blog status management"""
    
    @staticmethod
    def change_status(blog_id, new_status):
        """Change blog status with validation"""
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
        """Publish blog with SEO validation"""
        try:
            blog = Blog.objects.get(id=blog_id)
        except Blog.DoesNotExist:
            raise Blog.DoesNotExist("Blog not found")
        
        # Check if SEO is complete for publishing
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
    """Dedicated service for SEO operations"""
    
    @staticmethod
    def auto_generate_seo(blog_id):
        """Auto-generate SEO data for blog"""
        try:
            blog = Blog.objects.get(id=blog_id)
        except Blog.DoesNotExist:
            raise Blog.DoesNotExist("Blog not found")
        
        updates = {}
        
        # Generate meta title
        if not blog.meta_title and blog.title:
            updates['meta_title'] = blog.title[:70]
        
        # Generate meta description
        if not blog.meta_description and blog.short_description:
            updates['meta_description'] = blog.short_description[:300]
        
        # Generate OG data
        if not blog.og_title and (blog.meta_title or blog.title):
            updates['og_title'] = (blog.meta_title or blog.title)[:70]
        
        if not blog.og_description and (blog.meta_description or blog.short_description):
            updates['og_description'] = (blog.meta_description or blog.short_description)[:300]
        
        # Generate canonical URL - let the model handle this properly
        # Remove any invalid canonical_url that might have been set
        if blog.canonical_url and not blog.canonical_url.startswith(('http://', 'https://')):
            updates['canonical_url'] = None
        
        # Auto-set OG image from main image
        if not blog.og_image:
            main_image = blog.get_main_image()
            if main_image:
                updates['og_image'] = main_image
        
        # Apply updates
        if updates:
            for field, value in updates.items():
                setattr(blog, field, value)
            blog.save()
        
        return blog
    
    @staticmethod
    def validate_seo_data(blog_id):
        """Validate SEO data and return suggestions"""
        try:
            blog = Blog.objects.get(id=blog_id)
        except Blog.DoesNotExist:
            raise Blog.DoesNotExist("Blog not found")
        
        suggestions = []
        
        # Title length check
        if blog.meta_title:
            if len(blog.meta_title) > 60:
                suggestions.append("Meta title should be under 60 characters for optimal display")
        
        # Description length check
        if blog.meta_description:
            if len(blog.meta_description) < 120:
                suggestions.append("Meta description should be at least 120 characters")
            elif len(blog.meta_description) > 160:
                suggestions.append("Meta description should be under 160 characters")
        
        # Image check
        if not blog.og_image:
            suggestions.append("Adding an OG image improves social media sharing")
        
        return {
            'is_valid': len(suggestions) == 0,
            'suggestions': suggestions,
            'completeness_score': blog.seo_completeness_score() if hasattr(blog, 'seo_completeness_score') else None
        }