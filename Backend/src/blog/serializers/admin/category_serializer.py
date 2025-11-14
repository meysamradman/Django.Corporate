from rest_framework import serializers
from src.blog.models.category import BlogCategory
from src.blog.serializers.mixins import SEODataMixin, CountsMixin
from src.media.serializers import MediaAdminSerializer


class BlogCategoryAdminListSerializer(CountsMixin, serializers.ModelSerializer):
    """Optimized list view for category tree with usage statistics"""
    level = serializers.SerializerMethodField()
    has_children = serializers.SerializerMethodField()
    parent_name = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    # Use annotated field from queryset - no database queries!
    blog_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = BlogCategory
        fields = [
            'id', 'public_id', 'name', 'slug', 'description',
            'is_public', 'is_active', 'level', 'has_children',
            'parent_name', 'blog_count', 'image_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_level(self, obj):
        """Get tree depth level"""
        return obj.get_depth()
    
    def get_has_children(self, obj):
        """Check if category has children"""
        return obj.get_children_count() > 0
    
    def get_parent_name(self, obj):
        """Get parent category name"""
        parent = obj.get_parent()
        return parent.name if parent else None
    
    def get_image_url(self, obj):
        """Get image URL if exists"""
        try:
            if obj.image and hasattr(obj.image, 'file') and obj.image.file:
                return obj.image.file.url
        except:
            pass
        return None


class BlogCategoryAdminDetailSerializer(SEODataMixin, serializers.ModelSerializer):
    """Complete detail view for category with tree information and SEO"""
    parent = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    breadcrumbs = serializers.SerializerMethodField()
    blog_count = serializers.SerializerMethodField()
    image = MediaAdminSerializer(read_only=True)
    seo_data = serializers.SerializerMethodField()
    tree_path = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    recent_blogs = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogCategory
        fields = [
            'id', 'public_id', 'name', 'slug', 'description',
            'is_public', 'is_active', 'level', 'tree_path',
            'parent', 'children', 'breadcrumbs', 'blog_count',
            'image', 'recent_blogs', 'seo_data',
            # SEO fields
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_parent(self, obj):
        """Get parent category info"""
        parent = obj.get_parent()
        if parent:
            return {
                'id': parent.id,
                'public_id': parent.public_id,
                'name': parent.name,
                'slug': parent.slug
            }
        return None
    
    def get_children(self, obj):
        """Get direct children categories"""
        children = obj.get_children().filter(is_active=True)
        return [
            {
                'id': child.id,
                'public_id': child.public_id,
                'name': child.name,
                'slug': child.slug,
                'blog_count': child.blog_categories.count(),
                'has_children': child.get_children_count() > 0
            }
            for child in children
        ]
    
    def get_breadcrumbs(self, obj):
        """Get category breadcrumb path"""
        ancestors = obj.get_ancestors()
        breadcrumbs = [
            {
                'id': ancestor.id,
                'name': ancestor.name,
                'slug': ancestor.slug
            }
            for ancestor in ancestors
        ]
        # Add current category
        breadcrumbs.append({
            'id': obj.id,
            'name': obj.name,
            'slug': obj.slug
        })
        return breadcrumbs
    
    def get_blog_count(self, obj):
        """Get total blog count including descendants"""
        return getattr(obj, 'blog_count', obj.blog_categories.count())
    
    def get_tree_path(self, obj):
        """Get tree path for display"""
        return obj.path
    
    def get_level(self, obj):
        """Get tree depth level"""
        return obj.get_depth()
    
    def get_recent_blogs(self, obj):
        """Get recent blogs in this category"""
        blogs = obj.blog_categories.filter(
            status='published', is_public=True
        ).order_by('-created_at')[:5]
        
        return [
            {
                'id': p.id,
                'public_id': p.public_id,
                'title': p.title,
                'slug': p.slug,
                'created_at': p.created_at
            }
            for p in blogs
        ]


class BlogCategoryAdminCreateSerializer(serializers.ModelSerializer):
    """Create serializer with tree positioning"""
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=BlogCategory.objects.filter(is_active=True),
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Parent category ID. Leave empty for root category."
    )
    image_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Media ID from central media app"
    )
    
    class Meta:
        model = BlogCategory
        fields = [
            'name', 'slug', 'description', 'is_public', 'is_active',
            'parent_id', 'image_id',
            # SEO fields
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
    
    def validate_name(self, value):
        """Validate name uniqueness"""
        # Only check for existing name if this is a create operation
        if not self.instance and BlogCategory.objects.filter(name=value).exists():
            raise serializers.ValidationError("این نام قبلاً استفاده شده است.")
        return value
    
    def validate_slug(self, value):
        """Validate slug uniqueness"""
        # Only check for existing slug if this is a create operation
        if value and not self.instance and BlogCategory.objects.filter(slug=value).exists():
            raise serializers.ValidationError("این نامک قبلاً استفاده شده است.")
        return value
    
    def validate(self, data):
        """Validate tree structure"""
        parent_id = data.get('parent_id')
        
        if parent_id:
            # Check maximum tree depth (e.g., 5 levels)
            if parent_id.get_depth() >= 5:
                raise serializers.ValidationError({
                    'parent_id': 'حداکثر عمق درخت 5 سطح است.'
                })
        
        return data


class BlogCategoryAdminUpdateSerializer(serializers.ModelSerializer):
    """Update serializer with tree operations"""
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=BlogCategory.objects.filter(is_active=True),
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Parent category ID. Leave empty for root category."
    )
    image_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Media ID from central media app"
    )
    
    class Meta:
        model = BlogCategory
        fields = [
            'name', 'slug', 'description', 'is_public', 'is_active',
            'parent_id', 'image_id',
            # SEO fields
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
    
    def validate_name(self, value):
        """Validate name uniqueness excluding current instance"""
        if self.instance and BlogCategory.objects.exclude(
            id=self.instance.id
        ).filter(name=value).exists():
            raise serializers.ValidationError("این نام قبلاً استفاده شده است.")
        return value
    
    def validate_slug(self, value):
        """Validate slug uniqueness excluding current instance"""
        if value and self.instance and BlogCategory.objects.exclude(
            id=self.instance.id
        ).filter(slug=value).exists():
            raise serializers.ValidationError("این نامک قبلاً استفاده شده است.")
        return value
    
    def validate(self, data):
        """Validate tree operations"""
        parent_id = data.get('parent_id')
        
        if parent_id:
            # Prevent making category its own parent
            if parent_id.id == self.instance.id:
                raise serializers.ValidationError({
                    'parent_id': 'دسته‌بندی نمی‌تواند والد خودش باشد.'
                })
            
            # Prevent circular references
            if self.instance.is_ancestor_of(parent_id):
                raise serializers.ValidationError({
                    'parent_id': 'نمی‌توانید دسته‌بندی را به فرزند خودش منتقل کنید.'
                })
            
            # Check maximum tree depth
            if parent_id.get_depth() >= 5:
                raise serializers.ValidationError({
                    'parent_id': 'حداکثر عمق درخت 5 سطح است.'
                })
        
        return data


class BlogCategoryTreeSerializer(serializers.ModelSerializer):
    """Tree serializer for hierarchical display"""
    children = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    # Use annotated field from queryset - no database queries!
    blog_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = BlogCategory
        fields = [
            'id', 'public_id', 'name', 'slug', 'level',
            'blog_count', 'image_url', 'children'
        ]
    
    def get_children(self, obj):
        """Get children recursively"""
        children = obj.get_children().filter(is_active=True, is_public=True)
        return BlogCategoryTreeSerializer(children, many=True).data if children else []
    
    def get_level(self, obj):
        """Get tree level"""
        return obj.get_depth()
    
    def get_image_url(self, obj):
        """Get image URL"""
        if obj.image and obj.image.file:
            return obj.image.file.url
        return None


class BlogCategorySimpleAdminSerializer(serializers.ModelSerializer):
    """Simple serializer for nested usage"""
    level = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogCategory
        fields = ['id', 'public_id', 'name', 'slug', 'level', 'display_name']
        read_only_fields = ['id', 'public_id']
    
    def get_level(self, obj):
        """Get tree level"""
        return obj.get_depth()
    
    def get_display_name(self, obj):
        """Get indented name for tree display"""
        return f"{'» ' * (obj.get_depth() - 1)}{obj.name}"


# Backward compatibility
class BlogCategoryAdminSerializer(BlogCategoryAdminDetailSerializer):
    """Backward compatibility alias"""
    pass