from rest_framework import serializers
from src.ai.models.image_generation import AIImageGeneration
from src.ai.messages.messages import AI_ERRORS


class AIImageGenerationSerializer(serializers.ModelSerializer):
    """Serializer for managing AI model API keys"""
    
    provider_display = serializers.CharField(
        source='get_provider_name_display',
        read_only=True
    )
    
    has_api_key = serializers.SerializerMethodField()
    
    class Meta:
        model = AIImageGeneration
        fields = [
            'id',
            'provider_name',
            'provider_display',
            'api_key',
            'has_api_key',
            'is_active',
            'config',
            'usage_count',
            'last_used_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'usage_count',
            'last_used_at',
            'created_at',
            'updated_at',
        ]
    
    def get_has_api_key(self, obj) -> bool:
        """Check if API key is entered"""
        return bool(obj.api_key)
    
    def validate(self, attrs):
        """Validation"""
        api_key = attrs.get('api_key')
        provider_name = attrs.get('provider_name') or (self.instance.provider_name if self.instance else None)
        
        if api_key and api_key != '***' and api_key.strip():
            if self.instance and self.instance.api_key and api_key == '***':
                return attrs
            
            from src.ai.services.image_generation_service import AIImageGenerationService
            try:
                is_valid = AIImageGenerationService.validate_provider_api_key(
                    provider_name,
                    api_key.strip()
                )
                
                if not is_valid:
                    attrs['is_active'] = False
                else:
                    attrs['is_active'] = True
            except Exception as e:
                attrs['is_active'] = False
        
        return attrs
    
    def to_representation(self, instance):
        """Hide API key in response"""
        data = super().to_representation(instance)
        if 'api_key' in data:
            data['api_key'] = '***' if instance.api_key else None
        return data


class AIImageGenerationRequestSerializer(serializers.Serializer):
    """Serializer for image generation request"""
    
    provider_name = serializers.ChoiceField(
        choices=AIImageGeneration.PROVIDER_CHOICES,
        help_text="AI model name (gemini, openai, ...)"
    )
    
    prompt = serializers.CharField(
        max_length=1000,
        help_text="Image description"
    )
    
    title = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
        help_text="Image title (if not provided, prompt will be used)"
    )
    
    alt_text = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        help_text="Image alt text"
    )
    
    size = serializers.CharField(
        max_length=20,
        required=False,
        default='1024x1024',
        help_text="Image size (e.g., 1024x1024, 512x512)"
    )
    
    quality = serializers.CharField(
        max_length=20,
        required=False,
        default='standard',
        help_text="Image quality (standard, hd)"
    )
    
    save_to_db = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Save image to database? (default: false - only generate)"
    )
    
    def validate_provider_name(self, value):
        """Validate that provider is active and can generate images"""
        if value == 'gemini':
            raise serializers.ValidationError(AI_ERRORS["gemini_not_implemented"])
        
        if not AIImageGeneration.is_provider_available(value):
            raise serializers.ValidationError(
                AI_ERRORS["provider_not_available"].format(provider_name=value)
            )
        return value
    
    def validate_prompt(self, value):
        """Validate prompt"""
        if not value or not value.strip():
            raise serializers.ValidationError(AI_ERRORS["prompt_required"])
        return value.strip()


class AIImageGenerationListSerializer(serializers.ModelSerializer):
    """Simple serializer for listing Providers"""
    
    provider_display = serializers.CharField(
        source='get_provider_name_display',
        read_only=True
    )
    
    has_api_key = serializers.SerializerMethodField()
    can_generate = serializers.SerializerMethodField()
    
    class Meta:
        model = AIImageGeneration
        fields = [
            'id',
            'provider_name',
            'provider_display',
            'has_api_key',
            'is_active',
            'can_generate',
            'usage_count',
            'last_used_at',
        ]
    
    def get_has_api_key(self, obj) -> bool:
        return bool(obj.api_key)
    
    def get_can_generate(self, obj) -> bool:
        """Can images be generated with this Provider?"""
        if obj.provider_name == 'gemini':
            return False
        return obj.is_active and bool(obj.api_key)

