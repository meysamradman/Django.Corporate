from django.db import transaction, models
from django.db.models import Count
from django.core.cache import cache
from django.core.exceptions import ValidationError

from src.portfolio.models.category import PortfolioCategory
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.utils.cache import CategoryCacheKeys, CategoryCacheManager
from src.portfolio.messages.messages import CATEGORY_ERRORS
from src.media.models.media import ImageMedia


class PortfolioCategoryAdminService:
    
    @staticmethod
    def get_tree_queryset():
        return PortfolioCategory.objects.select_related('image').annotate(
            portfolio_count=Count('portfolio_categories', distinct=True)
        ).order_by('path')
    
    @staticmethod
    def get_category_by_id(category_id):
        try:
            return PortfolioCategoryAdminService.get_tree_queryset().get(id=category_id)
        except PortfolioCategory.DoesNotExist:
            return None
    
    @staticmethod
    def get_root_categories():
        cache_key = CategoryCacheKeys.root_categories()
        root_categories = cache.get(cache_key)
        
        if root_categories is None:
            root_categories = list(
                PortfolioCategory.get_root_nodes().annotate(
                    portfolio_count=Count('portfolio_categories', distinct=True)
                ).values(
                    'id', 'public_id', 'name', 'slug', 'portfolio_count'
                )
            )
            cache.set(cache_key, root_categories, 300)
        
        return root_categories

    @staticmethod
    def get_tree_data():
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
                        'portfolio_count': getattr(node, 'portfolio_count', 0),
                        'children': build_tree(children) if children else []
                    }
                    tree.append(tree_node)
                return tree
            
            root_nodes = PortfolioCategory.get_root_nodes().annotate(
                portfolio_count=Count('portfolio_categories', distinct=True)
            ).filter(is_active=True)
            
            tree_data = build_tree(root_nodes)
            cache.set(cache_key, tree_data, 900)
        
        return tree_data

    @staticmethod
    def create_category(validated_data, created_by=None):
        with transaction.atomic():
            parent_id = validated_data.pop('parent_id', None)
            image_id = validated_data.pop('image_id', None)
            
            validated_data.pop('created_by', None)
            
            if parent_id:
                category = parent_id.add_child(**validated_data)
            else:
                category = PortfolioCategory.add_root(**validated_data)
            
            if image_id:
                from src.media.models.media import ImageMedia
                try:
                    media = ImageMedia.objects.get(id=image_id)
                    category.image = media
                    category.save()
                except ImageMedia.DoesNotExist:
                    pass
            
            CategoryCacheManager.invalidate_all()
            
            return category

    @staticmethod
    def update_category_by_id(category_id, validated_data, updated_by=None):
        category = PortfolioCategoryAdminService.get_category_by_id(category_id)
        
        if not category:
            raise PortfolioCategory.DoesNotExist(CATEGORY_ERRORS["category_not_found"])
        
        with transaction.atomic():
            parent_id = validated_data.pop('parent_id', None)
            image_id = validated_data.pop('image_id', None)
            
            validated_data.pop('updated_by', None)
            
            for field, value in validated_data.items():
                setattr(category, field, value)
            
            if parent_id is not None:
                current_parent = category.get_parent()
                
                if (current_parent and current_parent.id != parent_id.id) or \
                   (not current_parent and parent_id):
                    category.move(parent_id, pos='last-child')
                elif not parent_id and current_parent:
                    category.move(PortfolioCategory.get_root_nodes().first(), pos='last-sibling')
            
            if image_id is not None:
                if image_id:
                    try:
                        media = ImageMedia.objects.get(id=image_id)
                        category.image = media
                    except ImageMedia.DoesNotExist:
                        pass
                else:
                    category.image = None
            
        category.save()
        
        CategoryCacheManager.invalidate_all()
        
        return category

    @staticmethod
    def delete_category_by_id(category_id):
        category = PortfolioCategoryAdminService.get_category_by_id(category_id)
        
        if not category:
            raise PortfolioCategory.DoesNotExist(CATEGORY_ERRORS["category_not_found"])
        
        portfolio_count = category.portfolio_categories.count()
        if portfolio_count > 0:
            raise ValidationError(CATEGORY_ERRORS["category_has_portfolios"].format(count=portfolio_count))
        
        children_count = category.get_children_count()
        if children_count > 0:
            raise ValidationError(CATEGORY_ERRORS["category_has_children"].format(count=children_count))
        
        with transaction.atomic():
            category.delete()
            CategoryCacheManager.invalidate_all()
    
    @staticmethod
    def move_category(category_id, target_id, position='last-child'):
        category = PortfolioCategoryAdminService.get_category_by_id(category_id)
        target = PortfolioCategoryAdminService.get_category_by_id(target_id)
        
        if not category or not target:
            raise PortfolioCategory.DoesNotExist(CATEGORY_ERRORS["category_not_found"])
        
        if target.is_descendant_of(category):
            raise ValidationError("Cannot move category to its own descendant")
        
        if category.id == target.id:
            raise ValidationError("Cannot move category to itself")
        
        with transaction.atomic():
            category.move(target, pos=position)
            CategoryCacheManager.invalidate_all()
    
    @staticmethod
    def get_popular_categories(limit=10):
        cache_key = CategoryCacheKeys.popular(limit)
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
            cache.set(cache_key, popular, 600)
        
        return popular
    
    @staticmethod
    def get_breadcrumbs(category):
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
        categories = PortfolioCategory.objects.filter(id__in=category_ids)
        
        if not categories.exists():
            raise ValidationError("Selected categories not found")
        
        with transaction.atomic():
            all_category_ids = set()
            category_list = list(categories)
            
            top_level_categories = []
            for category in category_list:
                is_descendant = False
                for other_category in category_list:
                    if other_category.id != category.id:
                        if category.is_descendant_of(other_category):
                            is_descendant = True
                            break
                
                if not is_descendant:
                    top_level_categories.append(category)
                    all_category_ids.add(category.id)
                    descendants = category.get_descendants()
                    all_category_ids.update(descendant.id for descendant in descendants)
            
            all_categories = PortfolioCategory.objects.filter(id__in=all_category_ids)
            
            for category in all_categories:
                category.portfolio_categories.clear()
            
            deleted_count = 0
            for category in top_level_categories:
                descendants_count = category.get_descendants().count()
                category.delete()
                deleted_count += 1 + descendants_count
            
            CategoryCacheManager.invalidate_all()
        
        return deleted_count
    
    @staticmethod
    def get_category_statistics():
        cache_key = CategoryCacheKeys.statistics()
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
            cache.set(cache_key, stats, 300)
        
        return stats