from rest_framework import serializers
from src.blog.models.tag import BlogTag


class BlogTagPublicSerializer(serializers.ModelSerializer):
    """Public serializer for blog tags with blog count"""
    blog_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = BlogTag
        fields = [
            'public_id', 'name', 'slug', 'description', 
            'blog_count', 'created_at'
        ]