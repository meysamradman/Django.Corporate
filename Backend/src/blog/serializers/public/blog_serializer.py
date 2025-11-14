from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from src.media.serializers.media_serializer import MediaPublicSerializer
from src.blog.models.media import BlogImage, BlogVideo, BlogAudio, BlogDocument
from src.blog.models.blog import Blog
from src.blog.models.category import BlogCategory
from src.blog.serializers.public.category_serializer import BlogCategorySimplePublicSerializer
from src.blog.serializers.public.tag_serializer import BlogTagPublicSerializer


class BlogCategorySimplePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = [
            'public_id', 'name', 'slug', 'created_at',
        ]


class BlogPublicListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for public listing"""
    main_image_url = serializers.SerializerMethodField()
    categories = BlogCategorySimplePublicSerializer(many=True, read_only=True)
    
    class Meta:
        model = Blog
        fields = [
            'public_id', 'title', 'slug', 'short_description',
            'main_image_url', 'categories', 'is_featured', 'created_at',
        ]
    
    def get_main_image_url(self, obj):
        """Get main image efficiently"""
        try:
            # Get the main image from BlogImage model
            main_image = obj.images.filter(is_main=True).first()
            if main_image and main_image.image:
                return main_image.image.file.url
        except:
            pass
        return None


class BlogMediaPublicSerializer(serializers.Serializer):
    """Public serializer for blog media"""
    id = serializers.IntegerField(read_only=True)
    public_id = serializers.UUIDField(read_only=True)
    media = MediaPublicSerializer(read_only=True)
    is_main_image = serializers.BooleanField(read_only=True)
    order = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    
    def to_representation(self, instance):
        """Convert instance to appropriate serializer based on media type"""
        # Determine media type based on instance class
        if isinstance(instance, BlogImage):
            return {
                'id': instance.id,
                'public_id': instance.public_id,
                'media': MediaPublicSerializer(instance.image, context=self.context).data,
                'is_main_image': instance.is_main,
                'order': instance.order,
                'created_at': instance.created_at,
            }
        elif isinstance(instance, BlogVideo):
            return {
                'id': instance.id,
                'public_id': instance.public_id,
                'media': MediaPublicSerializer(instance.video, context=self.context).data,
                'order': instance.order,
                'created_at': instance.created_at,
            }
        elif isinstance(instance, BlogAudio):
            return {
                'id': instance.id,
                'public_id': instance.public_id,
                'media': MediaPublicSerializer(instance.audio, context=self.context).data,
                'order': instance.order,
                'created_at': instance.created_at,
            }
        elif isinstance(instance, BlogDocument):
            return {
                'id': instance.id,
                'public_id': instance.public_id,
                'media': MediaPublicSerializer(instance.document, context=self.context).data,
                'order': instance.order,
                'created_at': instance.created_at,
            }
        return super().to_representation(instance)


class BlogPublicDetailSerializer(serializers.ModelSerializer):
    """Full serializer for public detail with SEO data"""
    categories = BlogCategorySimplePublicSerializer(many=True, read_only=True)
    tags = BlogTagPublicSerializer(many=True, read_only=True)
    media = serializers.SerializerMethodField()
    
    # SEO data for frontend rendering
    seo_data = serializers.SerializerMethodField()
    
    class Meta:
        model = Blog
        fields = [
            'public_id', 'title', 'slug',
            'short_description', 'description',
            'media', 'categories', 'tags',
            'seo_data', 'created_at',
        ]
    
    def get_media(self, obj):
        """Get all media for the blog"""
        media_list = []
        
        # Get all types of media
        images = obj.images.all()
        videos = obj.videos.all()
        audios = obj.audios.all()
        documents = obj.documents.all()
        
        # Add all media to the list
        for image in images:
            media_list.append(BlogMediaPublicSerializer(image, context=self.context).data)
        for video in videos:
            media_list.append(BlogMediaPublicSerializer(video, context=self.context).data)
        for audio in audios:
            media_list.append(BlogMediaPublicSerializer(audio, context=self.context).data)
        for document in documents:
            media_list.append(BlogMediaPublicSerializer(document, context=self.context).data)
            
        return media_list
    
    def get_seo_data(self, obj):
        """Get SEO data for frontend meta tags"""
        return {
            'meta_title': obj.get_meta_title(),
            'meta_description': obj.get_meta_description(),
            'og_title': obj.get_og_title(),
            'og_description': obj.get_og_description(),
            'og_image': obj.og_image.file.url if obj.og_image else None,
            'canonical_url': obj.get_canonical_url(),
            'structured_data': obj.generate_structured_data(),
        }


# Backward compatibility
class BlogPublicSerializer(BlogPublicDetailSerializer):
    """Backward compatibility alias"""
    pass