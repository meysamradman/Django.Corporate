from rest_framework import serializers
from src.portfolio.models.option import PortfolioOption


class PortfolioOptionPublicSerializer(serializers.ModelSerializer):
    portfolio_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = PortfolioOption
        fields = [
            'public_id', 'name', 'slug', 'description', 
            'portfolio_count', 'created_at'
        ]
