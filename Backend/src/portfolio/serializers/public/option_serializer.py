from rest_framework import serializers
from src.portfolio.models.option import PortfolioOption


class PortfolioOptionPublicSerializer(serializers.ModelSerializer):
    """Public serializer for portfolio options with portfolio count"""
    portfolio_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = PortfolioOption
        fields = [
            'public_id', 'key', 'value', 'slug', 'description', 
            'portfolio_count', 'created_at'
        ]