from django.db import models
from src.core.models import BaseModel
from src.user.models.location import City
from src.real_estate.models.location import District


class RealEstateAddress(BaseModel):
    district = models.ForeignKey(
        District,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='real_estate_addresses',
        db_index=True,
        verbose_name="District",
        help_text="The district associated with this address"
    )
    city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name='real_estate_addresses',
        db_index=True,
        verbose_name="City",
        help_text="The city associated with this address"
    )
    address = models.TextField(
        verbose_name="Address",
        help_text="The address of the real estate"
    )
    latitude = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Latitude",
        help_text="The latitude of the address"
    )
    longitude = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Longitude",
        help_text="The longitude of the address"
    )

    class Meta(BaseModel.Meta):
        db_table = 'real_estate_addresses'
        verbose_name = 'Real Estate Address'
        verbose_name_plural = 'Real Estate Addresses'
        indexes = [
            models.Index(fields=['address']),
            models.Index(fields=['city', 'district']),
        ]

    def __str__(self):
        return self.address
