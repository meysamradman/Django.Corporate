
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('real_estate', '0013_property_status_propertystate_usage_type'),
    ]

    operations = [
        migrations.AlterField(
            model_name='property',
            name='description',
            field=models.TextField(blank=True, null=True, verbose_name='Description'),
        ),
        migrations.AlterField(
            model_name='property',
            name='status',
            field=models.CharField(choices=[('active', 'فعال'), ('pending', 'در حال معامله'), ('sold', 'فروخته شده'), ('rented', 'اجاره داده شده'), ('archived', 'بایگانی شده')], db_index=True, default='active', help_text='Lifecycle status of the listing (Active -> Pending -> Sold)', max_length=20, verbose_name='Listing Status'),
        ),
        migrations.AlterField(
            model_name='propertystate',
            name='usage_type',
            field=models.CharField(choices=[('sale', 'فروشی'), ('rent', 'اجاره\u200cای'), ('presale', 'پیش\u200cفروش'), ('exchange', 'تهاتر'), ('other', 'سایر')], db_index=True, default='other', help_text='System category for analytics (e.g. Sale vs Rent)', max_length=20, verbose_name='Usage Type'),
        ),
    ]
