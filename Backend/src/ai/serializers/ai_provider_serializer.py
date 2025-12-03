from rest_framework import serializers
from src.ai.models import AIProvider, AIModel, AdminProviderSettings
from src.ai.services.state_machine import ModelAccessState


class AIProviderListSerializer(serializers.ModelSerializer):
    models_count = serializers.SerializerMethodField()
    has_shared_api = serializers.SerializerMethodField()
    
    class Meta:
        model = AIProvider
        fields = [
            'id', 'name', 'slug', 'display_name', 'description',
            'allow_personal_keys', 'allow_shared_for_normal_admins',
            'models_count', 'has_shared_api', 'is_active',
            'total_requests', 'last_used_at', 'created_at'
        ]
        read_only_fields = ['slug', 'total_requests', 'last_used_at']
    
    def get_models_count(self, obj):
        return obj.models.filter(is_active=True).count()
    
    def get_has_shared_api(self, obj):
        return bool(obj.shared_api_key)


class AIProviderDetailSerializer(serializers.ModelSerializer):
    models_count = serializers.SerializerMethodField()
    has_shared_api = serializers.SerializerMethodField()
    shared_api_key_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = AIProvider
        fields = [
            'id', 'name', 'slug', 'display_name', 'description',
            'website', 'api_base_url',
            'allow_personal_keys', 'allow_shared_for_normal_admins',
            'models_count', 'has_shared_api', 'shared_api_key_preview',
            'config', 'is_active', 'sort_order',
            'total_requests', 'last_used_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['slug', 'total_requests', 'last_used_at']
    
    def get_models_count(self, obj):
        return obj.models.filter(is_active=True).count()
    
    def get_has_shared_api(self, obj):
        return bool(obj.shared_api_key)
    
    def get_shared_api_key_preview(self, obj):
        if obj.shared_api_key:
            decrypted = obj.get_shared_api_key()
            if len(decrypted) > 10:
                return f"{decrypted[:4]}...{decrypted[-4:]}"
            return "***"
        return None


class AIProviderCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIProvider
        fields = [
            'name', 'display_name', 'description', 'website', 'api_base_url',
            'shared_api_key', 'allow_personal_keys', 'allow_shared_for_normal_admins',
            'config', 'is_active', 'sort_order'
        ]
    
    def validate_name(self, value):
        instance = self.instance
        from src.ai.messages.messages import IMAGE_ERRORS
        if instance:
            if AIProvider.objects.exclude(pk=instance.pk).filter(name=value).exists():
                raise serializers.ValidationError(IMAGE_ERRORS['provider_name_duplicate'])
        else:
            if AIProvider.objects.filter(name=value).exists():
                raise serializers.ValidationError(IMAGE_ERRORS['provider_name_duplicate'])
        return value


class AIModelListSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.display_name', read_only=True)
    provider_slug = serializers.CharField(source='provider.slug', read_only=True)
    is_free = serializers.SerializerMethodField()
    
    class Meta:
        model = AIModel
        fields = [
            'id', 'name', 'model_id', 'display_name', 'description',
            'provider_name', 'provider_slug', 'capabilities',
            'pricing_input', 'pricing_output', 'is_free',
            'max_tokens', 'context_window', 'is_active',
            'total_requests', 'last_used_at', 'sort_order'
        ]
        read_only_fields = ['total_requests', 'last_used_at']
    
    def get_is_free(self, obj):
        return obj.pricing_input is None or obj.pricing_input == 0


class AIModelDetailSerializer(serializers.ModelSerializer):
    """
    ✅ Serializer برای جزئیات مدل AI - with Computed Fields
    برای پنل ادمین با تمام اطلاعات دسترسی
    """
    provider = AIProviderListSerializer(read_only=True)
    is_free = serializers.SerializerMethodField()
    
    # ✅ Computed Fields from Model
    access_state = serializers.SerializerMethodField()
    api_config = serializers.SerializerMethodField()
    actions = serializers.SerializerMethodField()
    usage_info = serializers.SerializerMethodField()
    
    class Meta:
        model = AIModel
        fields = [
            'id', 'name', 'model_id', 'display_name', 'description',
            'provider', 'capabilities',
            'pricing_input', 'pricing_output', 'is_free',
            'max_tokens', 'context_window', 'config',
            'is_active', 'sort_order',
            'total_requests', 'last_used_at',
            # ✅ Computed fields
            'access_state', 'api_config', 'actions', 'usage_info',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['total_requests', 'last_used_at']
    
    def get_is_free(self, obj):
        return obj.pricing_input is None or obj.pricing_input == 0
    
    def get_access_state(self, obj):
        request = self.context.get('request')
        if request and request.user:
            state = ModelAccessState.calculate(obj.provider, obj, request.user)
            return state.value
        return ModelAccessState.NO_ACCESS.value
    
    def get_api_config(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.get_api_config(request.user)
        return None
    
    def get_actions(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.get_actions(request.user)
        return None
    
    def get_usage_info(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.get_usage_info(request.user)
        return None


class AIModelCreateUpdateSerializer(serializers.ModelSerializer):
    provider_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = AIModel
        fields = [
            'provider_id', 'name', 'model_id', 'display_name', 'description',
            'capabilities', 'pricing_input', 'pricing_output',
            'max_tokens', 'context_window', 'config',
            'is_active', 'sort_order'
        ]
    
    def validate_provider_id(self, value):
        from src.ai.messages.messages import IMAGE_ERRORS
        try:
            AIProvider.objects.get(pk=value, is_active=True)
        except AIProvider.DoesNotExist:
            raise serializers.ValidationError(IMAGE_ERRORS['provider_not_found_or_inactive'])
        return value
    
    def create(self, validated_data):
        provider_id = validated_data.pop('provider_id')
        model_id = validated_data.get('model_id')
        
        # ✅ Check if model already exists with this provider_id and model_id
        try:
            existing_model = AIModel.objects.get(
                provider_id=provider_id,
                model_id=model_id
            )
            # ✅ Model exists → Update it
            for key, value in validated_data.items():
                setattr(existing_model, key, value)
            existing_model.save()
            return existing_model
        except AIModel.DoesNotExist:
            # ✅ Model doesn't exist → Create new one
            validated_data['provider_id'] = provider_id
            return super().create(validated_data)
    
    def update(self, instance, validated_data):
        if 'provider_id' in validated_data:
            validated_data['provider_id'] = validated_data.pop('provider_id')
        return super().update(instance, validated_data)


class AdminProviderSettingsSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.display_name', read_only=True)
    provider_slug = serializers.CharField(source='provider.slug', read_only=True)
    has_personal_api = serializers.SerializerMethodField()
    api_key = serializers.SerializerMethodField()  # Add api_key for display
    usage_info = serializers.SerializerMethodField()
    api_config = serializers.SerializerMethodField()
    actions = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminProviderSettings
        fields = [
            'id', 'provider_name', 'provider_slug',
            'has_personal_api', 'api_key', 'use_shared_api',  # Add api_key
            'monthly_limit', 'monthly_usage', 'usage_info',
            'api_config', 'actions',
            'total_requests', 'last_used_at', 'is_active'
        ]
        read_only_fields = ['monthly_usage', 'total_requests', 'last_used_at']
    
    def get_has_personal_api(self, obj):
        return bool(obj.personal_api_key)
    
    def get_api_key(self, obj):
        # If use_shared_api=True, get from shared provider
        # obj.provider is loaded from select_related (no N+1)
        if obj.use_shared_api and obj.provider and obj.provider.shared_api_key:
            try:
                # get_shared_api_key() only decrypts (no extra query)
                return obj.provider.get_shared_api_key()
            except Exception:
                return None
        # Otherwise get from personal API key
        elif obj.personal_api_key:
            try:
                # get_personal_api_key() only decrypts (no extra query)
                return obj.get_personal_api_key()
            except Exception:
                return None
        return None
    
    def get_usage_info(self, obj):
        return obj.get_usage_info()
    
    def get_api_config(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.get_api_config(request.user)
        return None
    
    def get_actions(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.get_actions(request.user)
        return None


class AdminProviderSettingsUpdateSerializer(serializers.ModelSerializer):
    provider_id = serializers.IntegerField(write_only=True, required=False)
    provider_name = serializers.CharField(write_only=True, required=False)  # ✅ Accept provider_name from frontend
    api_key = serializers.CharField(write_only=True, required=False, allow_blank=True)  # ✅ Alias for personal_api_key
    
    class Meta:
        model = AdminProviderSettings
        fields = [
            'provider', 'provider_id', 'provider_name', 'personal_api_key', 'api_key',
            'use_shared_api', 'monthly_limit', 'is_active'
        ]
        extra_kwargs = {
            'provider': {'read_only': True}  # ✅ provider is set in view, not from request
        }
    
    def validate(self, attrs):
        # ✅ Map provider_name to provider_id
        if 'provider_name' in attrs and 'provider_id' not in attrs:
            try:
                # Search by name or slug
                from django.db.models import Q
                provider = AIProvider.objects.get(
                    Q(name=attrs['provider_name']) | Q(slug=attrs['provider_name']),
                    is_active=True
                )
                attrs['provider_id'] = provider.id
            except AIProvider.DoesNotExist:
                raise serializers.ValidationError({
                    'provider_name': 'Provider یافت نشد یا غیرفعال است'
                })
            # ✅ Remove provider_name after mapping
            attrs.pop('provider_name')
        
        # ✅ Map api_key to personal_api_key
        if 'api_key' in attrs and 'personal_api_key' not in attrs:
            attrs['personal_api_key'] = attrs.pop('api_key')
        
        # Soft validation: only warning, not error
        # Real validation happens when using Model (in generation views)
        # Here we just allow settings to be saved
        
        return attrs
    
    def validate_provider_id(self, value):
        from src.ai.messages.messages import IMAGE_ERRORS
        try:
            AIProvider.objects.get(pk=value, is_active=True)
        except AIProvider.DoesNotExist:
            raise serializers.ValidationError(IMAGE_ERRORS['provider_not_found_or_inactive'])
        return value
