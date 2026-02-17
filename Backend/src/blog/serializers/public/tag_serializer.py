from rest_framework import serializers
from src.blog.models.tag import BlogTag

class BlogTagPublicSerializer(serializers.ModelSerializer):
    blog_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = BlogTag
        fields = [
            'id', 'public_id', 'name', 'slug', 'description', 
            'blog_count', 'created_at'
        ]