from django.db import transaction, models
from django.db.models import Count
from django.core.cache import cache
from django.core.exceptions import ValidationError

from src.blog.models.category import BlogCategory
from src.blog.utils.cache import CategoryCacheKeys, CategoryCacheManager


class BlogCategoryAdminService:
    """Optimized service for Blog Category admin operations with tree support"""
    
    @staticmethod
    def get_tree_queryset():
        """Get optimized queryset for tree operations"""
        return BlogCategory.objects.select_related('image').annotate(
            blog_count=Count('blog_categories', distinct=True)
        ).order_by('path')
    
    @staticmethod
    def get_category_by_id(category_id):
        """Get category by ID with optimized relations"""
        try:
            return BlogCategoryAdminService.get_tree_queryset().get(id=category_id)
        except BlogCategory.DoesNotExist:
            return None
    
    @staticmethod
    def get_root_categories():
        """Get root categories with blog counts"""
        cache_key = CategoryCacheKeys.root_categories()
        root_categories = cache.get(cache_key)
        
        if root_categories is None:
            root_categories = list(
                BlogCategory.get_root_nodes().annotate(
                    blog_count=Count('blog_categories', distinct=True)
                ).values(
                    'id', 'public_id', 'name', 'slug', 'blog_count'
                )
            )
            cache.set(cache_key, root_categories, 300)
        
        return root_categories

    @staticmethod
    def get_tree_data():
        """Get complete tree structure for admin interface"""
        cache_key = CategoryCacheKeys.tree_admin()
        tree_data = cache.get(cache_key)
        
        if tree_data is None:
            def build_tree(nodes):
                tree = []
                for node in nodes:
                    children = node.get_children().filter(is_active=True)
                    tree_node = {
                        'id': node.id,
                        'public_id': node.public_id,
                        'name': node.name,
                        'slug': node.slug,
                        'level': node.get_depth(),
                        'blog_count': getattr(node, 'blog_count', 0),
                        'children': build_tree(children) if children else []
                    }
                    tree.append(tree_node)
                return tree
            
            root_nodes = BlogCategory.get_root_nodes().annotate(
                blog_count=Count('blog_categories', distinct=True)
            ).filter(is_active=True)
            
            tree_data = build_tree(root_nodes)
            cache.set(cache_key, tree_data, 900)
        
        return tree_data

    @staticmethod
    def create_category(validated_data, created_by=None):
        """Create category with proper tree positioning"""
        with transaction.atomic():
            # Handle parent positioning
            parent_id = validated_data.pop('parent_id', None)
            image_id = validated_data.pop('image_id', None)
            
            # Remove created_by from validated_data as it's not a model field
            validated_data.pop('created_by', None)
            
            if parent_id:
                # Add as child of parent
                category = parent_id.add_child(**validated_data)
            else:
                # Add as root category
                category = BlogCategory.add_root(**validated_data)
            
            # Handle image assignment from central media app
            if image_id:
                from src.media.models.media import ImageMedia
                try:
                    media = ImageMedia.objects.get(id=image_id)
                    category.image = media
                    category.save()
                except ImageMedia.DoesNotExist:
                    pass  # Invalid media ID, skip
            
            CategoryCacheManager.invalidate_all()
            
            return category

    @staticmethod
    def update_category_by_id(category_id, validated_data, updated_by=None):
        """Update category with tree operations support"""
        category = BlogCategoryAdminService.get_category_by_id(category_id)
        
        if not category:
            raise BlogCategory.DoesNotExist("Category not found")
        
        with transaction.atomic():
            # Handle parent change (move in tree)
            parent_id = validated_data.pop('parent_id', None)
            image_id = validated_data.pop('image_id', None)
            
            # Remove updated_by from validated_data as it's not a model field
            validated_data.pop('updated_by', None)
            
            # Update basic fields
            for field, value in validated_data.items():
                setattr(category, field, value)
            
            # Handle tree movement
            if parent_id is not None:
                current_parent = category.get_parent()
                
                # Only move if parent actually changed
                if (current_parent and current_parent.id != parent_id.id) or \
                   (not current_parent and parent_id):
                    category.move(parent_id, pos='last-child')
                elif not parent_id and current_parent:
                    # Move to root
                    category.move(BlogCategory.get_root_nodes().first(), pos='last-sibling')
            
            # Handle image assignment from central media app
            if image_id is not None:
                from src.media.models.media import ImageMedia
                if image_id:
                    try:
                        media = ImageMedia.objects.get(id=image_id)
                        category.image = media
                    except ImageMedia.DoesNotExist:
                        pass  # Invalid media ID, skip
                else:
                    category.image = None
            
        category.save()
        
        CategoryCacheManager.invalidate_all()
        
        return category

    @staticmethod
    def delete_category_by_id(category_id):
        """Delete category with safety checks"""
        category = BlogCategoryAdminService.get_category_by_id(category_id)
        
        if not category:
            raise BlogCategory.DoesNotExist("Category not found")
        
        # Check if category has blogs
        blog_count = category.blog_categories.count()
        if blog_count > 0:
            raise ValidationError(f"Category has {blog_count} blogs")
        
        # Check if category has children
        children_count = category.get_children_count()
        if children_count > 0:
            raise ValidationError(f"Category has {children_count} children")
        
        with transaction.atomic():
            category.delete()
            CategoryCacheManager.invalidate_all()
    
    @staticmethod
    def move_category(category_id, target_id, position='last-child'):
        """Move category to new position in tree"""
        category = BlogCategoryAdminService.get_category_by_id(category_id)
        target = BlogCategoryAdminService.get_category_by_id(target_id)
        
        if not category or not target:
            raise BlogCategory.DoesNotExist("Category not found")
        
        # Prevent moving to descendant
        if target.is_descendant_of(category):
            raise ValidationError("Cannot move category to its own descendant")
        
        # Prevent moving to self
        if category.id == target.id:
            raise ValidationError("Cannot move category to itself")
        
        with transaction.atomic():
            category.move(target, pos=position)
            CategoryCacheManager.invalidate_all()
    
    @staticmethod
    def get_popular_categories(limit=10):
        """Get most popular categories by blog count"""
        cache_key = CategoryCacheKeys.popular(limit)
        popular = cache.get(cache_key)
        
        if popular is None:
            popular = list(
                BlogCategory.objects.annotate(
                    blog_count=Count('blog_categories')
                ).filter(
                    blog_count__gt=0, is_active=True
                ).order_by('-blog_count')[:limit].values(
                    'id', 'public_id', 'name', 'slug', 'blog_count'
                )
            )
            cache.set(cache_key, popular, 600)
        
        return popular
    
    @staticmethod
    def get_breadcrumbs(category):
        """Get category breadcrumbs"""
        ancestors = category.get_ancestors()
        breadcrumbs = []
        
        for ancestor in ancestors:
            breadcrumbs.append({
                'id': ancestor.id,
                'name': ancestor.name,
                'slug': ancestor.slug
            })
        
        breadcrumbs.append({
            'id': category.id,
            'name': category.name,
            'slug': category.slug
        })
        
        return breadcrumbs
    
    @staticmethod
    def bulk_delete_categories(category_ids):
        """Bulk delete multiple categories with cascade delete for children - removes relationships first"""
        from src.blog.models.blog import Blog
        
        categories = BlogCategory.objects.filter(id__in=category_ids)
        
        if not categories.exists():
            raise ValidationError("Selected categories not found")
        
        with transaction.atomic():
            # Collect all categories to delete (including children)
            all_category_ids = set()
            category_list = list(categories)
            
            # Filter out categories that are descendants of other selected categories
            # to avoid trying to delete them twice
            top_level_categories = []
            for category in category_list:
                # Check if this category is a descendant of any other selected category
                is_descendant = False
                for other_category in category_list:
                    if other_category.id != category.id:
                        # Check if category is a descendant of other_category
                        if category.is_descendant_of(other_category):
                            is_descendant = True
                            break
                
                if not is_descendant:
                    top_level_categories.append(category)
                    all_category_ids.add(category.id)
                    # Get all descendants
                    descendants = category.get_descendants()
                    all_category_ids.update(descendant.id for descendant in descendants)
            
            # Get all categories (including children) to clear relationships
            all_categories = BlogCategory.objects.filter(id__in=all_category_ids)
            
            # Remove relationships from blogs for all categories (including children)
            for category in all_categories:
                category.blog_categories.clear()
            
            # Delete parent categories - treebeard's delete() automatically handles cascade
            # We delete parents first, and treebeard will handle children automatically
            deleted_count = 0
            for category in top_level_categories:
                # Count descendants before deletion
                descendants_count = category.get_descendants().count()
                # treebeard's delete() automatically deletes all descendants
                category.delete()
                deleted_count += 1 + descendants_count
            
            CategoryCacheManager.invalidate_all()
        
        return deleted_count
    
    @staticmethod
    def get_category_statistics():
        """Get category statistics for admin dashboard"""
        cache_key = CategoryCacheKeys.statistics()
        stats = cache.get(cache_key)
        
        if stats is None:
            total_categories = BlogCategory.objects.count()
            active_categories = BlogCategory.objects.filter(is_active=True).count()
            public_categories = BlogCategory.objects.filter(is_public=True).count()
            used_categories = BlogCategory.objects.filter(
                blog_categories__isnull=False
            ).distinct().count()
            
            root_categories = BlogCategory.get_root_nodes().count()
            max_depth = BlogCategory.objects.aggregate(
                max_depth=models.Max('depth')
            )['max_depth'] or 0
            
            stats = {
                'total_categories': total_categories,
                'active_categories': active_categories,
                'public_categories': public_categories,
                'used_categories': used_categories,
                'unused_categories': total_categories - used_categories,
                'root_categories': root_categories,
                'max_depth': max_depth
            }
            cache.set(cache_key, stats, 300)
        
        return stats