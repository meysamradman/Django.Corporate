from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from src.media.serializers.media_serializer import MediaPublicSerializer
from src.portfolio.models.media import PortfolioImage, PortfolioVideo, PortfolioAudio, PortfolioDocument
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.category import PortfolioCategory
from src.portfolio.serializers.public.category_serializer import PortfolioCategorySimplePublicSerializer
from src.portfolio.serializers.public.option_serializer import PortfolioOptionPublicSerializer
from src.portfolio.serializers.public.tag_serializer import PortfolioTagPublicSerializer


class PortfolioCategorySimplePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioCategory
        fields = [
            'public_id', 'name', 'slug', 'created_at',
        ]


class PortfolioPublicListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for public listing"""
    main_image_url = serializers.SerializerMethodField()
    categories = PortfolioCategorySimplePublicSerializer(many=True, read_only=True)
    
    class Meta:
        model = Portfolio
        fields = [
            'public_id', 'title', 'slug', 'short_description',
            'main_image_url', 'categories', 'is_featured', 'created_at',
        ]
    
    def get_main_image_url(self, obj):
        """Get main image efficiently"""
        try:
            # Get the main image from PortfolioImage model
            main_image = obj.images.filter(is_main=True).first()
            if main_image and main_image.image:
                return main_image.image.file.url
        except:
            pass
        return None


class PortfolioMediaPublicSerializer(serializers.Serializer):
    """Public serializer for portfolio media"""
    id = serializers.IntegerField(read_only=True)
    public_id = serializers.UUIDField(read_only=True)
    media = MediaPublicSerializer(read_only=True)
    is_main_image = serializers.BooleanField(read_only=True)
    order = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    
    def to_representation(self, instance):
        """Convert instance to appropriate serializer based on media type"""
        # Determine media type based on instance class
        if isinstance(instance, PortfolioImage):
            return {
                'id': instance.id,
                'public_id': instance.public_id,
                'media': MediaPublicSerializer(instance.image, context=self.context).data,
                'is_main_image': instance.is_main,
                'order': instance.order,
                'created_at': instance.created_at,
            }
        elif isinstance(instance, PortfolioVideo):
            return {
                'id': instance.id,
                'public_id': instance.public_id,
                'media': MediaPublicSerializer(instance.video, context=self.context).data,
                'is_main_image': False,  # Videos don't have is_main field
                'order': instance.order,
                'created_at': instance.created_at,
            }
        elif isinstance(instance, PortfolioAudio):
            return {
                'id': instance.id,
                'public_id': instance.public_id,
                'media': MediaPublicSerializer(instance.audio, context=self.context).data,
                'is_main_image': False,  # Audios don't have is_main field
                'order': instance.order,
                'created_at': instance.created_at,
            }
        elif isinstance(instance, PortfolioDocument):
            return {
                'id': instance.id,
                'public_id': instance.public_id,
                'media': MediaPublicSerializer(instance.document, context=self.context).data,
                'is_main_image': False,  # Documents don't have is_main field
                'order': instance.order,
                'created_at': instance.created_at,
            }
        return super().to_representation(instance)


class PortfolioPublicDetailSerializer(serializers.ModelSerializer):
    """Full serializer for public detail with SEO data"""
    categories = PortfolioCategorySimplePublicSerializer(many=True, read_only=True)
    options = PortfolioOptionPublicSerializer(many=True, read_only=True, source="portfolio_options")
    tags = PortfolioTagPublicSerializer(many=True, read_only=True)
    media = serializers.SerializerMethodField()
    
    # SEO data for frontend rendering
    seo_data = serializers.SerializerMethodField()
    
    class Meta:
        model = Portfolio
        fields = [
            'public_id', 'title', 'slug',
            'short_description', 'description',
            'media', 'categories', 'tags', 'options',
            'seo_data', 'created_at',
        ]
    
    def get_media(self, obj):
        """Get all media for the portfolio"""
        media_list = []
        
        # Get all types of media
        images = obj.images.all()
        videos = obj.videos.all()
        audios = obj.audios.all()
        documents = obj.documents.all()
        
        # Add all media to the list
        for image in images:
            media_list.append(PortfolioMediaPublicSerializer(image, context=self.context).data)
        for video in videos:
            media_list.append(PortfolioMediaPublicSerializer(video, context=self.context).data)
        for audio in audios:
            media_list.append(PortfolioMediaPublicSerializer(audio, context=self.context).data)
        for document in documents:
            media_list.append(PortfolioMediaPublicSerializer(document, context=self.context).data)
            
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
class PortfolioPublicSerializer(PortfolioPublicDetailSerializer):
    """Backward compatibility alias"""
    pass