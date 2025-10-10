from rest_framework import serializers
from src.media.serializers import MediaPublicSerializer
from src.portfolio.models import PortfolioCategory
from src.portfolio.models.media import PortfolioMedia
from src.portfolio.models.portfolio import Portfolio
from drf_spectacular.utils import extend_schema_field
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
            for media in obj.portfolio_medias.all():
                if media.is_main_image and media.media:
                    return media.media.file.url
        except:
            pass
        return None


class PortfolioMediaPublicSerializer(serializers.ModelSerializer):
    """Public serializer for portfolio media"""
    media = MediaPublicSerializer(read_only=True)
    
    class Meta:
        model = PortfolioMedia
        fields = [
            'id', 'media', 'is_main_image', 'order'
        ]


class PortfolioPublicDetailSerializer(serializers.ModelSerializer):
    """Full serializer for public detail with SEO data"""
    categories = PortfolioCategorySimplePublicSerializer(many=True, read_only=True)
    options = PortfolioOptionPublicSerializer(many=True, read_only=True, source="portfolio_options")
    tags = PortfolioTagPublicSerializer(many=True, read_only=True)
    media = PortfolioMediaPublicSerializer(many=True, read_only=True, source='portfolio_medias')
    
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