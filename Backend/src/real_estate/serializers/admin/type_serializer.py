from rest_framework import serializers
from src.real_estate.models.type import PropertyType
from src.real_estate.messages import TYPE_ERRORS
from src.media.serializers import MediaAdminSerializer


class PropertyTypeAdminListSerializer(serializers.ModelSerializer):
    level = serializers.SerializerMethodField()
    has_children = serializers.SerializerMethodField()
    parent_name = serializers.SerializerMethodField()
    property_count = serializers.IntegerField(read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyType
        fields = [
            'id', 'public_id', 'title', 'slug', 'description',
            'is_active', 'is_public', 'display_order', 'level', 'has_children',
            'parent_name', 'property_count', 'image_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_level(self, obj):
        return obj.get_depth()
    
    def get_has_children(self, obj):
        return obj.get_children_count() > 0
    
    def get_parent_name(self, obj):
        parent = obj.get_parent()
        return parent.title if parent else None
    
    def get_image_url(self, obj):
        try:
            if obj.image and hasattr(obj.image, 'file') and obj.image.file:
                return obj.image.file.url
        except:
            pass
        return None


class PropertyTypeAdminDetailSerializer(serializers.ModelSerializer):
    parent = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    breadcrumbs = serializers.SerializerMethodField()
    property_count = serializers.SerializerMethodField()
    tree_path = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    recent_properties = serializers.SerializerMethodField()
    full_path_title = serializers.SerializerMethodField()
    image = MediaAdminSerializer(read_only=True)
    
    class Meta:
        model = PropertyType
        fields = [
            'id', 'public_id', 'title', 'slug', 'description',
            'is_active', 'is_public', 'display_order', 'level', 'tree_path',
            'parent', 'children', 'breadcrumbs', 'property_count',
            'recent_properties', 'full_path_title', 'image',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_parent(self, obj):
        parent = obj.get_parent()
        if parent:
            return {
                'id': parent.id,
                'public_id': parent.public_id,
                'title': parent.title,
                'slug': parent.slug
            }
        return None
    
    def get_children(self, obj):
        try:
            children = obj.get_children().filter(is_active=True)
            return [
                {
                    'id': child.id,
                    'public_id': child.public_id,
                    'title': child.title,
                    'slug': child.slug,
                    'property_count': child.properties.count(),
                    'has_children': child.get_children_count() > 0
                }
                for child in children
            ]
        except Exception as e:
            return []
    
    def get_breadcrumbs(self, obj):
        return obj.get_ancestors_list() + [obj.title]
    
    def get_property_count(self, obj):
        try:
            return getattr(obj, 'property_count', 0) or obj.properties.count()
        except Exception:
            return 0
    
    def get_tree_path(self, obj):
        return obj.path
    
    def get_level(self, obj):
        return obj.get_depth()
    
    def get_recent_properties(self, obj):
        try:
            properties = obj.properties.filter(
                is_published=True, is_public=True
            ).order_by('-created_at')[:5]
            
            return [
                {
                    'id': p.id,
                    'public_id': p.public_id,
                    'title': p.title,
                    'slug': p.slug,
                    'created_at': p.created_at
                }
                for p in properties
            ]
        except Exception as e:
            # اگر خطا داد، لیست خالی برگردان
            return []
    
    def get_full_path_title(self, obj):
        return obj.get_full_path_title()


class PropertyTypeAdminCreateSerializer(serializers.ModelSerializer):
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=PropertyType.objects.filter(is_active=True),
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Parent type ID. Leave empty for root type."
    )
    image_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Media ID from central media app"
    )
    
    class Meta:
        model = PropertyType
        fields = [
            'title', 'slug', 'description', 'is_active', 'is_public',
            'display_order', 'parent_id', 'image_id',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
    
    def validate_title(self, value):
        if not self.instance and PropertyType.objects.filter(title=value).exists():
            raise serializers.ValidationError(TYPE_ERRORS["type_title_exists"])
        return value
    
    def validate_slug(self, value):
        if value and not self.instance and PropertyType.objects.filter(slug=value).exists():
            raise serializers.ValidationError(TYPE_ERRORS["type_slug_exists"])
        return value
    
    def validate(self, data):
        parent_id = data.get('parent_id')
        
        if parent_id:
            if parent_id.get_depth() >= 5:
                raise serializers.ValidationError({
                    'parent_id': TYPE_ERRORS["type_max_depth"]
                })
        
        return data


class PropertyTypeAdminUpdateSerializer(serializers.ModelSerializer):
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=PropertyType.objects.filter(is_active=True),
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Parent type ID. Leave empty for root type."
    )
    image_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Media ID from central media app"
    )
    
    class Meta:
        model = PropertyType
        fields = [
            'title', 'slug', 'description', 'is_active', 'is_public',
            'display_order', 'parent_id', 'image_id',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
    
    def validate_title(self, value):
        if self.instance and PropertyType.objects.exclude(
            id=self.instance.id
        ).filter(title=value).exists():
            raise serializers.ValidationError(TYPE_ERRORS["type_title_exists"])
        return value
    
    def validate_slug(self, value):
        if value and self.instance and PropertyType.objects.exclude(
            id=self.instance.id
        ).filter(slug=value).exists():
            raise serializers.ValidationError(TYPE_ERRORS["type_slug_exists"])
        return value
    
    def validate(self, data):
        parent_id = data.get('parent_id')
        
        if parent_id:
            if parent_id.id == self.instance.id:
                raise serializers.ValidationError({
                    'parent_id': TYPE_ERRORS["type_cannot_be_own_parent"]
                })
            
            if self.instance.is_ancestor_of(parent_id):
                raise serializers.ValidationError({
                    'parent_id': TYPE_ERRORS["type_move_to_descendant"]
                })
            
            if parent_id.get_depth() >= 5:
                raise serializers.ValidationError({
                    'parent_id': TYPE_ERRORS["type_max_depth"]
                })
        
        return data


class PropertyTypeTreeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    property_count = serializers.IntegerField(read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyType
        fields = [
            'id', 'public_id', 'title', 'slug', 'level',
            'property_count', 'image_url', 'children'
        ]
    
    def get_children(self, obj):
        children = obj.get_children().filter(is_active=True)
        return PropertyTypeTreeSerializer(children, many=True).data if children else []
    
    def get_level(self, obj):
        return obj.get_depth()
    
    def get_image_url(self, obj):
        if obj.image and obj.image.file:
            return obj.image.file.url
        return None


class PropertyTypeSimpleAdminSerializer(serializers.ModelSerializer):
    level = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyType
        fields = ['id', 'public_id', 'title', 'slug', 'level', 'display_name']
        read_only_fields = ['id', 'public_id']
    
    def get_level(self, obj):
        return obj.get_depth()
    
    def get_display_name(self, obj):
        return str(obj)  # استفاده از __str__ که فلش داره


class PropertyTypeAdminSerializer(PropertyTypeAdminDetailSerializer):
    pass
