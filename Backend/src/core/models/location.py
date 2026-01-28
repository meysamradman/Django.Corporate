from django.db import models
from .base import BaseModel

class Country(BaseModel):

    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="نام کشور",
        help_text="نام کشور (فعلاً فقط ایران)"
    )
    code = models.CharField(
        max_length=3,
        unique=True,
        db_index=True,
        verbose_name="کد کشور",
        help_text="کد ISO کشور (فعلاً فقط IRN برای ایران)"
    )
    phone_code = models.CharField(
        max_length=5,
        blank=True,
        verbose_name="کد تلفن",
        help_text="کد تلفن بین‌المللی (مثلاً: +98 برای ایران)"
    )
    
    @classmethod
    def get_iran(cls):
        
        iran, _ = cls.objects.get_or_create(
            code='IRN',
            defaults={
                'name': 'ایران',
                'phone_code': '+98',
                'is_active': True
            }
        )
        return iran
    
    class Meta(BaseModel.Meta):
        db_table = 'countries'
        verbose_name = 'کشور'
        verbose_name_plural = 'کشورها'
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_active', 'name']),
            models.Index(fields=['code']),
        ]
    
    def __str__(self):
        return self.name

class Province(BaseModel):

    name = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name="نام استان",
        help_text="نام استان (مثلاً: تهران، اصفهان)"
    )
    code = models.CharField(
        max_length=3,
        unique=True,
        db_index=True,
        verbose_name="کد استان",
        help_text="کد یکتای استان"
    )
    
    country = models.ForeignKey(
        Country,
        on_delete=models.PROTECT,
        related_name='provinces',
        db_index=True,
        verbose_name="کشور",
        help_text="کشور مربوط به این استان"
    )
    
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name="عرض جغرافیایی",
        help_text="عرض جغرافیایی مرکز استان"
    )
    longitude = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name="طول جغرافیایی",
        help_text="طول جغرافیایی مرکز استان"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'provinces'
        verbose_name = 'استان'
        verbose_name_plural = 'استان‌ها'
        ordering = ['country__name', 'name']
        indexes = [
            models.Index(fields=['is_active', 'name']),
            models.Index(fields=['country', 'is_active']),
            models.Index(fields=['code']),
        ]
    
    def __str__(self):
        return self.name

class City(BaseModel):

    name = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name="نام شهر",
        help_text="نام شهر (مثلاً: تهران، شیراز)"
    )
    code = models.CharField(
        max_length=5,
        db_index=True,
        verbose_name="کد شهر",
        help_text="کد یکتای شهر در استان"
    )
    
    province = models.ForeignKey(
        Province,
        on_delete=models.CASCADE,
        related_name='cities',
        db_index=True,
        verbose_name="استان",
        help_text="استان مربوط به این شهر"
    )
    
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name="عرض جغرافیایی",
        help_text="عرض جغرافیایی مرکز شهر"
    )
    longitude = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        null=True,
        blank=True,
        verbose_name="طول جغرافیایی",
        help_text="طول جغرافیایی مرکز شهر"
    )
    
    class Meta(BaseModel.Meta):
        db_table = 'cities'
        verbose_name = 'شهر'
        verbose_name_plural = 'شهرها'
        ordering = ['province__name', 'name']
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
        return f"{self.name}, {self.province.name}, ایران"
