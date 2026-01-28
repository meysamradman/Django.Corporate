from django.db import transaction, models
from django.db.models import Count
from django.core.cache import cache
from django.core.exceptions import ValidationError
from datetime import datetime

from src.real_estate.models.type import PropertyType
from src.real_estate.models.property import Property
from src.real_estate.utils.cache import TypeCacheKeys, TypeCacheManager
from src.real_estate.messages import TYPE_ERRORS
from src.media.models.media import ImageMedia

class PropertyTypeAdminService:
    
    @staticmethod
    def get_tree_queryset():
        return PropertyType.objects.select_related('image').annotate(
            property_count=Count('properties', distinct=True)
        ).order_by('path')
    
    @staticmethod
    def get_list_queryset(filters=None, order_by='created_at', order_desc=True, date_from=None, date_to=None):
        queryset = PropertyTypeAdminService.get_tree_queryset()
        
        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=date_from_obj)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=date_to_obj)
            except ValueError:
                pass
        
        if order_by:
            order_field = f"-{order_by}" if order_desc else order_by
            queryset = queryset.order_by(order_field)
        
        return queryset
    
    @staticmethod
    def get_type_by_id(type_id):
        try:
            return PropertyTypeAdminService.get_tree_queryset().get(id=type_id)
        except PropertyType.DoesNotExist:
            return None
    
    @staticmethod
    def get_root_types():
        cache_key = TypeCacheKeys.root_types()
        root_types = cache.get(cache_key)
        
        if root_types is None:
            root_types = list(
                PropertyType.get_root_nodes().annotate(
                    property_count=Count('properties', distinct=True)
                ).values(
                    'id', 'public_id', 'title', 'slug', 'property_count'
                )
            )
            cache.set(cache_key, root_types, 300)
        
        return root_types

    @staticmethod
    def get_tree_data():
        cache_key = TypeCacheKeys.tree_admin()
        tree_data = cache.get(cache_key)
        
        if tree_data is None:
            def build_tree(nodes):
                tree = []
                for node in nodes:
                    children = node.get_children().filter(is_active=True)
                    tree_node = {
                        'id': node.id,
                        'public_id': node.public_id,
                        'title': node.title,
                        'slug': node.slug,
                        'level': node.get_depth(),
                        'property_count': getattr(node, 'property_count', 0),
                        'children': build_tree(children) if children else []
                    }
                    tree.append(tree_node)
                return tree
            
            root_nodes = PropertyType.get_root_nodes().annotate(
                property_count=Count('properties', distinct=True)
            ).filter(is_active=True)
            
            tree_data = build_tree(root_nodes)
            cache.set(cache_key, tree_data, 900)
        
        return tree_data

    @staticmethod
    def create_type(validated_data, created_by=None):
        with transaction.atomic():
            parent_id = validated_data.pop('parent_id', None)
            image_id = validated_data.pop('image_id', None)
            
            validated_data.pop('created_by', None)
            
            if parent_id:
                property_type = parent_id.add_child(**validated_data)
            else:
                property_type = PropertyType.add_root(**validated_data)
            
            if image_id:
                try:
                    media = ImageMedia.objects.get(id=image_id)
                    property_type.image = media
                    property_type.save()
                except ImageMedia.DoesNotExist:
                    pass
            
            TypeCacheManager.invalidate_all()
            
            return property_type

    @staticmethod
    def update_type_by_id(type_id, validated_data, updated_by=None):
        property_type = PropertyTypeAdminService.get_type_by_id(type_id)
        
        if not property_type:
            raise PropertyType.DoesNotExist(TYPE_ERRORS["type_not_found"])
        
        with transaction.atomic():
            parent_id = validated_data.pop('parent_id', None)
            image_id = validated_data.pop('image_id', None)
            
            validated_data.pop('updated_by', None)
            
            for field, value in validated_data.items():
                setattr(property_type, field, value)
            
            if parent_id is not None:
                current_parent = property_type.get_parent()
                
                if (current_parent and current_parent.id != parent_id.id) or \
                   (not current_parent and parent_id):
                    property_type.move(parent_id, pos='last-child')
                elif not parent_id and current_parent:
                    property_type.move(PropertyType.get_root_nodes().first(), pos='last-sibling')
            
            if image_id is not None:
                if image_id:
                    try:
                        media = ImageMedia.objects.get(id=image_id)
                        property_type.image = media
                    except ImageMedia.DoesNotExist:
                        pass
                else:
                    property_type.image = None
            
        property_type.save()
        
        TypeCacheManager.invalidate_all()
        
        return property_type

    @staticmethod
    def delete_type_by_id(type_id):
        property_type = PropertyTypeAdminService.get_type_by_id(type_id)
        
        if not property_type:
            raise PropertyType.DoesNotExist(TYPE_ERRORS["type_not_found"])
        
        property_count = property_type.properties.count()
        if property_count > 0:
            raise ValidationError(TYPE_ERRORS["type_has_properties"].format(count=property_count))
        
        children_count = property_type.get_children_count()
        if children_count > 0:
            raise ValidationError(TYPE_ERRORS["type_has_children"].format(count=children_count))
        
        with transaction.atomic():
            property_type.delete()
            TypeCacheManager.invalidate_all()
    
    @staticmethod
    def move_type(type_id, target_id, position='last-child'):
        property_type = PropertyTypeAdminService.get_type_by_id(type_id)
        target = PropertyTypeAdminService.get_type_by_id(target_id)
        
        if not property_type or not target:
            raise PropertyType.DoesNotExist(TYPE_ERRORS["type_not_found"])
        
        if target.is_descendant_of(property_type):
            raise ValidationError(TYPE_ERRORS["type_move_to_descendant"])
        
        if property_type.id == target.id:
            raise ValidationError(TYPE_ERRORS["type_move_to_self"])
        
        with transaction.atomic():
            property_type.move(target, pos=position)
            TypeCacheManager.invalidate_all()
    
    @staticmethod
    def get_popular_types(limit=10):
        cache_key = TypeCacheKeys.popular(limit)
        popular = cache.get(cache_key)
        
        if popular is None:
            popular = list(
                PropertyType.objects.annotate(
                    property_count=Count('properties')
                ).filter(
                    property_count__gt=0, is_active=True
                ).order_by('-property_count')[:limit].values(
                    'id', 'public_id', 'title', 'slug', 'property_count'
                )
            )
            cache.set(cache_key, popular, 600)
        
        return popular
    
    @staticmethod
    def get_breadcrumbs(property_type):
        ancestors = property_type.get_ancestors()
        breadcrumbs = []
        
        for ancestor in ancestors:
            breadcrumbs.append({
                'id': ancestor.id,
                'title': ancestor.title,
                'slug': ancestor.slug
            })
        
        breadcrumbs.append({
            'id': property_type.id,
            'title': property_type.title,
            'slug': property_type.slug
        })
        
        return breadcrumbs
    
    @staticmethod
    def bulk_delete_types(type_ids):
        types = PropertyType.objects.filter(id__in=type_ids)
        
        if not types.exists():
            raise ValidationError(TYPE_ERRORS["types_not_found"])
        
        with transaction.atomic():
            all_type_ids = set()
            type_list = list(types)
            
            top_level_types = []
            for property_type in type_list:
                is_descendant = False
                for other_type in type_list:
                    if other_type.id != property_type.id:
                        if property_type.is_descendant_of(other_type):
                            is_descendant = True
                            break
                
                if not is_descendant:
                    top_level_types.append(property_type)
                    all_type_ids.add(property_type.id)
                    descendants = property_type.get_descendants()
                    all_type_ids.update(descendant.id for descendant in descendants)
            
            all_types = PropertyType.objects.filter(id__in=all_type_ids)
            
            for property_type in all_types:
                property_type.properties.clear()
            
            deleted_count = 0
            for property_type in top_level_types:
                descendants_count = property_type.get_descendants().count()
                property_type.delete()
                deleted_count += 1 + descendants_count
            
            TypeCacheManager.invalidate_all()
        
        return deleted_count
    
    @staticmethod
    def get_type_statistics():
        cache_key = TypeCacheKeys.statistics()
        stats = cache.get(cache_key)
        
        if stats is None:
            total_types = PropertyType.objects.count()
            active_types = PropertyType.objects.filter(is_active=True).count()
            used_types = PropertyType.objects.filter(
                properties__isnull=False
            ).distinct().count()
            
            root_types = PropertyType.get_root_nodes().count()
            max_depth = PropertyType.objects.aggregate(
                max_depth=models.Max('depth')
            )['max_depth'] or 0
            
            stats = {
                'total_types': total_types,
                'active_types': active_types,
                'used_types': used_types,
                'unused_types': total_types - used_types,
                'root_types': root_types,
                'max_depth': max_depth
            }
            cache.set(cache_key, stats, 300)
        
        return stats
