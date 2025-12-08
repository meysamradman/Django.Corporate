from django.db import models
from src.core.models import BaseModel
from src.portfolio.models.seo import SEOMixin
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.utils.cache import OptionCacheManager
from src.analytics.utils.cache import AnalyticsCacheManager
from .managers import PortfolioOptionQuerySet


class PortfolioOption(BaseModel, SEOMixin):
    """
    Portfolio option model following DJANGO_MODEL_STANDARDS.md conventions.
    """
    # 2. Primary Content Fields
    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Name",
        help_text="Option name"
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="URL Slug",
        help_text="URL-friendly identifier for the option"
    )
    
    # 3. Description Fields
    description = models.TextField(
        null=True,
        blank=True,
        verbose_name="Description",
        help_text="Option description"
    )
    
    # 4. Boolean Flags
    is_public = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Public",
        help_text="Designates whether this option is publicly visible"
    )
    
    objects = PortfolioOptionQuerySet.as_manager()
    
    def get_public_url(self):
        return f"/option/{self.public_id}/"

    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = 'portfolio_options'
        verbose_name = "Portfolio Option"
        verbose_name_plural = "Portfolio Options"
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_public', 'name']),
        ]

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.meta_title and self.name:
            self.meta_title = self.name[:70]
        
        if not self.meta_description and self.description:
            self.meta_description = self.description[:300]
            
        super().save(*args, **kwargs)
        
        if self.pk:
            OptionCacheManager.invalidate_option(self.pk)
        AnalyticsCacheManager.invalidate_dashboard()
    
    def delete(self, *args, **kwargs):
        option_id = self.pk
        super().delete(*args, **kwargs)
        if option_id:
            OptionCacheManager.invalidate_option(option_id)
        AnalyticsCacheManager.invalidate_dashboard()
    
    def generate_structured_data(self):
        return {
            "@context": "https://schema.org",
            "@type": "Thing",
            "name": self.get_meta_title(),
            "description": self.get_meta_description(),
            "url": self.get_public_url(),
        }