from rest_framework import serializers
from src.portfolio.models.tag import PortfolioTag
from src.portfolio.serializers.mixins import CountsMixin


class PortfolioTagAdminListSerializer(CountsMixin, serializers.ModelSerializer):
    """Optimized list view for admin with usage statistics"""
    portfolio_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioTag
        fields = [
            'id', 'public_id', 'name', 'slug', 'description', 
            'is_active', 'portfolio_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_portfolio_count(self, obj):
        """Get portfolio count from annotation or database"""
        return getattr(obj, 'portfolio_count', obj.portfolio_tags.count())


class PortfolioTagAdminDetailSerializer(serializers.ModelSerializer):
    """Complete detail view for admin with full information"""
    portfolio_count = serializers.SerializerMethodField()
    popular_portfolios = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioTag
        fields = [
            'id', 'public_id', 'name', 'slug', 'description', 
            'is_active', 'portfolio_count', 'popular_portfolios',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_portfolio_count(self, obj):
        """Get portfolio count from annotation or database"""
        return getattr(obj, 'portfolio_count', obj.portfolio_tags.count())
    
    def get_popular_portfolios(self, obj):
        """Get top 5 popular portfolios using this tag"""
        portfolios = obj.portfolio_tags.filter(
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


class PortfolioTagAdminCreateSerializer(serializers.ModelSerializer):
    """Create serializer with auto-slug generation"""
    
    class Meta:
        model = PortfolioTag
        fields = [
            'name', 'slug', 'description', 'is_active'
        ]
    
    def validate_slug(self, value):
        """Validate slug uniqueness"""
        if value and PortfolioTag.objects.filter(slug=value).exists():
            raise serializers.ValidationError("این نامک قبلاً استفاده شده است.")
        return value
    
    def validate_name(self, value):
        """Validate name uniqueness"""
        if PortfolioTag.objects.filter(name=value).exists():
            raise serializers.ValidationError("این نام قبلاً استفاده شده است.")
        return value


class PortfolioTagAdminUpdateSerializer(serializers.ModelSerializer):
    """Update serializer with validation"""
    
    class Meta:
        model = PortfolioTag
        fields = [
            'name', 'slug', 'description', 'is_active'
        ]
    
    def validate_slug(self, value):
        """Validate slug uniqueness excluding current instance"""
        if value and PortfolioTag.objects.exclude(
            id=self.instance.id
        ).filter(slug=value).exists():
            raise serializers.ValidationError("این نامک قبلاً استفاده شده است.")
        return value
    
    def validate_name(self, value):
        """Validate name uniqueness excluding current instance"""
        if PortfolioTag.objects.exclude(
            id=self.instance.id
        ).filter(name=value).exists():
            raise serializers.ValidationError("این نام قبلاً استفاده شده است.")
        return value


class PortfolioTagSimpleAdminSerializer(serializers.ModelSerializer):
    """Simple serializer for nested usage in other serializers"""
    
    class Meta:
        model = PortfolioTag
        fields = ['id', 'public_id', 'name', 'slug']
        read_only_fields = ['id', 'public_id']


# Backward compatibility - Main serializer alias
class PortfolioTagAdminSerializer(PortfolioTagAdminDetailSerializer):
    """Backward compatibility alias for existing code"""
    pass