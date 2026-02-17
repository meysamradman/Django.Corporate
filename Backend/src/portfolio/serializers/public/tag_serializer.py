from rest_framework import serializers
from src.portfolio.models.tag import PortfolioTag

class PortfolioTagPublicSerializer(serializers.ModelSerializer):
    portfolio_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = PortfolioTag
        fields = [
            'id', 'public_id', 'name', 'slug', 'description', 
            'portfolio_count', 'created_at'
        ]
