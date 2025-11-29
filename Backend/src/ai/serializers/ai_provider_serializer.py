"""
Dynamic AI Provider Serializers - سیستم جدید 2025
"""
from rest_framework import serializers
from src.ai.models import AIProvider, AIModel, AdminProviderSettings
from src.ai.services.state_machine import ModelAccessState


class AIProviderListSerializer(serializers.ModelSerializer):
    """
    Serializer برای لیست Providers
    برای پنل ادمین
    """
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
        """تعداد مدل‌های فعال"""
        return obj.models.filter(is_active=True).count()
    
    def get_has_shared_api(self, obj):
        """آیا API مشترک داره؟"""
        return bool(obj.shared_api_key)


class AIProviderDetailSerializer(serializers.ModelSerializer):
    """
    Serializer برای جزئیات Provider
    فقط برای سوپر ادمین
    """
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
        """نمایش محدود API Key"""
        if obj.shared_api_key:
            decrypted = obj.get_shared_api_key()
            if len(decrypted) > 10:
                return f"{decrypted[:4]}...{decrypted[-4:]}"
            return "***"
        return None


class AIProviderCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer برای ایجاد و ویرایش Provider
    فقط برای سوپر ادمین
    """
    class Meta:
        model = AIProvider
        fields = [
            'name', 'display_name', 'description', 'website', 'api_base_url',
            'shared_api_key', 'allow_personal_keys', 'allow_shared_for_normal_admins',
            'config', 'is_active', 'sort_order'
        ]
    
    def validate_name(self, value):
        """بررسی یکتا بودن نام"""
        instance = self.instance
        if instance:
            # در حالت ویرایش
            if AIProvider.objects.exclude(pk=instance.pk).filter(name=value).exists():
                raise serializers.ValidationError("این نام قبلاً استفاده شده است")
        else:
            # در حالت ایجاد
            if AIProvider.objects.filter(name=value).exists():
                raise serializers.ValidationError("این نام قبلاً استفاده شده است")
        return value


class AIModelListSerializer(serializers.ModelSerializer):
    """
    Serializer برای لیست مدل‌های AI
    """
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
        """آیا مدل رایگان است؟"""
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
        """محاسبه state دسترسی برای ادمین فعلی"""
        request = self.context.get('request')
        if request and request.user:
            state = ModelAccessState.calculate(obj.provider, obj, request.user)
            return state.value
        return ModelAccessState.NO_ACCESS.value
    
    def get_api_config(self, obj):
        """✅ Computed Field: API configuration"""
        request = self.context.get('request')
        if request and request.user:
            return obj.get_api_config(request.user)
        return None
    
    def get_actions(self, obj):
        """✅ Computed Field: Available actions"""
        request = self.context.get('request')
        if request and request.user:
            return obj.get_actions(request.user)
        return None
    
    def get_usage_info(self, obj):
        """✅ Computed Field: Usage information"""
        request = self.context.get('request')
        if request and request.user:
            return obj.get_usage_info(request.user)
        return None


class AIModelCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer برای ایجاد و ویرایش مدل AI
    """
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
        """بررسی وجود Provider"""
        try:
            AIProvider.objects.get(pk=value, is_active=True)
        except AIProvider.DoesNotExist:
            raise serializers.ValidationError("Provider یافت نشد یا غیرفعال است")
        return value
    
    def create(self, validated_data):
        provider_id = validated_data.pop('provider_id')
        validated_data['provider_id'] = provider_id
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        if 'provider_id' in validated_data:
            validated_data['provider_id'] = validated_data.pop('provider_id')
        return super().update(instance, validated_data)


class AdminProviderSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer برای تنظیمات شخصی ادمین
    """
    provider_name = serializers.CharField(source='provider.display_name', read_only=True)
    provider_slug = serializers.CharField(source='provider.slug', read_only=True)
    has_personal_api = serializers.SerializerMethodField()
    api_key = serializers.SerializerMethodField()  # ✅ اضافه کردن api_key برای نمایش
    usage_info = serializers.SerializerMethodField()
    api_config = serializers.SerializerMethodField()
    actions = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminProviderSettings
        fields = [
            'id', 'provider_name', 'provider_slug',
            'has_personal_api', 'api_key', 'use_shared_api',  # ✅ اضافه کردن api_key
            'monthly_limit', 'monthly_usage', 'usage_info',
            'api_config', 'actions',
            'total_requests', 'last_used_at', 'is_active'
        ]
        read_only_fields = ['monthly_usage', 'total_requests', 'last_used_at']
    
    def get_has_personal_api(self, obj):
        """آیا API شخصی دارد؟"""
        return bool(obj.personal_api_key)
    
    def get_api_key(self, obj):
        """✅ دریافت API key (decrypted) - فقط برای نمایش در admin panel
        
        بهینه شده: استفاده از select_related در queryset برای جلوگیری از N+1 query
        """
        # ✅ اگر use_shared_api=True است، از shared provider بگیر
        # obj.provider از select_related لود شده (N+1 ندارد)
        if obj.use_shared_api and obj.provider and obj.provider.shared_api_key:
            try:
                # ✅ get_shared_api_key() فقط decrypt می‌کند (query اضافی ندارد)
                return obj.provider.get_shared_api_key()
            except Exception:
                return None
        # ✅ در غیر این صورت از personal API key بگیر
        elif obj.personal_api_key:
            try:
                # ✅ get_personal_api_key() فقط decrypt می‌کند (query اضافی ندارد)
                return obj.get_personal_api_key()
            except Exception:
                return None
        return None
    
    def get_usage_info(self, obj):
        """اطلاعات مصرف - از Computed Field"""
        return obj.get_usage_info()
    
    def get_api_config(self, obj):
        """تنظیمات API - از Computed Field"""
        request = self.context.get('request')
        if request and request.user:
            return obj.get_api_config(request.user)
        return None
    
    def get_actions(self, obj):
        """اقدامات مجاز - از Computed Field"""
        request = self.context.get('request')
        if request and request.user:
            return obj.get_actions(request.user)
        return None


class AdminProviderSettingsUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer برای ویرایش تنظیمات شخصی
    """
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
        """بررسی منطق کلی"""
        # ✅ Map provider_name to provider_id
        if 'provider_name' in attrs and 'provider_id' not in attrs:
            try:
                # ✅ جستجو با name یا slug
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
        
        # ✅ Soft validation: فقط warning، نه خطا
        # validation واقعی در زمان استفاده از Model (در generation views) انجام می‌شود
        # اینجا فقط اجازه می‌دهیم تنظیمات ذخیره شود
        
        return attrs
    
    def validate_provider_id(self, value):
        """بررسی وجود Provider"""
        try:
            AIProvider.objects.get(pk=value, is_active=True)
        except AIProvider.DoesNotExist:
            raise serializers.ValidationError("Provider یافت نشد یا غیرفعال است")
        return value
