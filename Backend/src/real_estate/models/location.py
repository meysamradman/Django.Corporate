from django.db import models
from src.core.models import BaseModel
from src.user.models.location import Province, City


class Country(BaseModel):
    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Country Name",
        help_text="Name of the country"
    )
    code = models.CharField(
        max_length=3,
        unique=True,
        db_index=True,
        verbose_name="Country Code",
        help_text="ISO country code (e.g., IRN, USA)"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_countries'
        verbose_name = 'Country'
        verbose_name_plural = 'Countries'
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_active', 'name']),
        ]
    
    def __str__(self):
        return self.name


class District(BaseModel):
    name = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name="District Name",
        help_text="Name of the district or neighborhood"
    )
    
    city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name='real_estate_districts',
        db_index=True,
        verbose_name="City",
        help_text="The city this district belongs to"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_districts'
        verbose_name = 'District'
        verbose_name_plural = 'Districts'
        ordering = ['city__province__name', 'city__name', 'name']
        unique_together = [('city', 'name')]
        indexes = [
            models.Index(fields=['city', 'name']),
            models.Index(fields=['is_active', 'city']),
        ]
    
    def __str__(self):
        return f"{self.name}, {self.city.name}"
    
    @property
    def full_name(self):
        return f"{self.name}, {self.city.name}, {self.city.province.name}"
