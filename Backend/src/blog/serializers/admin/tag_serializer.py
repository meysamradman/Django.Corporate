from rest_framework import serializers
from src.blog.models.tag import BlogTag
from src.blog.serializers.mixins import CountsMixin


class BlogTagAdminListSerializer(CountsMixin, serializers.ModelSerializer):
    """Optimized list view for admin with usage statistics"""
    # Use annotated field from queryset - no database queries!
    blog_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = BlogTag
        fields = [
            'id', 'public_id', 'name', 'slug', 'description', 
            'is_active', 'blog_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']


class BlogTagAdminDetailSerializer(serializers.ModelSerializer):
    """Complete detail view for admin with full information"""
    blog_count = serializers.SerializerMethodField()
    popular_blogs = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogTag
        fields = [
            'id', 'public_id', 'name', 'slug', 'description', 
            'is_active', 'blog_count', 'popular_blogs',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_blog_count(self, obj):
        """Get blog count from annotation or database"""
        return getattr(obj, 'blog_count', obj.blog_tags.count())
    
    def get_popular_blogs(self, obj):
        """Get top 5 popular blogs using this tag"""
        blogs = obj.blog_tags.filter(
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


class BlogTagAdminCreateSerializer(serializers.ModelSerializer):
    """Create serializer with auto-slug generation"""
    
    class Meta:
        model = BlogTag
        fields = [
            'name', 'slug', 'description', 'is_active'
        ]
    
    def validate_slug(self, value):
        """Validate slug uniqueness"""
        if value and BlogTag.objects.filter(slug=value).exists():
            raise serializers.ValidationError("این نامک قبلاً استفاده شده است.")
        return value
    
    def validate_name(self, value):
        """Validate name uniqueness"""
        if BlogTag.objects.filter(name=value).exists():
            raise serializers.ValidationError("این نام قبلاً استفاده شده است.")
        return value


class BlogTagAdminUpdateSerializer(serializers.ModelSerializer):
    """Update serializer with validation"""
    
    class Meta:
        model = BlogTag
        fields = [
            'name', 'slug', 'description', 'is_active'
        ]
    
    def validate_slug(self, value):
        """Validate slug uniqueness excluding current instance"""
        if value and BlogTag.objects.exclude(
            id=self.instance.id
        ).filter(slug=value).exists():
            raise serializers.ValidationError("این نامک قبلاً استفاده شده است.")
        return value
    
    def validate_name(self, value):
        """Validate name uniqueness excluding current instance"""
        if BlogTag.objects.exclude(
            id=self.instance.id
        ).filter(name=value).exists():
            raise serializers.ValidationError("این نام قبلاً استفاده شده است.")
        return value


class BlogTagSimpleAdminSerializer(serializers.ModelSerializer):
    """Simple serializer for nested usage in other serializers"""
    
    class Meta:
        model = BlogTag
        fields = ['id', 'public_id', 'name', 'slug']
        read_only_fields = ['id', 'public_id']


# Backward compatibility - Main serializer alias
class BlogTagAdminSerializer(BlogTagAdminDetailSerializer):
    """Backward compatibility alias for existing code"""
    pass