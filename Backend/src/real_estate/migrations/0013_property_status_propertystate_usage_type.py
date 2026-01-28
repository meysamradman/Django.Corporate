
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('real_estate', '0012_cityregion_created_by_floorplanimage_created_by_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='property',
            name='status',
            field=models.CharField(choices=[('active', 'Active'), ('pending', 'Pending Deal'), ('sold', 'Sold'), ('rented', 'Rented'), ('archived', 'Archived')], db_index=True, default='active', help_text='Lifecycle status of the listing (Active -> Pending -> Sold)', max_length=20, verbose_name='Listing Status'),
        ),
        migrations.AddField(
            model_name='propertystate',
            name='usage_type',
            field=models.CharField(choices=[('sale', 'For Sale'), ('rent', 'For Rent'), ('presale', 'Pre-sale'), ('exchange', 'Exchange'), ('other', 'Other')], db_index=True, default='other', help_text='System category for analytics (e.g. Sale vs Rent)', max_length=20, verbose_name='Usage Type'),
        ),
    ]
