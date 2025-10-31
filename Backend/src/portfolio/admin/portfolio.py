from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from treebeard.admin import TreeAdmin
from treebeard.forms import movenodeform_factory
from src.portfolio.models.media import PortfolioImage, PortfolioVideo, PortfolioAudio, PortfolioDocument
from src.portfolio.models.option import PortfolioOption
from src.portfolio.models.tag import PortfolioTag
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.category import PortfolioCategory


# 1. اینلاین برای PortfolioOption
class PortfolioOptionInline(admin.TabularInline):
    model = Portfolio.options.through  # Many-to-Many ارتباط بین Portfolio و PortfolioOption
    extra = 1
    verbose_name = _("Portfolio Option")
    verbose_name_plural = _("Portfolio Options")


# 2. اینلاین برای PortfolioTag
class PortfolioTagInline(admin.TabularInline):
    model = Portfolio.tags.through  # Many-to-Many ارتباط بین Portfolio و PortfolioTag
    extra = 1
    verbose_name = _("Portfolio Tag")
    verbose_name_plural = _("Portfolio Tags")


class PortfolioImageInline(admin.TabularInline):
    model = PortfolioImage
    extra = 1
    verbose_name = _("Portfolio Image")
    verbose_name_plural = _("Portfolio Images")
    fields = ('image', 'is_main', 'order', 'preview_image')
    readonly_fields = ('preview_image',)

    def preview_image(self, obj):
        """نمایش پیش‌نمایش تصویر در ادمین"""
        if obj.image:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 5px;" />',
                obj.image.file.url
            )
        return "-"

    preview_image.short_description = _("Preview")


class PortfolioVideoInline(admin.TabularInline):
    model = PortfolioVideo
    extra = 1
    verbose_name = _("Portfolio Video")
    verbose_name_plural = _("Portfolio Videos")
    fields = ('video', 'order', 'autoplay', 'mute', 'show_cover', 'preview_video')
    readonly_fields = ('preview_video',)

    def preview_video(self, obj):
        """نمایش پیش‌نمایش ویدیو در ادمین"""
        if obj.video:
            cover_url = obj.video.video_cover.url if obj.video.video_cover else obj.video.file.url
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 5px;" />',
                cover_url
            )
        return "-"

    preview_video.short_description = _("Preview")


class PortfolioAudioInline(admin.TabularInline):
    model = PortfolioAudio
    extra = 1
    verbose_name = _("Portfolio Audio")
    verbose_name_plural = _("Portfolio Audios")
    fields = ('audio', 'order', 'autoplay', 'loop', 'preview_audio')
    readonly_fields = ('preview_audio',)

    def preview_audio(self, obj):
        """نمایش پیش‌نمایش صوت در ادمین"""
        if obj.audio:
            return format_html(
                '<audio controls><source src="{}" type="audio/mpeg"></audio>',
                obj.audio.file.url
            )
        return "-"

    preview_audio.short_description = _("Preview")


class PortfolioDocumentInline(admin.TabularInline):
    model = PortfolioDocument
    extra = 1
    verbose_name = _("Portfolio Document")
    verbose_name_plural = _("Portfolio Documents")
    fields = ('document', 'order', 'title', 'preview_document')
    readonly_fields = ('preview_document',)

    def preview_document(self, obj):
        """نمایش پیش‌نمایش سند در ادمین"""
        if obj.document:
            return format_html(
                '<a href="{}" target="_blank">View Document</a>',
                obj.document.file.url
            )
        return "-"

    preview_document.short_description = _("Preview")


class PortfolioAdmin(admin.ModelAdmin):
    list_display = ('id', 'public_id', 'title', 'status', 'is_featured', 'get_categories', 'get_portfolio_tags', 'created_at')
    list_filter = ('status', 'is_featured', 'is_active', 'is_public', 'categories', 'tags')
    search_fields = ('title', 'slug', 'short_description', 'description', 'public_id')
    filter_horizontal = ('categories', 'tags')  # Use horizontal filter for categories and tags
    inlines = [PortfolioImageInline, PortfolioVideoInline, PortfolioAudioInline, PortfolioDocumentInline, PortfolioOptionInline]  # Add PortfolioOptionInline
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