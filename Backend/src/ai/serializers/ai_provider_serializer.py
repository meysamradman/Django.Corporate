from rest_framework import serializers
from django.db.models import Q

from src.ai.models import AIProvider, AdminProviderSettings
from src.ai.messages.messages import IMAGE_ERRORS, AI_ERRORS
from src.ai.utils.state_machine import ModelAccessState

class AIProviderListSerializer(serializers.ModelSerializer):
    models_count = serializers.SerializerMethodField()
    has_shared_api = serializers.SerializerMethodField()
    has_personal_api = serializers.SerializerMethodField()
    shared_api_key = serializers.SerializerMethodField()
    
    class Meta:
        model = AIProvider
        fields = [
            'id', 'name', 'slug', 'display_name', 'description',
            'allow_personal_keys', 'allow_shared_for_normal_admins',
            'models_count', 'has_shared_api', 'shared_api_key', 'has_personal_api', 'is_active',
            'total_requests', 'last_used_at', 'created_at', 'capabilities'
        ]
        read_only_fields = ['slug', 'total_requests', 'last_used_at']
    
    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        
        if request and request.user:
            is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
            
            if not is_super:
                fields.pop('shared_api_key', None)
        
        return fields
    
    def get_models_count(self, obj):
        return obj.models.filter(is_active=True).count()
    
    def get_has_shared_api(self, obj):
        return bool(obj.shared_api_key)
    
    def get_shared_api_key(self, obj):
        if obj.shared_api_key:
            return obj.get_shared_api_key()
        return None
    
    def get_has_personal_api(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return False
        
        personal_setting = AdminProviderSettings.objects.filter(
            provider=obj,
            admin=request.user,
            is_active=True
        ).first()
        
        return bool(personal_setting and personal_setting.personal_api_key)

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
    
    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        
        if request and request.user:
            is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
            
            if not is_super:
                fields.pop('shared_api_key_preview', None)
                fields.pop('allow_shared_for_normal_admins', None)
                fields.pop('has_shared_api', None)
        
        return fields
    
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
    shared_api_key = serializers.CharField(allow_blank=True, required=False)
    
    class Meta:
        model = AIProvider
        fields = [
            'name', 'display_name', 'description', 'website', 'api_base_url',
            'shared_api_key', 'allow_personal_keys', 'allow_shared_for_normal_admins',
            'config', 'is_active', 'sort_order'
        ]
    
    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        
        if request and request.user:
            is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
            
            if not is_super:
                fields.pop('shared_api_key', None)
                fields.pop('allow_shared_for_normal_admins', None)
                fields['is_active'].read_only = True
                fields['sort_order'].read_only = True
        
        return fields
    
    def validate_name(self, value):
        instance = self.instance
        if instance:
            if AIProvider.objects.exclude(pk=instance.pk).filter(name=value).exists():
                raise serializers.ValidationError(IMAGE_ERRORS.get('provider_name_duplicate', 'این نام قبلاً استفاده شده'))
        else:
            if AIProvider.objects.filter(name=value).exists():
                raise serializers.ValidationError(IMAGE_ERRORS.get('provider_name_duplicate', 'این نام قبلاً استفاده شده'))
        return value


# AIModel serializers removed as we don't use AIModel table anymore.
# Logic is now handled via AICapabilityModel and hardcoded providers.

class AIModelDetailSerializer(serializers.Serializer):
    """
    Placeholder serializer if needed, but logic is gone.
    """
    pass


class AIModelCreateUpdateSerializer(serializers.Serializer):
    """
    Placeholder serializer if needed.
    """
    pass

class AdminProviderSettingsSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.display_name', read_only=True)
    provider_slug = serializers.CharField(source='provider.slug', read_only=True)
    has_personal_api = serializers.SerializerMethodField()
    api_key = serializers.SerializerMethodField()
    personal_api_key_value = serializers.SerializerMethodField()
    usage_info = serializers.SerializerMethodField()
    api_config = serializers.SerializerMethodField()
    actions = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminProviderSettings
        fields = [
            'id', 'provider_name', 'provider_slug',
            'has_personal_api', 'api_key', 'personal_api_key_value', 'use_shared_api',
            'monthly_limit', 'monthly_usage', 'usage_info',
            'api_config', 'actions',
            'total_requests', 'last_used_at', 'is_active'
        ]
        read_only_fields = ['monthly_usage', 'total_requests', 'last_used_at']
    
    def get_has_personal_api(self, obj):
        return bool(obj.personal_api_key)
    
    def get_api_key(self, obj):
        if obj.use_shared_api and obj.provider and obj.provider.shared_api_key:
            try:
                return obj.provider.get_shared_api_key()
            except Exception:
                return None
        elif obj.personal_api_key:
            try:
                return obj.get_personal_api_key()
            except Exception:
                return None
        return None
    
    def get_personal_api_key_value(self, obj):
        try:
            return obj.get_personal_api_key()
        except Exception:
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
    provider_name = serializers.CharField(write_only=True, required=False)
    api_key = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = AdminProviderSettings
        fields = [
            'provider', 'provider_id', 'provider_name', 'personal_api_key', 'api_key',
            'use_shared_api', 'monthly_limit', 'is_active'
        ]
        extra_kwargs = {
            'provider': {'read_only': True}
        }
    
    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        
        if request and request.user:
            is_super = getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin_full', False)
            
            if not is_super:
                if 'use_shared_api' in fields:
                    fields['use_shared_api'].read_only = True
        
        return fields
    
    def validate(self, attrs):
        if 'provider_name' in attrs and 'provider_id' not in attrs:
            try:
                provider = AIProvider.objects.get(
                    Q(name=attrs['provider_name']) | Q(slug=attrs['provider_name'])
                )
                attrs['provider_id'] = provider.id
            except AIProvider.DoesNotExist:
                raise serializers.ValidationError({
                    'provider_name': IMAGE_ERRORS.get('provider_not_found_or_inactive', AI_ERRORS.get('provider_not_found_or_inactive'))
                })
            attrs.pop('provider_name')
        
        if 'api_key' in attrs and 'personal_api_key' not in attrs:
            attrs['personal_api_key'] = attrs.pop('api_key')
        
        return attrs
    
    def validate_provider_id(self, value):
        if value:
            try:
                AIProvider.objects.get(pk=value)
            except AIProvider.DoesNotExist:
                raise serializers.ValidationError(IMAGE_ERRORS.get('provider_not_found_or_inactive', AI_ERRORS.get('provider_not_found_or_inactive')))
        return value
