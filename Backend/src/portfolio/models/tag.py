from django.db import models
from src.core.models import BaseModel
from src.portfolio.models.seo import SEOMixin
from .managers import PortfolioTagQuerySet

class PortfolioTag(BaseModel, SEOMixin):
    # Core fields
    name = models.CharField(max_length=20, unique=True, db_index=True)
    slug = models.SlugField(max_length=60, unique=True, db_index=True, allow_unicode=True)
    description = models.TextField(null=True, blank=True)
    is_public = models.BooleanField(default=True, db_index=True)
    
    # Custom manager
    objects = PortfolioTagQuerySet.as_manager()

    def get_public_url(self):
        return f"/tag/{self.public_id}/"

    class Meta:
        db_table = 'portfolio_tags'
        verbose_name = "Portfolio Tag"
        verbose_name_plural = "Portfolio Tags"
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
        """Generate structured data for Tag"""
        return {
            "@context": "https://schema.org",
            "@type": "Thing",
            "name": self.get_meta_title(),
            "description": self.get_meta_description(),
            "url": self.get_public_url(),
        }
