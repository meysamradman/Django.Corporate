from rest_framework import serializers

from src.ai.models import AIProvider
from src.ai.messages.messages import IMAGE_ERRORS
from src.ai.services.image_generation_service import AIImageGenerationService

class AIProviderSerializer(serializers.ModelSerializer):
    
    has_shared_api_key = serializers.SerializerMethodField()
    
    class Meta:
        model = AIProvider
        fields = [
            'id', 'name', 'slug', 'display_name', 'website',
            'api_base_url', 'description', 'shared_api_key',
            'has_shared_api_key', 'allow_personal_keys',
            'allow_shared_for_normal_admins', 'is_active',
            'config', 'total_requests', 'last_used_at',
            'sort_order', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'total_requests', 'last_used_at', 'created_at', 'updated_at'
        ]
    
    def get_has_shared_api_key(self, obj) -> bool:
        return bool(obj.shared_api_key)
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if 'shared_api_key' in data:
            data['shared_api_key'] = '***' if instance.shared_api_key else None
        return data

class AIProviderListSerializer(serializers.ModelSerializer):
    
    has_shared_api_key = serializers.SerializerMethodField()
    models_count = serializers.SerializerMethodField()
    active_models_count = serializers.SerializerMethodField()
    
    class Meta:
        model = AIProvider
        fields = [
            'id', 'name', 'slug', 'display_name', 'description',
            'has_shared_api_key', 'allow_personal_keys',
            'allow_shared_for_normal_admins', 'is_active',
            'models_count', 'active_models_count',
            'total_requests', 'last_used_at', 'sort_order'
        ]
    
    def get_has_shared_api_key(self, obj) -> bool:
        return bool(obj.shared_api_key)
    
    def get_models_count(self, obj) -> int:
        return obj.models.count()
    
    def get_active_models_count(self, obj) -> int:
        return obj.models.filter(is_active=True).count()

class AIImageGenerationRequestSerializer(serializers.Serializer):
    provider_name = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        default=None,
        help_text="Optional. If omitted, server uses the default image model."
    )
    model_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Deprecated/ignored. Model is resolved from provider active model."
    )
    prompt = serializers.CharField(
        required=True,
        max_length=4000,
        help_text="Image description"
    )
    
    size = serializers.CharField(
        required=False,
        default="1024x1024",
        help_text="Image size"
    )
    quality = serializers.ChoiceField(
        choices=['standard', 'hd'],
        default='standard',
        required=False
    )
    style = serializers.ChoiceField(
        choices=['vivid', 'natural'],
        default='vivid',
        required=False
    )
    n = serializers.IntegerField(
        default=1,
        min_value=1,
        max_value=10,
        required=False
    )
    
    save_to_media = serializers.BooleanField(
        default=False,
        required=False
    )
    title = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True
    )
    alt_text = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True
    )
    
    def validate_prompt(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(IMAGE_ERRORS["prompt_required"])
        if len(value.strip()) < 3:
            raise serializers.ValidationError(IMAGE_ERRORS["prompt_invalid"])
        return value.strip()

    def validate_provider_name(self, value: str):
        provider_slug = (value or '').strip().lower()
        if not provider_slug:
            return None

        provider = AIProvider.objects.filter(slug=provider_slug, is_active=True).first()
        if not provider:
            raise serializers.ValidationError("Provider نامعتبر یا غیرفعال است")

        return provider_slug

