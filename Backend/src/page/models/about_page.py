from django.db import models
from django.core.validators import MinLengthValidator

from src.core.models.base import BaseModel
from src.media.models.media import ImageMedia
from src.page.models.seo import SEOMixin


class AboutPage(BaseModel, SEOMixin):
    
    title = models.CharField(
        max_length=200,
        default="About Us",
        verbose_name="Page Title",
        help_text="About page title",
        validators=[MinLengthValidator(3, message="Title must be at least 3 characters")]
    )
    
    content = models.TextField(
        blank=True,
        null=True,
        verbose_name="Page Content",
        help_text="Main content of about page (HTML supported)"
    )
    
    short_description = models.TextField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="Short Description",
        help_text="Short summary of page content (for preview display)"
    )
    
    featured_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='about_pages',
        verbose_name="Featured Image",
        help_text="Main page image (optional)"
    )
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'pages_about'
        verbose_name = "About Page"
        verbose_name_plural = "About Pages"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['meta_title']),  # SEO search
        ]
    
    def __str__(self):
        return "About Page"
    
    def save(self, *args, **kwargs):
        if not self.pk:
            if AboutPage.objects.exists():
                existing = AboutPage.objects.first()
                self.pk = existing.pk
                self.public_id = existing.public_id
        
        self.full_clean()
        super().save(*args, **kwargs)
        
        if not self.meta_title and self.title:
            self.meta_title = self.title[:70]
        if not self.meta_description and self.short_description:
            self.meta_description = self.short_description[:300]
        elif not self.meta_description and self.content:
            self.meta_description = self.content[:300]
    
    @classmethod
    def get_page(cls):
        page = cls.objects.first()
        if not page:
            page = cls.objects.create(
                title="About Us",
                content="About page content"
            )
        return page
    
    def generate_structured_data(self):
        return {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "name": self.get_meta_title(),
            "description": self.get_meta_description(),
            "url": self.get_canonical_url() if hasattr(self, 'get_canonical_url') else "",
        }

