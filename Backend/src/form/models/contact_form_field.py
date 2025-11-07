from django.db import models
from django.core.validators import MinLengthValidator

from src.core.models.base import BaseModel


class ContactFormField(BaseModel):
    """
    مدل برای تعریف فیلدهای فرم تماس - Dynamic Form Builder
    امکان مدیریت فیلدها از پنل ادمین بدون نیاز به migration
    """
    
    FIELD_TYPE_CHOICES = [
        ('text', 'متن'),
        ('email', 'ایمیل'),
        ('phone', 'شماره تلفن'),
        ('textarea', 'متن چندخطی'),
        ('select', 'انتخابی'),
        ('checkbox', 'چک باکس'),
        ('radio', 'رادیو'),
        ('number', 'عدد'),
        ('date', 'تاریخ'),
        ('url', 'لینک'),
    ]
    
    field_key = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="کلید فیلد",
        help_text="کلید یکتا برای فیلد (مثال: name, email, phone)",
        validators=[MinLengthValidator(2, message="کلید فیلد باید حداقل 2 کاراکتر باشد")]
    )
    
    field_type = models.CharField(
        max_length=20,
        choices=FIELD_TYPE_CHOICES,
        default='text',
        db_index=True,
        verbose_name="نوع فیلد",
        help_text="نوع فیلد (متن، ایمیل، انتخابی و غیره)"
    )
    
    label = models.CharField(
        max_length=200,
        verbose_name="برچسب",
        help_text="برچسب فارسی فیلد که به کاربر نمایش داده می‌شود"
    )
    
    placeholder = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="متن راهنما",
        help_text="متن راهنمای داخل فیلد (اختیاری)"
    )
    
    required = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="الزامی",
        help_text="آیا این فیلد الزامی است؟"
    )
    
    platforms = models.JSONField(
        default=list,
        verbose_name="پلتفرم‌ها",
        help_text="لیست پلتفرم‌هایی که این فیلد در آن‌ها نمایش داده می‌شود: ['website', 'mobile_app']"
    )
    
    options = models.JSONField(
        default=list,
        blank=True,
        verbose_name="گزینه‌ها",
        help_text="گزینه‌های فیلد انتخابی: [{'value': 'option1', 'label': 'گزینه 1'}]"
    )
    
    validation_rules = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="قوانین اعتبارسنجی",
        help_text="قوانین اعتبارسنجی: {'min_length': 3, 'max_length': 100, 'pattern': '...'}"
    )
    
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="ترتیب نمایش",
        help_text="ترتیب نمایش فیلد در فرم (اعداد کمتر اول نمایش داده می‌شوند)"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'form_contact_fields'
        verbose_name = "فیلد فرم تماس"
        verbose_name_plural = "فیلدهای فرم تماس"
        ordering = ['order', 'field_key']
        indexes = [
            models.Index(fields=['is_active', 'order']),
            models.Index(fields=['field_type', 'is_active']),
            models.Index(fields=['platforms']),
        ]
    
    def __str__(self):
        return f"{self.label} ({self.field_key})"
    
    def clean(self):
        """اعتبارسنجی فیلد"""
        super().clean()
        
        # بررسی platforms
        if not isinstance(self.platforms, list):
            raise models.ValidationError("platforms باید یک لیست باشد")
        
        valid_platforms = ['website', 'mobile_app']
        for platform in self.platforms:
            if platform not in valid_platforms:
                raise models.ValidationError(f"پلتفرم نامعتبر: {platform}. باید یکی از {valid_platforms} باشد")
        
        # بررسی options برای فیلدهای انتخابی
        if self.field_type in ['select', 'radio']:
            if not self.options or not isinstance(self.options, list):
                raise models.ValidationError(f"فیلدهای {self.field_type} باید گزینه‌هایی داشته باشند")
            
            for option in self.options:
                if not isinstance(option, dict) or 'value' not in option or 'label' not in option:
                    raise models.ValidationError("هر گزینه باید دارای 'value' و 'label' باشد")
    
    def save(self, *args, **kwargs):
        """ذخیره با اعتبارسنجی"""
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def is_for_website(self):
        """بررسی نمایش در وب‌سایت"""
        return 'website' in (self.platforms or [])
    
    @property
    def is_for_mobile_app(self):
        """بررسی نمایش در اپلیکیشن"""
        return 'mobile_app' in (self.platforms or [])

