from django.db import models
from src.core.models import BaseModel


class Country(BaseModel):
    """
    Country model for real estate properties.
    Separated from user location models for better performance and independence.
    """
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
            models.Index(fields=['code']),
        ]
    
    def __str__(self):
        return self.name


class Province(BaseModel):
    """
    Province model for real estate properties.
    Separated from user location models for better performance, independence, and scalability.
    This ensures that heavy queries on properties don't affect user location tables.
    """
    name = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name="Province Name",
        help_text="Name of the Iranian province"
    )
    code = models.CharField(
        max_length=3,
        unique=True,
        db_index=True,
        verbose_name="Province Code",
        help_text="Unique code for the province"
    )
    
    country = models.ForeignKey(
        Country,
        on_delete=models.PROTECT,
        related_name='provinces',
        db_index=True,
        verbose_name="Country",
        help_text="The country this province belongs to"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_provinces'
        verbose_name = 'Province'
        verbose_name_plural = 'Provinces'
        ordering = ['country__name', 'name']
        indexes = [
            models.Index(fields=['is_active', 'name']),
            models.Index(fields=['country', 'is_active']),
            models.Index(fields=['code']),
        ]
    
    def __str__(self):
        return f"{self.name}, {self.country.name}"


class City(BaseModel):
    """
    City model for real estate properties.
    Separated from user location models for better performance, independence, and scalability.
    This ensures that heavy queries on properties don't affect user location tables.
    """
    name = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name="City Name",
        help_text="Name of the city"
    )
    code = models.CharField(
        max_length=5,
        db_index=True,
        verbose_name="City Code",
        help_text="Unique code for the city within province"
    )
    
    province = models.ForeignKey(
        Province,
        on_delete=models.CASCADE,
        related_name='cities',
        db_index=True,
        verbose_name="Province",
        help_text="The province this city belongs to"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_cities'
        verbose_name = 'City'
        verbose_name_plural = 'Cities'
        ordering = ['province__country__name', 'province__name', 'name']
        unique_together = [('province', 'code')]
        indexes = [
            models.Index(fields=['province', 'name']),
            models.Index(fields=['is_active', 'province']),
            models.Index(fields=['code']),
        ]
    
    def __str__(self):
        return f"{self.name}, {self.province.name}"
    
    @property
    def full_name(self):
        return f"{self.name}, {self.province.name}, {self.province.country.name}"


class District(BaseModel):
    """
    District/Neighborhood model for real estate properties.
    Represents districts or neighborhoods within a city.
    """
    name = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name="District Name",
        help_text="Name of the district or neighborhood"
    )
    
    city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name='districts',
        db_index=True,
        verbose_name="City",
        help_text="The city this district belongs to"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'real_estate_districts'
        verbose_name = 'District'
        verbose_name_plural = 'Districts'
        ordering = ['city__province__country__name', 'city__province__name', 'city__name', 'name']
        unique_together = [('city', 'name')]
        indexes = [
            models.Index(fields=['city', 'name']),
            models.Index(fields=['is_active', 'city']),
        ]
    
    def __str__(self):
        return f"{self.name}, {self.city.name}"
    
    @property
    def full_name(self):
        return f"{self.name}, {self.city.name}, {self.city.province.name}, {self.city.province.country.name}"
