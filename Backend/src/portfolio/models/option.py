from django.db import models
from src.core.models import BaseModel
from src.portfolio.models.seo import SEOMixin
from src.portfolio.models.portfolio import Portfolio
from .managers import PortfolioOptionQuerySet


class PortfolioOption(BaseModel, SEOMixin):
    portfolio = models.ForeignKey(
        Portfolio, 
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="portfolio_options"
    )
    # Core fields
    name = models.CharField(max_length=100, unique=True, db_index=True)
    slug = models.SlugField(max_length=60, unique=True, db_index=True, allow_unicode=True)
    description = models.TextField(null=True, blank=True)
    is_public = models.BooleanField(default=True, db_index=True)
    
    # Custom manager
    objects = PortfolioOptionQuerySet.as_manager()
    
    def get_public_url(self):
        return f"/option/{self.public_id}/"

    class Meta:
        db_table = 'portfolio_options'
        verbose_name = "Portfolio Option"
        verbose_name_plural = "Portfolio Options"
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["slug"]),
            models.Index(fields=["public_id"]),
            models.Index(fields=["is_public"]),
            models.Index(fields=["meta_title"]),
        ]

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Auto SEO generation
        if not self.meta_title and self.name:
            self.meta_title = self.name[:70]
        
        if not self.meta_description and self.description:
            self.meta_description = self.description[:300]
            
        super().save(*args, **kwargs)
    
    def generate_structured_data(self):
        """Generate structured data for Option"""
        return {
            "@context": "https://schema.org",
            "@type": "Thing",
            "name": self.get_meta_title(),
            "description": self.get_meta_description(),
            "url": self.get_public_url(),
        }