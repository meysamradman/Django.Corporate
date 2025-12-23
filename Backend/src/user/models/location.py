from django.db import models
from src.core.models import BaseModel


class Province(BaseModel):

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

    class Meta(BaseModel.Meta):
        db_table = 'provinces'
        verbose_name = 'Province'
        verbose_name_plural = 'Provinces'
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_active', 'name']),
        ]

    def __str__(self):
        return self.name


class City(BaseModel):

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
        db_table = 'cities'
        verbose_name = 'City'
        verbose_name_plural = 'Cities'
        ordering = ['province__name', 'name']
        unique_together = [('province', 'code')]
        indexes = [
            models.Index(fields=['province', 'name']),
            models.Index(fields=['is_active', 'province']),
        ]

    def __str__(self):
        return f"{self.name}, {self.province.name}"

    @property
    def full_name(self):
        return f"{self.name}, {self.province.name}"