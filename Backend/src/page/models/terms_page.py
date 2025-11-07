from django.db import models
from django.core.validators import MinLengthValidator

from src.core.models.base import BaseModel
from src.media.models.media import ImageMedia
from src.page.models.seo import SEOMixin


class TermsPage(BaseModel, SEOMixin):
    """
    مدل برای صفحه "قوانین و مقررات" - Singleton Pattern
    فقط یک نمونه از این مدل در دیتابیس وجود دارد
    """
    
    title = models.CharField(
        max_length=200,
        default="قوانین و مقررات",
        verbose_name="عنوان صفحه",
        help_text="عنوان صفحه قوانین و مقررات",
        validators=[MinLengthValidator(3, message="عنوان باید حداقل 3 کاراکتر باشد")]
    )
    
    content = models.TextField(
        verbose_name="محتوای صفحه",
        help_text="متن اصلی صفحه قوانین و مقررات (پشتیبانی از HTML)",
        validators=[MinLengthValidator(10, message="محتوای صفحه باید حداقل 10 کاراکتر باشد")]
    )
    
    short_description = models.TextField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="توضیح کوتاه",
        help_text="خلاصه کوتاه از محتوای صفحه (برای نمایش در پیش‌نمایش)"
    )
    
    featured_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='terms_pages',
        verbose_name="تصویر شاخص",
        help_text="تصویر اصلی صفحه (اختیاری)"
    )
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'pages_terms'
        verbose_name = "صفحه قوانین و مقررات"
        verbose_name_plural = "صفحه قوانین و مقررات"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['meta_title']),  # SEO search
        ]
    
    def __str__(self):
        return "صفحه قوانین و مقررات"
    
    def save(self, *args, **kwargs):
        """ذخیره با Singleton Pattern"""
        if not self.pk:
            if TermsPage.objects.exists():
                existing = TermsPage.objects.first()
                self.pk = existing.pk
                self.public_id = existing.public_id
        
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Auto-generate SEO fields efficiently
        if not self.meta_title and self.title:
            self.meta_title = self.title[:70]
        if not self.meta_description and self.short_description:
            self.meta_description = self.short_description[:300]
        elif not self.meta_description and self.content:
            self.meta_description = self.content[:300]
    
    @classmethod
    def get_page(cls):
        """دریافت صفحه قوانین و مقررات (Singleton)"""
        page = cls.objects.first()
        if not page:
            page = cls.objects.create(
                title="قوانین و مقررات",
                content="محتوای صفحه قوانین و مقررات"
            )
        return page
    
    def generate_structured_data(self):
        """Generate structured data for Terms Page"""
        return {
            "@context": "https://schema.org",
            "@type": "TermsOfService",
            "name": self.get_meta_title(),
            "description": self.get_meta_description(),
            "url": self.get_canonical_url() if hasattr(self, 'get_canonical_url') else "",
        }

