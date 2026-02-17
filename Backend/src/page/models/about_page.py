from django.db import models
from django.core.validators import MinLengthValidator

from src.core.models.base import BaseModel
from src.media.models.media import ImageMedia
from src.page.models.seo import SEOMixin
from src.page.utils.cache import PageCacheManager

class AboutPage(BaseModel, SEOMixin):

    title = models.CharField(
        max_length=100,
        default="About Us",
        db_index=True,
        verbose_name="Page Title",
        help_text="About page title",
        validators=[MinLengthValidator(3, message="Title must be at least 3 characters.")]
    )
    slug = models.SlugField(
        max_length=120,
        unique=True,
        default="about-us",
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly version of the title (e.g., 'about-us' or 'درباره-ما')"
    )
    
    short_description = models.CharField(
        max_length=300,
        blank=True,
        null=True,
        verbose_name="Short Description",
        help_text="Short summary of page content (for preview display)"
    )
    content = models.TextField(
        blank=True,
        null=True,
        verbose_name="Page Content",
        help_text="Main content of about page (HTML supported)"
    )
    
    featured_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='about_pages',
        db_index=True,
        verbose_name="Featured Image",
        help_text="Main page image (optional)"
    )
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'pages_about'
        verbose_name = "About Page"
        verbose_name_plural = "About Pages"
        ordering = ['-created_at']
        indexes = []
    
    def __str__(self):
        return "About Page"
    
    def save(self, *args, **kwargs):
        if not self.pk:
            if AboutPage.objects.exists():
                existing = AboutPage.objects.first()
                self.pk = existing.pk
                self.public_id = existing.public_id
        
        if not self.meta_title and self.title:
            self.meta_title = self.title[:70]
        if not self.meta_description and self.short_description:
            self.meta_description = self.short_description[:300]
        elif not self.meta_description and self.content:
            self.meta_description = self.content[:300]
        
        self.full_clean()
        super().save(*args, **kwargs)
        PageCacheManager.invalidate_about_page()
    
    @classmethod
    def get_page(cls):
        page = cls.objects.select_related('featured_image').first()
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

