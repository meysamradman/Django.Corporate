from rest_framework import serializers
from src.portfolio.models.tag import PortfolioTag
from src.portfolio.serializers.mixins import CountsMixin
from src.portfolio.messages import TAG_ERRORS

class PortfolioTagAdminListSerializer(CountsMixin, serializers.ModelSerializer):
    portfolio_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PortfolioTag
        fields = [
            'id', 'public_id', 'name', 'slug', 'description', 
            'is_active', 'portfolio_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']

class PortfolioTagAdminDetailSerializer(serializers.ModelSerializer):
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
        return getattr(obj, 'portfolio_count', obj.portfolio_tags.count())
    
    def get_popular_portfolios(self, obj):
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
    class Meta:
        model = PortfolioTag
        fields = [
            'name', 'slug', 'description', 'is_active'
        ]
    
    def validate_slug(self, value):
        if value and PortfolioTag.objects.filter(slug=value).exists():
            raise serializers.ValidationError(TAG_ERRORS["tag_slug_exists"])
        return value
    
    def validate_name(self, value):
        if PortfolioTag.objects.filter(name=value).exists():
            raise serializers.ValidationError(TAG_ERRORS["tag_name_exists"])
        return value

class PortfolioTagAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioTag
        fields = [
            'name', 'slug', 'description', 'is_active'
        ]
    
    def validate_slug(self, value):
        if value and PortfolioTag.objects.exclude(
            id=self.instance.id
        ).filter(slug=value).exists():
            raise serializers.ValidationError(TAG_ERRORS["tag_slug_exists"])
        return value
    
    def validate_name(self, value):
        if PortfolioTag.objects.exclude(
            id=self.instance.id
        ).filter(name=value).exists():
            raise serializers.ValidationError(TAG_ERRORS["tag_name_exists"])
        return value

class PortfolioTagSimpleAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioTag
        fields = ['id', 'public_id', 'name', 'slug']
        read_only_fields = ['id', 'public_id']

class PortfolioTagAdminSerializer(PortfolioTagAdminDetailSerializer):
    pass
