from django.db import transaction, models
from django.db.models import Count
from django.core.cache import cache
from django.core.exceptions import ValidationError

from src.portfolio.models.category import PortfolioCategory


class PortfolioCategoryAdminService:
    """Optimized service for Portfolio Category admin operations with tree support"""
    
    @staticmethod
    def get_tree_queryset():
        """Get optimized queryset for tree operations"""
        return PortfolioCategory.objects.select_related('image').annotate(
            portfolio_count=Count('portfolio_categories', distinct=True)
        ).order_by('path')
    
    @staticmethod
    def get_category_by_id(category_id):
        """Get category by ID with optimized relations"""
        try:
            return PortfolioCategoryAdminService.get_tree_queryset().get(id=category_id)
        except PortfolioCategory.DoesNotExist:
            return None
    
    @staticmethod
    def get_root_categories():
        """Get root categories with portfolio counts"""
        cache_key = 'portfolio_root_categories'
        root_categories = cache.get(cache_key)
        
        if root_categories is None:
            root_categories = list(
                PortfolioCategory.get_root_nodes().annotate(
                    portfolio_count=Count('portfolio_categories', distinct=True)
                ).values(
                    'id', 'public_id', 'name', 'slug', 'portfolio_count'
                )
            )
            cache.set(cache_key, root_categories, 300)  # 5 minutes
        
        return root_categories

    @staticmethod
    def get_tree_data():
        """Get complete tree structure for admin interface"""
        cache_key = 'portfolio_category_tree_admin'
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
                        'portfolio_count': getattr(node, 'portfolio_count', 0),
                        'children': build_tree(children) if children else []
                    }
                    tree.append(tree_node)
                return tree
            
            root_nodes = PortfolioCategory.get_root_nodes().annotate(
                portfolio_count=Count('portfolio_categories', distinct=True)
            ).filter(is_active=True)
            
            tree_data = build_tree(root_nodes)
            cache.set(cache_key, tree_data, 900)  # 15 minutes
        
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
                category = PortfolioCategory.add_root(**validated_data)
            
            # Handle image assignment from central media app
            if image_id:
                from src.media.models.media import ImageMedia
                try:
                    media = ImageMedia.objects.get(id=image_id)
                    category.image = media
                    category.save()
                except ImageMedia.DoesNotExist:
                    pass  # Invalid media ID, skip
            
            # Clear cache
            PortfolioCategoryAdminService._clear_category_cache()
            
            return category

    @staticmethod
    def update_category_by_id(category_id, validated_data, updated_by=None):
        """Update category with tree operations support"""
        category = PortfolioCategoryAdminService.get_category_by_id(category_id)
        
        if not category:
            raise ValidationError("دسته‌بندی یافت نشد.")
        
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
                    category.move(PortfolioCategory.get_root_nodes().first(), pos='last-sibling')
            
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
        
        # Clear cache
        PortfolioCategoryAdminService._clear_category_cache()
        
        return category

    @staticmethod
    def delete_category_by_id(category_id):
        """Delete category with safety checks"""
        category = PortfolioCategoryAdminService.get_category_by_id(category_id)
        
        if not category:
            return {'success': False, 'error': 'دسته‌بندی یافت نشد.'}
        
        # Check if category has portfolios
        portfolio_count = category.portfolio_categories.count()
        if portfolio_count > 0:
            return {
                'success': False, 
                'error': f'این دسته‌بندی دارای {portfolio_count} نمونه کار است و قابل حذف نیست.'
            }
        
        # Check if category has children
        children_count = category.get_children_count()
        if children_count > 0:
            return {
                'success': False,
                'error': f'این دسته‌بندی دارای {children_count} زیردسته است و قابل حذف نیست.'
            }
        
        with transaction.atomic():
            category.delete()
            PortfolioCategoryAdminService._clear_category_cache()
        
        return {'success': True}
    
    @staticmethod
    def move_category(category_id, target_id, position='last-child'):
        """Move category to new position in tree"""
        category = PortfolioCategoryAdminService.get_category_by_id(category_id)
        target = PortfolioCategoryAdminService.get_category_by_id(target_id)
        
        if not category or not target:
            return {'success': False, 'error': 'دسته‌بندی یافت نشد.'}
        
        # Prevent moving to descendant
        if target.is_descendant_of(category):
            return {
                'success': False,
                'error': 'نمی‌توانید دسته‌بندی را به فرزند خودش منتقل کنید.'
            }
        
        # Prevent moving to self
        if category.id == target.id:
            return {
                'success': False,
                'error': 'نمی‌توانید دسته‌بندی را به خودش منتقل کنید.'
            }
        
        try:
            with transaction.atomic():
                category.move(target, pos=position)
                PortfolioCategoryAdminService._clear_category_cache()
            
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': f'خطا در انتقال: {str(e)}'}
    
    @staticmethod
    def get_popular_categories(limit=10):
        """Get most popular categories by portfolio count"""
        cache_key = f'popular_categories_{limit}'
        popular = cache.get(cache_key)
        
        if popular is None:
            popular = list(
                PortfolioCategory.objects.annotate(
                    portfolio_count=Count('portfolio_categories')
                ).filter(
                    portfolio_count__gt=0, is_active=True
                ).order_by('-portfolio_count')[:limit].values(
                    'id', 'public_id', 'name', 'slug', 'portfolio_count'
                )
            )
            cache.set(cache_key, popular, 600)  # 10 minutes
        
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
        """Bulk delete multiple categories with safety checks"""
        categories = PortfolioCategory.objects.filter(id__in=category_ids)
        
        # Check for portfolios
        categories_with_portfolios = categories.annotate(
            portfolio_count=Count('portfolio_categories')
        ).filter(portfolio_count__gt=0)
        
        if categories_with_portfolios.exists():
            portfolio_counts = {
                cat.name: cat.portfolio_count 
                for cat in categories_with_portfolios
            }
            return {
                'success': False,
                'error': f'دسته‌بندی‌های زیر دارای نمونه کار هستند: {portfolio_counts}'
            }
        
        # Check for children
        categories_with_children = []
        for category in categories:
            if category.get_children_count() > 0:
                categories_with_children.append(category.name)
        
        if categories_with_children:
            return {
                'success': False,
                'error': f'دسته‌بندی‌های زیر دارای زیردسته هستند: {categories_with_children}'
            }
        
        with transaction.atomic():
            deleted_count = categories.count()
            categories.delete()
            PortfolioCategoryAdminService._clear_category_cache()
        
        return {
            'success': True,
            'deleted_count': deleted_count
        }
    
    @staticmethod
    def get_category_statistics():
        """Get category statistics for admin dashboard"""
        cache_key = 'category_statistics'
        stats = cache.get(cache_key)
        
        if stats is None:
            total_categories = PortfolioCategory.objects.count()
            active_categories = PortfolioCategory.objects.filter(is_active=True).count()
            public_categories = PortfolioCategory.objects.filter(is_public=True).count()
            used_categories = PortfolioCategory.objects.filter(
                portfolio_categories__isnull=False
            ).distinct().count()
            
            root_categories = PortfolioCategory.get_root_nodes().count()
            max_depth = PortfolioCategory.objects.aggregate(
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
            cache.set(cache_key, stats, 300)  # 5 minutes
        
        return stats
    
    @staticmethod
    def _clear_category_cache():
        """Clear category-related cache"""
        cache_keys = [
            'portfolio_root_categories',
            'portfolio_category_tree_admin',
            'category_statistics'
        ]
        cache.delete_many(cache_keys)
        
        # Clear popular categories cache
        for limit in [5, 10, 15, 20]:
            cache.delete(f'popular_categories_{limit}')