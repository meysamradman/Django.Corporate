from rest_framework import serializers
from src.portfolio.models.option import PortfolioOption
from src.portfolio.serializers.mixins import CountsMixin


class PortfolioOptionAdminListSerializer(CountsMixin, serializers.ModelSerializer):
    """Optimized list view for admin with usage statistics"""
    portfolio_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioOption
        fields = [
            'id', 'public_id', 'key', 'value', 'description', 
            'is_active', 'portfolio_count', 'created_at', 'updated_at'
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
            'id', 'public_id', 'key', 'value', 'description', 
            'is_active', 'portfolio_count', 'related_options', 'popular_portfolios',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_portfolio_count(self, obj):
        """Get portfolio count from annotation or database"""
        return getattr(obj, 'portfolio_count', obj.portfolio_options.count())
    
    def get_related_options(self, obj):
        """Get other options with same key"""
        if not obj.key:
            return []
        
        related = PortfolioOption.objects.filter(
            key=obj.key, is_active=True
        ).exclude(id=obj.id).order_by('value')[:5]
        
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
            'key', 'value', 'description', 'is_active'
        ]
    
    def validate(self, data):
        """Validate key-value combination"""
        key = data.get('key')
        value = data.get('value')
        
        if key and value:
            if PortfolioOption.objects.filter(key=key, value=value).exists():
                raise serializers.ValidationError({
                    'non_field_errors': [f'گزینه با کلید "{key}" و مقدار "{value}" قبلاً وجود دارد.']
                })
        
        return data
    
    def validate_key(self, value):
        """Validate key format"""
        if not value or not value.strip():
            raise serializers.ValidationError("کلید نمی‌تواند خالی باشد.")
        
        # Key should be alphanumeric with underscores/hyphens
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', value):
            raise serializers.ValidationError(
                "کلید فقط می‌تواند شامل حروف انگلیسی، اعداد، خط تیره و زیرخط باشد."
            )
        
        return value
    
    def validate_value(self, value):
        """Validate value"""
        if not value or not value.strip():
            raise serializers.ValidationError("مقدار نمی‌تواند خالی باشد.")
        return value


class PortfolioOptionAdminUpdateSerializer(serializers.ModelSerializer):
    """Update serializer with validation"""
    
    class Meta:
        model = PortfolioOption
        fields = [
            'key', 'value', 'description', 'is_active'
        ]
    
    def validate(self, data):
        """Validate key-value combination excluding current instance"""
        key = data.get('key')
        value = data.get('value')
        
        if key and value:
            if PortfolioOption.objects.exclude(
                id=self.instance.id
            ).filter(key=key, value=value).exists():
                raise serializers.ValidationError({
                    'non_field_errors': [f'گزینه با کلید "{key}" و مقدار "{value}" قبلاً وجود دارد.']
                })
        
        return data
    
    def validate_key(self, value):
        """Validate key format"""
        if not value or not value.strip():
            raise serializers.ValidationError("کلید نمی‌تواند خالی باشد.")
        
        # Key should be alphanumeric with underscores/hyphens
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', value):
            raise serializers.ValidationError(
                "کلید فقط می‌تواند شامل حروف انگلیسی، اعداد، خط تیره و زیرخط باشد."
            )
        
        return value
    
    def validate_value(self, value):
        """Validate value"""
        if not value or not value.strip():
            raise serializers.ValidationError("مقدار نمی‌تواند خالی باشد.")
        return value


class PortfolioOptionSimpleAdminSerializer(serializers.ModelSerializer):
    """Simple serializer for nested usage in other serializers"""
    
    class Meta:
        model = PortfolioOption
        fields = ['id', 'public_id', 'key', 'value']
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