from django.contrib import admin
from src.ai.models.image_generation import AIImageGeneration


@admin.register(AIImageGeneration)
class AIImageGenerationAdmin(admin.ModelAdmin):
    list_display = [
        'provider_name',
        'get_provider_display',
        'is_active',
        'has_api_key_display',
        'usage_count',
        'last_used_at',
        'created_at',
    ]
    
    list_filter = ['is_active', 'provider_name', 'created_at']
    search_fields = ['provider_name']
    readonly_fields = ['usage_count', 'last_used_at', 'created_at', 'updated_at']
    
    fieldsets = (
        ('اطلاعات پایه', {
            'fields': ('provider_name', 'is_active')
        }),
        ('API Key', {
            'fields': ('api_key',),
            'description': 'API key مدل را وارد کنید. این کلید برای هر دو کار تولید تصویر و تولید محتوا استفاده می‌شود. پس از وارد کردن، مدل به صورت خودکار فعال می‌شود.'
        }),
        ('تنظیمات', {
            'fields': ('config',),
            'description': 'تنظیمات اضافی مدل (JSON format)'
        }),
        ('آمار استفاده', {
            'fields': ('usage_count', 'last_used_at'),
        }),
        ('اطلاعات سیستم', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_provider_display(self, obj):
        return obj.get_provider_name_display()
    get_provider_display.short_description = 'مدل'
    
    def has_api_key_display(self, obj):
        return '✓' if obj.api_key else '✗'
    has_api_key_display.short_description = 'API Key'
    has_api_key_display.boolean = True

