from rest_framework import serializers
from rest_framework import serializers
from src.ai.models.admin_ai_settings import AdminAISettings


class AdminAISettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for Admin AI Settings
    """
    provider_display = serializers.CharField(source='get_provider_name_display', read_only=True)
    admin_name = serializers.CharField(source='admin.get_full_name', read_only=True)
    has_api_key = serializers.SerializerMethodField()
    usage_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminAISettings
        fields = [
            'id',
            'admin',
            'admin_name',
            'provider_name',
            'provider_display',
            'is_active',
            'use_shared_api',
            'has_api_key',
            'usage_count',
            'monthly_usage',
            'monthly_limit',
            'usage_percentage',
            'last_used_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'usage_count', 'monthly_usage', 'last_used_at', 'created_at', 'updated_at']
    
    def get_has_api_key(self, obj):
        """Check if admin has personal API key"""
        return bool(obj.api_key)
    
    def get_usage_percentage(self, obj):
        """Calculate usage percentage"""
        if obj.monthly_limit == 0:
            return 0
        return round((obj.monthly_usage / obj.monthly_limit) * 100, 2)


class AdminAISettingsCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating Admin AI Settings
    """
    api_key = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        help_text="API Key شخصی (اختیاری)"
    )
    
    class Meta:
        model = AdminAISettings
        fields = [
            'provider_name',
            'api_key',
            'is_active',
            'use_shared_api',
            'monthly_limit',
        ]
    
    def validate(self, data):
        """Validate settings"""
        # ✅ اجازه بده فقط سوییچ کنه بدون API key
        # چک کردن API key رو به زمان استفاده واقعی موکول می‌کنیم
        return data


class AdminAISettingsListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing Admin AI Settings (for super admin)
    """
    provider_display = serializers.CharField(source='get_provider_name_display', read_only=True)
    admin_name = serializers.CharField(source='admin.get_full_name', read_only=True)
    admin_email = serializers.EmailField(source='admin.email', read_only=True)
    has_api_key = serializers.SerializerMethodField()
    usage_percentage = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminAISettings
        fields = [
            'id',
            'admin',
            'admin_name',
            'admin_email',
            'provider_name',
            'provider_display',
            'is_active',
            'use_shared_api',
            'has_api_key',
            'usage_count',
            'monthly_usage',
            'monthly_limit',
            'usage_percentage',
            'status',
            'last_used_at',
        ]
    
    def get_has_api_key(self, obj):
        """Check if admin has personal API key"""
        return bool(obj.api_key)
    
    def get_usage_percentage(self, obj):
        """Calculate usage percentage"""
        if obj.monthly_limit == 0:
            return 0
        return round((obj.monthly_usage / obj.monthly_limit) * 100, 2)
    
    def get_status(self, obj):
        """Get status based on usage"""
        if not obj.is_active:
            return 'inactive'
        
        if obj.use_shared_api:
            return 'shared'
        
        if obj.has_reached_limit():
            return 'limit_reached'
        
        usage_percentage = self.get_usage_percentage(obj)
        if usage_percentage >= 90:
            return 'warning'
        
        return 'active'

