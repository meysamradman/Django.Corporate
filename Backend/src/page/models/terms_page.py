from django.db import models
from django.core.cache import cache
from django.core.validators import MinLengthValidator

from src.core.models.base import BaseModel
from src.media.models.media import ImageMedia
from src.page.models.seo import SEOMixin
from src.page.utils.cache import PageCacheKeys, PageCacheManager


class TermsPage(BaseModel, SEOMixin):
    """
    Terms page model following DJANGO_MODEL_STANDARDS.md conventions.
    Field ordering: Content → Description → Relationships
    """
    # 2. Primary Content Fields
    title = models.CharField(
        max_length=200,
        default="Terms and Conditions",
        db_index=True,
        verbose_name="Page Title",
        help_text="Terms and conditions page title",
        validators=[MinLengthValidator(3, message="Title must be at least 3 characters.")]
    )
    
    # 3. Description Fields
    short_description = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="Short Description",
        help_text="Short summary of page content (for preview display)"
    )
    content = models.TextField(
        blank=True,
        null=True,
        verbose_name="Page Content",
        help_text="Main content of terms page (HTML supported)"
    )
    
    # 5. Relationships
    featured_image = models.ForeignKey(
        ImageMedia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='terms_pages',
        db_index=True,
        verbose_name="Featured Image",
        help_text="Main page image (optional)"
    )
    
    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'pages_terms'
        verbose_name = "Terms Page"
        verbose_name_plural = "Terms Pages"
        ordering = ['-created_at']
        indexes = []
    
    def __str__(self):
        return "Terms Page"
    
    def save(self, *args, **kwargs):
        if not self.pk:
            if TermsPage.objects.exists():
                existing = TermsPage.objects.first()
                self.pk = existing.pk
                self.public_id = existing.public_id
        
        # Set meta fields before validation
        if not self.meta_title and self.title:
            self.meta_title = self.title[:70]
        if not self.meta_description and self.short_description:
            self.meta_description = self.short_description[:300]
        elif not self.meta_description and self.content:
            self.meta_description = self.content[:300]
        
        self.full_clean()
        super().save(*args, **kwargs)
        PageCacheManager.invalidate_terms_page()
    
    @classmethod
    def get_page(cls):
        cache_key = PageCacheKeys.terms_page()
        page = cache.get(cache_key)
        if page is None:
            page = cls.objects.select_related('featured_image').first()
            if not page:
                page = cls.objects.create(
                    title="Terms and Conditions",
                    content="Terms page content"
                )
            cache.set(cache_key, page, 3600)  # 1 hour cache
        return page
    
    def generate_structured_data(self):
        return {
            "@context": "https://schema.org",
            "@type": "TermsOfService",
            "name": self.get_meta_title(),
            "description": self.get_meta_description(),
            "url": self.get_canonical_url() if hasattr(self, 'get_canonical_url') else "",
        }

