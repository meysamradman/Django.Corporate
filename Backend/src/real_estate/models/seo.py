from django.db import models


class SEOMixin(models.Model):
    meta_title = models.CharField(
        max_length=70,
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Meta Title",
        help_text="SEO title for search engines (max 70 characters)"
    )
    meta_description = models.CharField(
        max_length=300,
        null=True,
        blank=True,
        verbose_name="Meta Description",
        help_text="SEO description for search engines (max 300 characters)"
    )
    og_title = models.CharField(
        max_length=70,
        null=True,
        blank=True,
        verbose_name="Open Graph Title",
        help_text="Title for social media sharing"
    )
    og_description = models.CharField(
        max_length=300,
        null=True,
        blank=True,
        verbose_name="Open Graph Description",
        help_text="Description for social media sharing"
    )
    og_image = models.ForeignKey(
        'media.ImageMedia',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(app_label)s_%(class)s_og_images',
        verbose_name="Open Graph Image",
        help_text="Image for social media sharing"
    )
    canonical_url = models.URLField(
        null=True,
        blank=True,
        verbose_name="Canonical URL",
        help_text="Canonical URL for SEO"
    )
    robots_meta = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        default="index,follow",
        verbose_name="Robots Meta",
        help_text="Robots meta tag content"
    )
    structured_data = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        verbose_name="Structured Data",
        help_text="JSON-LD structured data"
    )
    hreflang_data = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        verbose_name="Hreflang Data",
        help_text="Hreflang data for multilingual SEO"
    )
    
    class Meta:
        abstract = True
        
    def get_meta_title(self):
        if hasattr(self, '_cached_meta_title'):
            return self._cached_meta_title
            
        if self.meta_title:
            self._cached_meta_title = self.meta_title
        else:
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
        if hasattr(self, '_cached_meta_description'):
            return self._cached_meta_description
            
        if self.meta_description:
            self._cached_meta_description = self.meta_description
        else:
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
        return self.og_title or self.get_meta_title()
    
    def get_og_description(self):
        return self.og_description or self.get_meta_description()
    
    def get_canonical_url(self):
        if self.canonical_url:
            return self.canonical_url
        if hasattr(self, 'get_public_url'):
            return self.get_public_url()
        return ""
    
    def generate_structured_data(self):
        return {
            "@context": "https://schema.org",
            "@type": "Thing",
            "name": self.get_meta_title(),
            "description": self.get_meta_description()
        }
