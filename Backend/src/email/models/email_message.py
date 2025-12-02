from django.db import models
from django.utils import timezone
from django.core.validators import EmailValidator
from src.core.models.base import BaseModel


class EmailMessage(BaseModel):
    
    STATUS_CHOICES = [
        ('new', 'جدید'),
        ('read', 'خوانده شده'),
        ('replied', 'پاسخ داده شده'),
        ('archived', 'آرشیو شده'),
        ('draft', 'پیش‌نویس'),
    ]
    
    SOURCE_CHOICES = [
        ('website', 'وب‌سایت'),
        ('mobile_app', 'اپلیکیشن موبایل'),
        ('email', 'ایمیل مستقیم'),
        ('api', 'API'),
    ]
    
    name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="نام",
        db_index=True,
        help_text="نام فرستنده پیام"
    )
    email = models.EmailField(
        blank=True,
        null=True,
        verbose_name="ایمیل",
        db_index=True,
        validators=[EmailValidator()],
        help_text="آدرس ایمیل فرستنده"
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="تلفن",
        help_text="شماره تلفن فرستنده (اختیاری)"
    )
    
    subject = models.CharField(
        max_length=300,
        blank=True,
        null=True,
        verbose_name="موضوع",
        db_index=True,
        help_text="موضوع پیام"
    )
    message = models.TextField(
        blank=True,
        null=True,
        verbose_name="پیام",
        help_text="متن پیام"
    )
    
    dynamic_fields = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="فیلدهای دینامیک",
        help_text="فیلدهای ساخته شده در فرم‌ساز پنل ادمین"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
        db_index=True,
        verbose_name="وضعیت",
        help_text="وضعیت فعلی پیام"
    )
    
    source = models.CharField(
        max_length=50,
        choices=SOURCE_CHOICES,
        default='website',
        db_index=True,
        verbose_name="منبع",
        help_text="منبع ارسال پیام"
    )
    
    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
        verbose_name="آدرس IP",
        help_text="آدرس IP فرستنده"
    )
    user_agent = models.TextField(
        blank=True,
        null=True,
        verbose_name="User Agent",
        help_text="اطلاعات مرورگر یا اپلیکیشن فرستنده"
    )
    
    reply_message = models.TextField(
        blank=True,
        null=True,
        verbose_name="پاسخ ادمین",
        help_text="پاسخ ادمین به این پیام"
    )
    replied_at = models.DateTimeField(
        blank=True,
        null=True,
        db_index=True,
        verbose_name="تاریخ پاسخ",
        help_text="زمانی که پاسخ ارسال شد"
    )
    replied_by = models.ForeignKey(
        'user.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='replied_email_messages',
        verbose_name="پاسخ داده شده توسط",
        help_text="ادمینی که پاسخ را ارسال کرده"
    )
    
    created_by = models.ForeignKey(
        'user.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='created_email_messages',
        verbose_name="ایجاد شده توسط",
        help_text="ادمینی که این ایمیل/پیش‌نویس را ایجاد کرده"
    )
    
    read_at = models.DateTimeField(
        blank=True,
        null=True,
        db_index=True,
        verbose_name="تاریخ خواندن",
        help_text="زمانی که پیام خوانده شد"
    )
    
    class Meta:
        db_table = 'email_messages'
        ordering = ['-created_at']
        verbose_name = "پیام ایمیل"
        verbose_name_plural = "پیام‌های ایمیل"
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['source', 'created_at']),
            models.Index(fields=['status', 'source']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.subject[:50]}"
    
    def mark_as_read(self):
        if self.status == 'new':
            self.status = 'read'
            self.read_at = timezone.now()
            self.save(update_fields=['status', 'read_at'])
    
    def mark_as_replied(self, admin_user):
        self.status = 'replied'
        self.replied_at = timezone.now()
        self.replied_by = admin_user
        self.save(update_fields=['status', 'replied_at', 'replied_by'])
    
    @property
    def has_attachments(self):
        return self.attachments.exists()
    
    @property
    def is_new(self):
        return self.status == 'new'
    
    @property
    def is_replied(self):
        return self.status == 'replied' and self.reply_message
    
    @property
    def is_draft(self):
        return self.status == 'draft'
    
    def save_as_draft(self, admin_user):
        self.status = 'draft'
        if not self.created_by:
            self.created_by = admin_user
        self.save(update_fields=['status', 'created_by'])
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        from src.statistics.utils.cache import StatisticsCacheManager
        StatisticsCacheManager.invalidate_emails()
        StatisticsCacheManager.invalidate_dashboard()
    
    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        from src.statistics.utils.cache import StatisticsCacheManager
        StatisticsCacheManager.invalidate_emails()
        StatisticsCacheManager.invalidate_dashboard()

