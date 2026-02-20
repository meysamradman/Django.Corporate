from django.db import models
from django.db.models import Q
from src.core.models import BaseModel, City

class CityRegion(BaseModel):

    city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name='regions',
        db_index=True,
        verbose_name="City",
        help_text="The city this region belongs to"
    )
    name = models.CharField(
        max_length=50,
        verbose_name="Region Name",
        help_text="Example: منطقه 1، منطقه 2"
    )
    code = models.IntegerField(
        verbose_name="Region Code",
        help_text="Numeric code: 1، 2، 3، ..."
    )
    slug = models.CharField(
        max_length=160,
        blank=True,
        default="",
        db_index=True,
        verbose_name="Region Slug",
        help_text="English URL-friendly slug for website filtering"
    )

    class Meta(BaseModel.Meta):
        db_table = 'real_estate_city_regions'
        verbose_name = 'City Region'
        verbose_name_plural = 'City Regions'
        unique_together = [('city', 'code')]
        ordering = ['city', 'code']
        constraints = [
            models.UniqueConstraint(
                fields=['city', 'slug'],
                condition=~Q(slug=''),
                name='uq_city_region_city_slug_non_empty'
            ),
        ]
        indexes = [
            models.Index(fields=['city', 'code']),
            models.Index(fields=['is_active', 'city']),
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return f"{self.city.name} - {self.name}"

    @property
    def full_name(self):
        return f"{self.name}, {self.city.name}, {self.city.province.name}"
