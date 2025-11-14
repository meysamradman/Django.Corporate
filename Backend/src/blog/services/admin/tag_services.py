from django.db.models import Count, Q
from django.core.cache import cache
from django.core.exceptions import ValidationError
from src.blog.models.tag import BlogTag
from src.blog.utils.cache import TagCacheKeys, TagCacheManager


class BlogTagAdminService:
    """Enhanced Tag service for admin with caching and bulk operations"""
    
    @staticmethod
    def get_tag_queryset(filters=None, search=None):
        """Get optimized tag queryset for admin"""
        queryset = BlogTag.objects.with_counts()
        
        # Apply filters
        if filters:
            if filters.get('is_active') is not None:
                queryset = queryset.filter(is_active=filters['is_active'])
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Order by usage count and name
        return queryset.order_by('-blog_count', 'name')
    
    @staticmethod
    def get_tag_by_id(tag_id):
        """Get tag by ID with caching"""
        cache_key = TagCacheKeys.tag(tag_id)
        tag = cache.get(cache_key)
        
        if tag is None:
            try:
                tag = BlogTag.objects.annotate(
                    blog_count=Count('blog_tags')
                ).get(id=tag_id)
                cache.set(cache_key, tag, 3600)
            except BlogTag.DoesNotExist:
                return None
        
        return tag

    @staticmethod
    def create_tag(validated_data, created_by=None):
        """Create tag with auto-slug generation"""
        # Auto-generate slug if not provided
        if not validated_data.get('slug') and validated_data.get('name'):
            from django.utils.text import slugify
            validated_data['slug'] = slugify(validated_data['name'])
        
        tag = BlogTag.objects.create(**validated_data)
        
        TagCacheManager.invalidate_all()
        
        return tag

    @staticmethod
    def update_tag_by_id(tag_id, validated_data):
        """Update tag and clear caches"""
        try:
            tag = BlogTag.objects.get(id=tag_id)
        except BlogTag.DoesNotExist:
            raise BlogTag.DoesNotExist("Tag not found")
        
        for key, value in validated_data.items():
            setattr(tag, key, value)
        
        tag.save()
        
        TagCacheManager.invalidate_tag(tag_id)
        
        return tag

    @staticmethod
    def delete_tag_by_id(tag_id):
        """Delete tag with safety checks"""
        try:
            tag = BlogTag.objects.get(id=tag_id)
        except BlogTag.DoesNotExist:
            raise BlogTag.DoesNotExist("Tag not found")
        
        # Check if tag is used
        blog_count = tag.blog_tags.count()
        if blog_count > 0:
            raise ValidationError(f"Tag is used by {blog_count} blogs")
        
        tag.delete()
        
        TagCacheManager.invalidate_tag(tag_id)
    
    @staticmethod
    def bulk_delete_tags(tag_ids):
        """Bulk delete multiple tags - removes relationships first, then deletes tags"""
        from django.db import transaction
        from src.blog.models.blog import Blog
        
        tags = BlogTag.objects.filter(id__in=tag_ids)
        
        if not tags.exists():
            raise ValidationError("Selected tags not found")
        
        with transaction.atomic():
            # Remove relationships from blogs (ManyToMany will be cleared automatically)
            tag_list = list(tags)
            for tag in tag_list:
                # Remove tag from all blogs
                tag.blog_tags.clear()
            
            deleted_count = tags.count()
            tags.delete()
            
            TagCacheManager.invalidate_tags(tag_ids)
        
        return deleted_count
    
    @staticmethod
    def get_popular_tags(limit=10):
        """Get most popular tags with caching"""
        cache_key = TagCacheKeys.popular()
        tags = cache.get(cache_key)
        
        if tags is None:
            tags = list(BlogTag.objects.popular(limit).values(
                'id', 'name', 'slug', 'usage_count'
            ))
            cache.set(cache_key, tags, 3600)
        
        return tags
    
    @staticmethod
    def merge_tags(source_tag_id, target_tag_id):
        """Merge one tag into another"""
        try:
            source_tag = BlogTag.objects.get(id=source_tag_id)
            target_tag = BlogTag.objects.get(id=target_tag_id)
        except BlogTag.DoesNotExist:
            raise BlogTag.DoesNotExist("Tag not found")
        
        # Move all blogs from source to target
        blogs = source_tag.blog_tags.all()
        for blog in blogs:
            # Remove from source
            blog.tags.remove(source_tag)
            # Add to target (if not already)
            if not blog.tags.filter(id=target_tag_id).exists():
                blog.tags.add(target_tag)
        
        # Delete source tag
        source_tag.delete()
        
        TagCacheManager.invalidate_tags([source_tag_id, target_tag_id])
        
        return target_tag

