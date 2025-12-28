# Generated manually for optimization
from django.db import migrations, models
from django.contrib.postgres.indexes import BrinIndex
from django.core.validators import MinValueValidator, MaxValueValidator


class Migration(migrations.Migration):

    dependencies = [
        ('real_estate', '0007_remove_realestateagency_cover_image_and_more'),
    ]

    operations = [
        # ═══════════════════════════════════════════════════
        # 1. تبدیل IntegerField → SmallIntegerField
        # ═══════════════════════════════════════════════════
        migrations.AlterField(
            model_name='property',
            name='bedrooms',
            field=models.SmallIntegerField(
                choices=[
                    (0, 'استودیو / بدون خواب'),
                    (1, '۱ خوابه'),
                    (2, '۲ خوابه'),
                    (3, '۳ خوابه'),
                    (4, '۴ خوابه'),
                    (5, '۵ خوابه'),
                    (6, '۶ خوابه'),
                    (7, '۷ خوابه'),
                    (8, '۸ خوابه'),
                    (9, '۹ خوابه'),
                    (10, '۱۰+ خوابه'),
                ],
                default=1,
                validators=[MinValueValidator(0), MaxValueValidator(10)],
                db_index=True,
                verbose_name='Bedrooms',
                help_text='Number of bedrooms (0 = Studio)'
            ),
        ),
        
        migrations.AlterField(
            model_name='property',
            name='bathrooms',
            field=models.SmallIntegerField(
                choices=[
                    (0, 'بدون سرویس بهداشتی'),
                    (1, '۱ سرویس'),
                    (2, '۲ سرویس'),
                    (3, '۳ سرویس'),
                    (4, '۴ سرویس'),
                    (5, '۵+ سرویس'),
                ],
                default=1,
                validators=[MinValueValidator(0), MaxValueValidator(5)],
                db_index=True,
                verbose_name='Bathrooms',
                help_text='Number of bathrooms'
            ),
        ),
        
        migrations.AlterField(
            model_name='property',
            name='parking_spaces',
            field=models.SmallIntegerField(
                choices=[
                    (0, 'بدون پارکینگ'),
                    (1, '۱ پارکینگ'),
                    (2, '۲ پارکینگ'),
                    (3, '۳ پارکینگ'),
                    (4, '۴ پارکینگ'),
                    (5, '۵+ پارکینگ'),
                ],
                default=0,
                validators=[MinValueValidator(0), MaxValueValidator(10)],
                db_index=True,
                verbose_name='Parking Spaces',
                help_text='Number of parking spaces'
            ),
        ),
        
        migrations.AlterField(
            model_name='property',
            name='year_built',
            field=models.SmallIntegerField(
                null=True,
                blank=True,
                db_index=True,
                validators=[
                    MinValueValidator(1300, message='Year built should not be less than 1300'),
                    MaxValueValidator(1410, message='Year built should not be more than 1410')
                ],
                verbose_name='Year Built',
                help_text='Year the property was built (Solar calendar, e.g., 1400)'
            ),
        ),
        
        migrations.AlterField(
            model_name='property',
            name='build_years',
            field=models.SmallIntegerField(
                null=True,
                blank=True,
                db_index=True,
                verbose_name='Build Years',
                help_text='Number of years since the property was built'
            ),
        ),
        
        migrations.AlterField(
            model_name='property',
            name='floors_in_building',
            field=models.SmallIntegerField(
                null=True,
                blank=True,
                verbose_name='Floors in Building',
                help_text='Total floors in the building'
            ),
        ),
        
        migrations.AlterField(
            model_name='property',
            name='floor_number',
            field=models.SmallIntegerField(
                null=True,
                blank=True,
                verbose_name='Floor Number',
                help_text='Floor number of the property'
            ),
        ),
        
        migrations.AlterField(
            model_name='property',
            name='kitchens',
            field=models.SmallIntegerField(
                default=1,
                validators=[MinValueValidator(0), MaxValueValidator(10)],
                verbose_name='Kitchens',
                help_text='Number of kitchens'
            ),
        ),
        
        migrations.AlterField(
            model_name='property',
            name='living_rooms',
            field=models.SmallIntegerField(
                default=1,
                validators=[MinValueValidator(0), MaxValueValidator(10)],
                verbose_name='Living Rooms',
                help_text='Number of living rooms'
            ),
        ),
        
        migrations.AlterField(
            model_name='property',
            name='storage_rooms',
            field=models.SmallIntegerField(
                default=0,
                validators=[MinValueValidator(0), MaxValueValidator(10)],
                verbose_name='Storage Rooms',
                help_text='Number of storage rooms'
            ),
        ),
        
        # ═══════════════════════════════════════════════════
        # 2. حذف Constraint قدیمی و اضافه کردن جدید
        # ═══════════════════════════════════════════════════
        migrations.RemoveConstraint(
            model_name='property',
            name='property_bedrooms_range',
        ),
        migrations.RemoveConstraint(
            model_name='property',
            name='property_bathrooms_range',
        ),
        migrations.RemoveConstraint(
            model_name='property',
            name='property_parking_spaces_non_negative',
        ),
        
        # حذف BRIN Index قدیمی که created_at و updated_at با هم داره
        migrations.RemoveIndex(
            model_name='property',
            name='real_estate_created_7f9661_brin',
        ),
        
        migrations.AddConstraint(
            model_name='property',
            constraint=models.CheckConstraint(
                condition=models.Q(bedrooms__gte=0) & models.Q(bedrooms__lte=10),
                name='property_bedrooms_range'
            ),
        ),
        
        migrations.AddConstraint(
            model_name='property',
            constraint=models.CheckConstraint(
                condition=models.Q(bathrooms__gte=0) & models.Q(bathrooms__lte=5),
                name='property_bathrooms_range'
            ),
        ),
        
        migrations.AddConstraint(
            model_name='property',
            constraint=models.CheckConstraint(
                condition=models.Q(parking_spaces__gte=0) & models.Q(parking_spaces__lte=10),
                name='property_parking_range'
            ),
        ),
        
        migrations.AddConstraint(
            model_name='property',
            constraint=models.CheckConstraint(
                condition=models.Q(year_built__isnull=True) | 
                         (models.Q(year_built__gte=1300) & models.Q(year_built__lte=1410)),
                name='property_year_built_range'
            ),
        ),
        
        # ═══════════════════════════════════════════════════
        # 3. اضافه کردن Index های بهینه جدید
        # ═══════════════════════════════════════════════════
        migrations.AddIndex(
            model_name='property',
            index=models.Index(
                fields=['city', 'property_type', 'bedrooms', 'bathrooms', '-price'],
                name='idx_main_filter',
            ),
        ),
        
        migrations.AddIndex(
            model_name='property',
            index=models.Index(
                fields=['city', 'bedrooms', '-created_at'],
                condition=models.Q(is_published=True, is_public=True, is_active=True),
                name='idx_published_fast'
            ),
        ),
        
        migrations.AddIndex(
            model_name='property',
            index=models.Index(
                fields=['city', 'region', 'neighborhood'],
                condition=models.Q(region__isnull=False),
                name='idx_region_search'
            ),
        ),
        
        migrations.AddIndex(
            model_name='property',
            index=models.Index(
                fields=['city', 'year_built', '-price'],
                condition=models.Q(year_built__isnull=False),
                name='idx_year_filter'
            ),
        ),
        
        # ═══════════════════════════════════════════════════
        # 4. اضافه کردن BRIN Indexes جداگانه
        # ═══════════════════════════════════════════════════
        migrations.AddIndex(
            model_name='property',
            index=BrinIndex(
                fields=['created_at'],
                pages_per_range=64,
                name='idx_brin_created'
            ),
        ),
        
        migrations.AddIndex(
            model_name='property',
            index=BrinIndex(
                fields=['published_at'],
                pages_per_range=64,
                name='idx_brin_published'
            ),
        ),
    ]

