from rest_framework import serializers
from src.portfolio.models.category import PortfolioCategory
from src.portfolio.serializers.mixins import SEODataMixin, CountsMixin
from src.media.serializers import MediaAdminSerializer
from src.portfolio.messages import CATEGORY_ERRORS

class PortfolioCategoryAdminListSerializer(CountsMixin, serializers.ModelSerializer):
    level = serializers.SerializerMethodField()
    has_children = serializers.SerializerMethodField()
    parent_name = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    portfolio_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PortfolioCategory
        fields = [
            'id', 'public_id', 'name', 'slug', 'description',
            'is_public', 'is_active', 'level', 'has_children',
            'parent_name', 'portfolio_count', 'image_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_level(self, obj):
        return obj.get_depth()
    
    def get_has_children(self, obj):
        return obj.get_children_count() > 0
    
    def get_parent_name(self, obj):
        parent = obj.get_parent()
        return parent.name if parent else None
    
    def get_image_url(self, obj):
        try:
            if obj.image and hasattr(obj.image, 'file') and obj.image.file:
                return obj.image.file.url
        except:
            pass
        return None

class PortfolioCategoryAdminDetailSerializer(SEODataMixin, serializers.ModelSerializer):
    parent = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    breadcrumbs = serializers.SerializerMethodField()
    portfolio_count = serializers.SerializerMethodField()
    image = MediaAdminSerializer(read_only=True)
    seo_data = serializers.SerializerMethodField()
    tree_path = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    recent_portfolios = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioCategory
        fields = [
            'id', 'public_id', 'name', 'slug', 'description',
            'is_public', 'is_active', 'level', 'tree_path',
            'parent', 'children', 'breadcrumbs', 'portfolio_count',
            'image', 'recent_portfolios', 'seo_data',
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
                'name': parent.name,
                'slug': parent.slug
            }
        return None
    
    def get_children(self, obj):
        children = obj.get_children().filter(is_active=True)
        return [
            {
                'id': child.id,
                'public_id': child.public_id,
                'name': child.name,
                'slug': child.slug,
                'portfolio_count': child.portfolio_categories.count(),
                'has_children': child.get_children_count() > 0
            }
            for child in children
        ]
    
    def get_breadcrumbs(self, obj):
        ancestors = obj.get_ancestors()
        breadcrumbs = [
            {
                'id': ancestor.id,
                'name': ancestor.name,
                'slug': ancestor.slug
            }
            for ancestor in ancestors
        ]
        breadcrumbs.append({
            'id': obj.id,
            'name': obj.name,
            'slug': obj.slug
        })
        return breadcrumbs
    
    def get_portfolio_count(self, obj):
        return getattr(obj, 'portfolio_count', obj.portfolio_categories.count())
    
    def get_tree_path(self, obj):
        return obj.path
    
    def get_level(self, obj):
        return obj.get_depth()
    
    def get_recent_portfolios(self, obj):
        portfolios = obj.portfolio_categories.filter(
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
            for p in portfolios
        ]

class PortfolioCategoryAdminCreateSerializer(serializers.ModelSerializer):
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=PortfolioCategory.objects.filter(is_active=True),
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
        model = PortfolioCategory
        fields = [
            'name', 'slug', 'description', 'is_public', 'is_active',
            'parent_id', 'image_id',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
    
    def validate_name(self, value):
        if not self.instance and PortfolioCategory.objects.filter(name=value).exists():
            raise serializers.ValidationError(CATEGORY_ERRORS["category_name_exists"])
        return value
    
    def validate_slug(self, value):
        if value and not self.instance and PortfolioCategory.objects.filter(slug=value).exists():
            raise serializers.ValidationError(CATEGORY_ERRORS["category_slug_exists"])
        return value
    
    def validate(self, data):
        parent_id = data.get('parent_id')
        
        if parent_id:
            if parent_id.get_depth() >= 5:
                raise serializers.ValidationError({
                    'parent_id': CATEGORY_ERRORS["category_max_depth"]
                })
        
        return data

class PortfolioCategoryAdminUpdateSerializer(serializers.ModelSerializer):
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=PortfolioCategory.objects.filter(is_active=True),
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
        model = PortfolioCategory
        fields = [
            'name', 'slug', 'description', 'is_public', 'is_active',
            'parent_id', 'image_id',
            'meta_title', 'meta_description', 'og_title', 'og_description',
            'canonical_url', 'robots_meta'
        ]
    
    def validate_name(self, value):
        if self.instance and PortfolioCategory.objects.exclude(
            id=self.instance.id
        ).filter(name=value).exists():
            raise serializers.ValidationError(CATEGORY_ERRORS["category_name_exists"])
        return value
    
    def validate_slug(self, value):
        if value and self.instance and PortfolioCategory.objects.exclude(
            id=self.instance.id
        ).filter(slug=value).exists():
            raise serializers.ValidationError(CATEGORY_ERRORS["category_slug_exists"])
        return value
    
    def validate(self, data):
        parent_id = data.get('parent_id')
        
        if parent_id:
            if parent_id.id == self.instance.id:
                raise serializers.ValidationError({
                    'parent_id': CATEGORY_ERRORS["category_cannot_be_own_parent"]
                })
            
            if self.instance.is_ancestor_of(parent_id):
                raise serializers.ValidationError({
                    'parent_id': CATEGORY_ERRORS["category_move_to_descendant"]
                })
            
            if parent_id.get_depth() >= 5:
                raise serializers.ValidationError({
                    'parent_id': CATEGORY_ERRORS["category_max_depth"]
                })
        
        return data

class PortfolioCategoryTreeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    portfolio_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PortfolioCategory
        fields = [
            'id', 'public_id', 'name', 'slug', 'level',
            'portfolio_count', 'image_url', 'children'
        ]
    
    def get_children(self, obj):
        children = obj.get_children().filter(is_active=True, is_public=True)
        return PortfolioCategoryTreeSerializer(children, many=True).data if children else []
    
    def get_level(self, obj):
        return obj.get_depth()
    
    def get_image_url(self, obj):
        if obj.image and obj.image.file:
            return obj.image.file.url
        return None

class PortfolioCategorySimpleAdminSerializer(serializers.ModelSerializer):
    level = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioCategory
        fields = ['id', 'public_id', 'name', 'slug', 'level', 'display_name']
        read_only_fields = ['id', 'public_id']
    
    def get_level(self, obj):
        return obj.get_depth()
    
    def get_display_name(self, obj):
        return f"{'» ' * (obj.get_depth() - 1)}{obj.name}"

class PortfolioCategoryAdminSerializer(PortfolioCategoryAdminDetailSerializer):
    pass
