from django.db import models
from django.core.exceptions import ValidationError


class SEOMixin(models.Model):
    """
    Optimized SEO Mixin for large scale applications
    """
    
    # Core SEO fields - اغلب استفاده می‌شوند
    meta_title = models.CharField(
        max_length=70,
        null=True, blank=True,
        db_index=True,  # برای جستجو
        verbose_name="Meta Title",
        help_text="SEO title for search engines (max 70 characters)"
    )
    meta_description = models.CharField(
        max_length=300,
        null=True, blank=True,
        verbose_name="Meta Description", 
        help_text="SEO description for search engines (max 300 characters)"
    )
    
    # Essential OG tags only - کم استفاده
    og_title = models.CharField(
        max_length=70,
        null=True, blank=True,
        verbose_name="Open Graph Title",
        help_text="Title for social media sharing"
    )
    og_description = models.CharField(
        max_length=300,
        null=True, blank=True,
        verbose_name="Open Graph Description",
        help_text="Description for social media sharing"
    )
    og_image = models.ForeignKey(
        'media.Media',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        limit_choices_to={'media_type': 'image'},
        related_name='%(app_label)s_%(class)s_og_images',
        verbose_name="Open Graph Image"
    )
    
    # Advanced fields - کمتر استفاده می‌شوند
    canonical_url = models.URLField(null=True, blank=True)
    robots_meta = models.CharField(max_length=50, null=True, blank=True, default="index,follow")
    
    # JSON fields for complex data - فقط در صورت نیاز
    structured_data = models.JSONField(null=True, blank=True, default=dict)
    hreflang_data = models.JSONField(null=True, blank=True, default=dict)
    
    class Meta:
        abstract = True
        
    def get_meta_title(self):
        """Optimized meta title getter"""
        if hasattr(self, '_cached_meta_title'):
            return self._cached_meta_title
            
        if self.meta_title:
            self._cached_meta_title = self.meta_title
        else:
            # Fallback logic
            for field in ['title', 'name']:
                if hasattr(self, field):
                    value = getattr(self, field, '')
                    if value:
                        self._cached_meta_title = value[:70]
                        break
            else:
                self._cached_meta_title = ""
        
        return self._cached_meta_title
    
    def get_meta_description(self):
        """Optimized meta description getter"""
        if hasattr(self, '_cached_meta_description'):
            return self._cached_meta_description
            
        if self.meta_description:
            self._cached_meta_description = self.meta_description
        else:
            # Fallback logic
            for field in ['short_description', 'description']:
                if hasattr(self, field):
                    value = getattr(self, field, '')
                    if value:
                        self._cached_meta_description = value[:300]
                        break
            else:
                self._cached_meta_description = ""
                
        return self._cached_meta_description
    
    def get_og_title(self):
        """Get Open Graph title with fallback"""
        return self.og_title or self.get_meta_title()
    
    def get_og_description(self):
        """Get Open Graph description with fallback"""
        return self.og_description or self.get_meta_description()
    
    def get_canonical_url(self):
        """Get canonical URL with fallback"""
        if self.canonical_url:
            return self.canonical_url
        # Fallback to model's public URL
        if hasattr(self, 'get_public_url'):
            return self.get_public_url()
        return ""
    
    def generate_structured_data(self):
        """Generate basic structured data - override in child models"""
        return {
            "@context": "https://schema.org",
            "@type": "Thing",
            "name": self.get_meta_title(),
            "description": self.get_meta_description()
        }
