from rest_framework import serializers
from src.portfolio.models.tag import PortfolioTag


class PortfolioTagPublicSerializer(serializers.ModelSerializer):
    """Public serializer for portfolio tags with portfolio count"""
    portfolio_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = PortfolioTag
        fields = [
            'public_id', 'name', 'slug', 'description', 
            'portfolio_count', 'created_at'
        ]