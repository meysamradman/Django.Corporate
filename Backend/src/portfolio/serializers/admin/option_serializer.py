from rest_framework import serializers
from src.portfolio.models.option import PortfolioOption
from src.portfolio.serializers.mixins import CountsMixin


class PortfolioOptionAdminListSerializer(CountsMixin, serializers.ModelSerializer):
    """Optimized list view for admin with usage statistics"""
    portfolio_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioOption
        fields = [
            'id', 'public_id', 'name', 'slug', 'description', 
            'is_active', 'is_public', 'portfolio_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_portfolio_count(self, obj):
        """Get portfolio count from annotation or database"""
        return getattr(obj, 'portfolio_count', obj.portfolio_options.count())


class PortfolioOptionAdminDetailSerializer(serializers.ModelSerializer):
    """Complete detail view for admin with full information"""
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
        """Get portfolio count from annotation or database"""
        return getattr(obj, 'portfolio_count', obj.portfolio_options.count())
    
    def get_related_options(self, obj):
        """Get other options with same name"""
        if not obj.name:
            return []
        
        related = PortfolioOption.objects.filter(
            name=obj.name, is_active=True
        ).exclude(id=obj.id).order_by('name')[:5]
        
        return [
            {
                'id': option.id,
                'public_id': option.public_id,
                'value': option.value,
                'portfolio_count': option.portfolio_options.count()
            }
            for option in related
        ]
    
    def get_popular_portfolios(self, obj):
        """Get top 5 popular portfolios using this option"""
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
    """Create serializer with validation"""
    
    class Meta:
        model = PortfolioOption
        fields = [
            'name', 'slug', 'description', 'is_active', 'is_public'
        ]
    
    def validate(self, data):
        """Validate name uniqueness"""
        name = data.get('name')
        
        if name:
            if PortfolioOption.objects.filter(name=name).exists():
                raise serializers.ValidationError({
                    'non_field_errors': [f'گزینه با نام "{name}" قبلاً وجود دارد.']
                })
        
        return data
    
    def validate_name(self, value):
        """Validate name"""
        if not value or not value.strip():
            raise serializers.ValidationError("نام نمی‌تواند خالی باشد.")
        
        return value
    
    def validate_slug(self, value):
        """Validate slug"""
        if not value or not value.strip():
            raise serializers.ValidationError("اسلاگ نمی‌تواند خالی باشد.")
        return value


class PortfolioOptionAdminUpdateSerializer(serializers.ModelSerializer):
    """Update serializer with validation"""
    
    class Meta:
        model = PortfolioOption
        fields = [
            'name', 'slug', 'description', 'is_active', 'is_public'
        ]
    
    def validate(self, data):
        """Validate name uniqueness excluding current instance"""
        name = data.get('name')
        
        if name and self.instance:
            if PortfolioOption.objects.exclude(
                id=self.instance.id
            ).filter(name=name).exists():
                raise serializers.ValidationError({
                    'non_field_errors': [f'گزینه با نام "{name}" قبلاً وجود دارد.']
                })
        
        return data
    
    def validate_name(self, value):
        """Validate name"""
        if not value or not value.strip():
            raise serializers.ValidationError("نام نمی‌تواند خالی باشد.")
        
        return value
    
    def validate_slug(self, value):
        """Validate slug"""
        if not value or not value.strip():
            raise serializers.ValidationError("اسلاگ نمی‌تواند خالی باشد.")
        return value


class PortfolioOptionSimpleAdminSerializer(serializers.ModelSerializer):
    """Simple serializer for nested usage in other serializers"""
    
    class Meta:
        model = PortfolioOption
        fields = ['id', 'public_id', 'name', 'slug']
        read_only_fields = ['id', 'public_id']


class PortfolioOptionGroupedAdminSerializer(serializers.Serializer):
    """Serializer for grouped options by key"""
    key = serializers.CharField()
    options = PortfolioOptionSimpleAdminSerializer(many=True)
    total_count = serializers.IntegerField()


# Backward compatibility - Main serializer alias
class PortfolioOptionAdminSerializer(PortfolioOptionAdminDetailSerializer):
    """Backward compatibility alias for existing code"""
    pass