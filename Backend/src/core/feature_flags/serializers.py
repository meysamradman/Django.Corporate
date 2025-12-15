from rest_framework import serializers
from .models import FeatureFlag


class FeatureFlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureFlag
        fields = ['id', 'public_id', 'key', 'is_active', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']


class FeatureFlagListSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureFlag
        fields = ['key', 'is_active']

