from rest_framework import serializers
from src.ai.models import AIProvider, AIModel


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
    
    def validate(self, attrs):
        api_key = attrs.get('shared_api_key')
        slug = attrs.get('slug') or (self.instance.slug if self.instance else None)
        
        if api_key and api_key != '***' and api_key.strip():
            if self.instance and self.instance.shared_api_key and api_key == '***':
                return attrs
            
            from src.ai.services.image_generation_service import AIImageGenerationService
            try:
                is_valid = AIImageGenerationService.validate_provider_api_key(
                    slug,
                    api_key.strip()
                )
                if not is_valid:
                    attrs['is_active'] = False
            except Exception:
                attrs['is_active'] = False
        
        return attrs
    
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
    model_id = serializers.IntegerField(
        required=True,
        help_text="AI Model ID with 'image' capability"
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
        default=True,
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
        from src.ai.messages.messages import IMAGE_ERRORS
        if not value or not value.strip():
            raise serializers.ValidationError(IMAGE_ERRORS["prompt_required"])
        if len(value.strip()) < 3:
            raise serializers.ValidationError(IMAGE_ERRORS["prompt_invalid"])
        return value.strip()

