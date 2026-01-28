from rest_framework import serializers
from src.blog.models.tag import BlogTag
from src.blog.serializers.mixins import CountsMixin
from src.blog.messages import TAG_ERRORS

class BlogTagAdminListSerializer(CountsMixin, serializers.ModelSerializer):
    blog_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = BlogTag
        fields = [
            'id', 'public_id', 'name', 'slug', 'description', 
            'is_active', 'blog_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']

class BlogTagAdminDetailSerializer(serializers.ModelSerializer):
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
        return getattr(obj, 'blog_count', obj.blog_tags.count())
    
    def get_popular_blogs(self, obj):
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
    class Meta:
        model = BlogTag
        fields = [
            'name', 'slug', 'description', 'is_active'
        ]
    
    def validate_slug(self, value):
        if value and BlogTag.objects.filter(slug=value).exists():
            raise serializers.ValidationError(TAG_ERRORS["tag_slug_exists"])
        return value
    
    def validate_name(self, value):
        if BlogTag.objects.filter(name=value).exists():
            raise serializers.ValidationError(TAG_ERRORS["tag_name_exists"])
        return value

class BlogTagAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogTag
        fields = [
            'name', 'slug', 'description', 'is_active'
        ]
    
    def validate_slug(self, value):
        if value and BlogTag.objects.exclude(
            id=self.instance.id
        ).filter(slug=value).exists():
            raise serializers.ValidationError(TAG_ERRORS["tag_slug_exists"])
        return value
    
    def validate_name(self, value):
        if BlogTag.objects.exclude(
            id=self.instance.id
        ).filter(name=value).exists():
            raise serializers.ValidationError(TAG_ERRORS["tag_name_exists"])
        return value

class BlogTagSimpleAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogTag
        fields = ['id', 'public_id', 'name', 'slug']
        read_only_fields = ['id', 'public_id']

class BlogTagAdminSerializer(BlogTagAdminDetailSerializer):
    pass
