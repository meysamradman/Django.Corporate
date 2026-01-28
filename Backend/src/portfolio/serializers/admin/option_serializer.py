from rest_framework import serializers
from src.portfolio.models.option import PortfolioOption
from src.portfolio.serializers.mixins import CountsMixin
from src.portfolio.messages import OPTION_ERRORS

class PortfolioOptionAdminListSerializer(CountsMixin, serializers.ModelSerializer):
    portfolio_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioOption
        fields = [
            'id', 'public_id', 'name', 'slug', 'description', 
            'is_active', 'is_public', 'portfolio_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_portfolio_count(self, obj):
        return getattr(obj, 'portfolio_count', obj.portfolio_options.count())

class PortfolioOptionAdminDetailSerializer(serializers.ModelSerializer):
    portfolio_count = serializers.SerializerMethodField()
    related_options = serializers.SerializerMethodField()
    popular_portfolios = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioOption
        fields = [
            'id', 'public_id', 'name', 'slug', 'description', 
            'is_active', 'is_public', 'portfolio_count', 'related_options', 'popular_portfolios',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_portfolio_count(self, obj):
        return getattr(obj, 'portfolio_count', obj.portfolio_options.count())
    
    def get_related_options(self, obj):
        if not obj.name:
            return []
        
        related = PortfolioOption.objects.filter(
            name=obj.name, is_active=True
        ).exclude(id=obj.id).order_by('name')[:5]
        
        return [
            {
                'id': option.id,
                'public_id': option.public_id,
                'name': option.name,
                'portfolio_count': option.portfolio_options.count()
            }
            for option in related
        ]
    
    def get_popular_portfolios(self, obj):
        portfolios = obj.portfolio_options.filter(
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

class PortfolioOptionAdminCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioOption
        fields = [
            'name', 'slug', 'description', 'is_active', 'is_public'
        ]
    
    def validate(self, data):
        name = data.get('name')
        
        if name:
            if PortfolioOption.objects.filter(name=name).exists():
                raise serializers.ValidationError({
                    'non_field_errors': [OPTION_ERRORS["option_name_exists"].format(name=name)]
                })
        
        return data
    
    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(OPTION_ERRORS["option_name_required"])
        
        return value
    
    def validate_slug(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(OPTION_ERRORS["option_slug_required"])
        return value

class PortfolioOptionAdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioOption
        fields = [
            'name', 'slug', 'description', 'is_active', 'is_public'
        ]
    
    def validate(self, data):
        name = data.get('name')
        
        if name and self.instance:
            if PortfolioOption.objects.exclude(
                id=self.instance.id
            ).filter(name=name).exists():
                raise serializers.ValidationError({
                    'non_field_errors': [OPTION_ERRORS["option_name_exists"].format(name=name)]
                })
        
        return data
    
    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(OPTION_ERRORS["option_name_required"])
        
        return value
    
    def validate_slug(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(OPTION_ERRORS["option_slug_required"])
        return value

class PortfolioOptionSimpleAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioOption
        fields = ['id', 'public_id', 'name', 'slug']
        read_only_fields = ['id', 'public_id']

class PortfolioOptionGroupedAdminSerializer(serializers.Serializer):
    key = serializers.CharField()
    options = PortfolioOptionSimpleAdminSerializer(many=True)
    total_count = serializers.IntegerField()

class PortfolioOptionAdminSerializer(PortfolioOptionAdminDetailSerializer):
    pass
