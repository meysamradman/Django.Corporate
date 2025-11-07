from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from src.email.models.email_message import EmailMessage
from src.email.models.email_attachment import EmailAttachment


class EmailAttachmentInline(admin.TabularInline):
    """نمایش ضمیمه‌ها به صورت inline"""
    model = EmailAttachment
    extra = 0
    readonly_fields = ['filename', 'file_size_formatted', 'content_type', 'created_at']
    can_delete = False
    fields = ['filename', 'file_size_formatted', 'content_type', 'file', 'created_at']
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(EmailMessage)
class EmailMessageAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'name_with_badge',
        'email',
        'subject_short',
        'status_badge',
        'source_badge',
        'created_at_formatted',
        'quick_actions',
    ]
    
    list_filter = [
        'status',
        'source',
        'created_at',
        'replied_at',
    ]
    
    search_fields = [
        'name',
        'email',
        'subject',
        'message',
        'phone',
    ]
    
    readonly_fields = [
        'name',
        'email',
        'phone',
        'subject',
        'message',
        'ip_address',
        'user_agent',
        'source',
        'created_at',
        'read_at',
        'replied_at',
        'replied_by',
        'attachments_list',
    ]
    
    fieldsets = [
        ('اطلاعات فرستنده', {
            'fields': ['name', 'email', 'phone']
        }),
        ('محتوای پیام', {
            'fields': ['subject', 'message']
        }),
        ('پاسخ ادمین', {
            'fields': ['status', 'reply_message'],
            'classes': ['wide'],
        }),
        ('ضمیمه‌ها', {
            'fields': ['attachments_list'],
            'classes': ['collapse'],
        }),
        ('اطلاعات تکمیلی', {
            'fields': [
                'source',
                'ip_address',
                'user_agent',
                'created_at',
                'read_at',
                'replied_at',
                'replied_by',
            ],
            'classes': ['collapse'],
        }),
    ]
    
    inlines = [EmailAttachmentInline]
    
    actions = [
        'mark_as_read',
        'mark_as_replied',
        'archive_messages',
        'send_reply_email',
    ]
    
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    list_per_page = 25
    
    # ------------------
    # Custom Display
    # ------------------
    
    def name_with_badge(self, obj):
        """نمایش نام با بج جدید"""
        if obj.status == 'new':
            return format_html(
                '<strong>{}</strong> <span style="background:#28a745;color:white;padding:2px 8px;border-radius:3px;font-size:10px;">جدید</span>',
                obj.name
            )
        return obj.name
    name_with_badge.short_description = 'نام'
    
    def subject_short(self, obj):
        """نمایش موضوع کوتاه شده"""
        if len(obj.subject) > 50:
            return f"{obj.subject[:50]}..."
        return obj.subject
    subject_short.short_description = 'موضوع'
    
    def status_badge(self, obj):
        """نمایش وضعیت با رنگ"""
        colors = {
            'new': '#28a745',
            'read': '#ffc107',
            'replied': '#17a2b8',
            'archived': '#6c757d',
        }
        labels = {
            'new': 'جدید',
            'read': 'خوانده شده',
            'replied': 'پاسخ داده شده',
            'archived': 'آرشیو شده',
        }
        return format_html(
            '<span style="background:{};color:white;padding:4px 12px;border-radius:4px;font-size:11px;">{}</span>',
            colors.get(obj.status, '#6c757d'),
            labels.get(obj.status, obj.status)
        )
    status_badge.short_description = 'وضعیت'
    
    def source_badge(self, obj):
        """نمایش منبع با آیکون"""
        icons = {
            'website': '🌐',
            'mobile_app': '📱',
            'email': '📧',
            'api': '🔌',
        }
        return format_html(
            '{} {}',
            icons.get(obj.source, '❓'),
            obj.get_source_display()
        )
    source_badge.short_description = 'منبع'
    
    def created_at_formatted(self, obj):
        """نمایش تاریخ فرمت شده"""
        from django.utils.timesince import timesince
        return f"{timesince(obj.created_at)} پیش"
    created_at_formatted.short_description = 'زمان'
    
    def quick_actions(self, obj):
        """دکمه‌های سریع"""
        buttons = []
        
        if obj.status == 'new':
            buttons.append(
                f'<a class="button" href="/admin/email/emailmessage/{obj.id}/change/">📖 خواندن</a>'
            )
        
        if obj.status in ['new', 'read']:
            buttons.append(
                f'<a class="button" href="/admin/email/emailmessage/{obj.id}/change/">✉️ پاسخ</a>'
            )
        
        return format_html(' '.join(buttons))
    quick_actions.short_description = 'عملیات'
    
    def attachments_list(self, obj):
        """نمایش لیست ضمیمه‌ها"""
        attachments = obj.attachments.all()
        if not attachments:
            return "بدون ضمیمه"
        
        html = "<ul>"
        for att in attachments:
            html += f"<li><a href='{att.file.url}' target='_blank'>{att.filename}</a> ({att.file_size_formatted})</li>"
        html += "</ul>"
        return format_html(html)
    attachments_list.short_description = 'ضمیمه‌ها'
    
    # ------------------
    # Custom Actions
    # ------------------
    
    def mark_as_read(self, request, queryset):
        """علامت‌گذاری به عنوان خوانده شده"""
        count = 0
        for obj in queryset.filter(status='new'):
            obj.mark_as_read()
            count += 1
        self.message_user(request, f"{count} پیام به عنوان خوانده شده علامت‌گذاری شد.")
    mark_as_read.short_description = "📖 علامت‌گذاری به عنوان خوانده شده"
    
    def mark_as_replied(self, request, queryset):
        """علامت‌گذاری به عنوان پاسخ داده شده"""
        count = queryset.filter(status__in=['new', 'read']).update(
            status='replied',
            replied_at=timezone.now(),
            replied_by=request.user
        )
        self.message_user(request, f"{count} پیام به عنوان پاسخ داده شده علامت‌گذاری شد.")
    mark_as_replied.short_description = "✅ علامت‌گذاری به عنوان پاسخ داده شده"
    
    def archive_messages(self, request, queryset):
        """آرشیو کردن پیام‌ها"""
        count = queryset.update(status='archived')
        self.message_user(request, f"{count} پیام آرشیو شد.")
    archive_messages.short_description = "📦 آرشیو کردن"
    
    def send_reply_email(self, request, queryset):
        """ارسال پاسخ به ایمیل (برای پیام‌هایی که reply_message دارند)"""
        count = 0
        for obj in queryset:
            if obj.reply_message:
                try:
                    send_mail(
                        subject=f"Re: {obj.subject}",
                        message=obj.reply_message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[obj.email],
                        fail_silently=False,
                    )
                    obj.mark_as_replied(request.user)
                    count += 1
                except Exception as e:
                    self.message_user(request, f"خطا در ارسال به {obj.email}: {str(e)}", level='error')
        
        if count > 0:
            self.message_user(request, f"{count} پاسخ ارسال شد.", level='success')
    send_reply_email.short_description = "📤 ارسال پاسخ به ایمیل"
    
    # ------------------
    # Custom Save
    # ------------------
    
    def save_model(self, request, obj, form, change):
        """هنگام ذخیره، اگر پاسخ نوشته شده، ایمیل ارسال شود"""
        super().save_model(request, obj, form, change)
        
        # اگر reply_message وارد شده و قبلاً ارسال نشده
        if obj.reply_message and obj.status != 'replied':
            try:
                send_mail(
                    subject=f"Re: {obj.subject}",
                    message=obj.reply_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[obj.email],
                    fail_silently=False,
                )
                obj.mark_as_replied(request.user)
                self.message_user(request, f"پاسخ با موفقیت به {obj.email} ارسال شد.", level='success')
            except Exception as e:
                self.message_user(request, f"خطا در ارسال ایمیل: {str(e)}", level='error')


@admin.register(EmailAttachment)
class EmailAttachmentAdmin(admin.ModelAdmin):
    list_display = ['filename', 'message', 'file_size_formatted', 'content_type', 'created_at']
    list_filter = ['content_type', 'created_at']
    search_fields = ['filename', 'message__subject']
    readonly_fields = ['filename', 'file_size', 'file_size_formatted', 'content_type', 'created_at']
    
    def file_size_formatted(self, obj):
        """نمایش حجم فایل با فرمت خوانا"""
        return obj.file_size_formatted
    file_size_formatted.short_description = 'حجم فایل'

