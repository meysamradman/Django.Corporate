from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from treebeard.admin import TreeAdmin
from treebeard.forms import movenodeform_factory
from src.portfolio.models.media import PortfolioMedia
from src.portfolio.models.option import PortfolioOption
from src.portfolio.models.tag import PortfolioTag
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.category import PortfolioCategory


# 1. اینلاین برای PortfolioOption
class PortfolioOptionInline(admin.TabularInline):
    model = PortfolioOption
    extra = 1
    verbose_name = _("Portfolio Option")
    verbose_name_plural = _("Portfolio Options")


# 2. اینلاین برای PortfolioTag
class PortfolioTagInline(admin.TabularInline):
    model = Portfolio.tags.through  # Many-to-Many ارتباط بین Portfolio و PortfolioTag
    extra = 1
    verbose_name = _("Portfolio Tag")
    verbose_name_plural = _("Portfolio Tags")


class PortfolioMediaInline(admin.TabularInline):
    model = PortfolioMedia
    extra = 1
    verbose_name = _("Portfolio Media")
    verbose_name_plural = _("Portfolio Media")
    fields = ('media', 'is_main_image', 'order', 'preview_media')  # حذف video_cover
    readonly_fields = ('preview_media',)

    def preview_media(self, obj):
        """نمایش پیش‌نمایش مدیا در ادمین"""
        if obj.media:
            if obj.media.media_type == "image":
                return format_html(
                    '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 5px;" />',
                    obj.media.file.url
                )
            elif obj.media.media_type == "video":
                # اگر ویدئو کاور نداشته باشد، از تصویر اصلی استفاده می‌کند
                cover_url = obj.media.video_cover.url if obj.media.video_cover else obj.media.file.url
                return format_html(
                    '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 5px;" />',
                    cover_url
                )
        return "-"

    preview_media.short_description = _("Preview")


class PortfolioAdmin(admin.ModelAdmin):
    list_display = ('id', 'public_id', 'title', 'status', 'is_featured', 'get_categories', 'get_portfolio_tags', 'created_at')
    list_filter = ('status', 'is_featured', 'is_active', 'is_public', 'categories', 'tags')
    search_fields = ('title', 'slug', 'short_description', 'description', 'public_id')
    filter_horizontal = ('categories', 'tags')  # Use horizontal filter for categories and tags
    inlines = [PortfolioMediaInline, PortfolioOptionInline]  # Add PortfolioOptionInline
    readonly_fields = ('id', 'public_id', 'created_at', 'updated_at')
    
    fieldsets = (
        (_('IDs'), {
            'fields': ('id', 'public_id')
        }),
        (_('Basic Information'), {
            'fields': ('title', 'slug', 'status', 'short_description', 'description')
        }),
        (_('Categories & Tags'), {
            'fields': ('categories', 'tags'),
            'description': _('Select categories and tags for this portfolio item')
        }),
        (_('Settings'), {
            'fields': ('is_featured', 'is_public', 'is_active')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at')
        }),
    )

    def get_portfolio_tags(self, obj):
        return ", ".join([tag.name for tag in obj.tags.all()[:5]])  # Limit to first 5 tags

    get_portfolio_tags.short_description = _('Tags')

    def get_categories(self, obj):
        return ", ".join([cat.name for cat in obj.categories.all()])

    get_categories.short_description = _('Categories')

    def save_model(self, request, obj, form, change):
        if not change:  # If this is a new object, set created_by
            obj.created_by = request.user
        obj.updated_by = request.user  # Always update the updated_by field
        super().save_model(request, obj, form, change)


# 4. مدیریت مدل PortfolioOption
class PortfolioOptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'public_id', 'name', 'portfolio', 'slug')
    search_fields = ('name', 'slug', 'description', 'public_id')
    list_filter = ('portfolio',)
    readonly_fields = ('id', 'public_id', 'created_at', 'updated_at')
    
    fieldsets = (
        (_('IDs'), {
            'fields': ('id', 'public_id')
        }),
        (_('Basic Information'), {
            'fields': ('name', 'slug', 'portfolio', 'description')
        }),
        (_('Settings'), {
            'fields': ('is_public', 'is_active')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at')
        }),
    )

    def save_model(self, request, obj, form, change):
        if not obj.slug:
            obj.slug = obj.name.lower().replace(' ', '-')
        super().save_model(request, obj, form, change)


# 5. مدیریت مدل PortfolioTag
class PortfolioTagAdmin(admin.ModelAdmin):
    list_display = ('id', 'public_id', 'name', 'slug')
    search_fields = ('name', 'slug', 'description', 'public_id')
    list_filter = ('name',)
    readonly_fields = ('id', 'public_id', 'created_at', 'updated_at')
    
    fieldsets = (
        (_('IDs'), {
            'fields': ('id', 'public_id')
        }),
        (_('Basic Information'), {
            'fields': ('name', 'slug', 'description')
        }),
        (_('Settings'), {
            'fields': ('is_public', 'is_active')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at')
        }),
    )

    def save_model(self, request, obj, form, change):
        if not obj.slug:
            obj.slug = obj.name.lower().replace(' ', '-')
        super().save_model(request, obj, form, change)


# 6. مدیریت مدل PortfolioCategory با treebeard
class PortfolioCategoryAdmin(TreeAdmin):
    form = movenodeform_factory(PortfolioCategory)
    list_display = ('id', 'public_id', 'name', 'slug', 'is_public', 'get_parent_name', 'hierarchy_display')
    search_fields = ('name', 'slug', 'public_id')
    readonly_fields = ('id', 'public_id', 'created_at', 'updated_at')
    
    def get_parent_name(self, obj):
        """برگشت نام والد یا نمایش '-' اگر والد وجود نداشته باشد"""
        parent = obj.get_parent() if hasattr(obj, 'get_parent') else None
        return parent.name if parent else '-'  # بررسی می‌کند که آیا والد وجود دارد یا نه

    def hierarchy_display(self, obj):
        """نمایش سلسله‌مراتب دسته‌بندی‌ها"""
        return obj.__str__() if hasattr(obj, "__str__") else _("No hierarchy")

    def image_display(self, obj):
        """نمایش پیش‌نمایش تصویر اصلی دسته‌بندی"""
        if obj.image:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 5px;" />',
                obj.image.url
            )
        return _("No image")

    image_display.short_description = _("Image Preview")

# ثبت مدل‌ها در پنل مدیریت
admin.site.register(Portfolio, PortfolioAdmin)
admin.site.register(PortfolioOption, PortfolioOptionAdmin)
admin.site.register(PortfolioTag, PortfolioTagAdmin)
admin.site.register(PortfolioCategory, PortfolioCategoryAdmin)
