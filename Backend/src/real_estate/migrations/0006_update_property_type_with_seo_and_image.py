
import django.db.models.deletion
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('media', '0001_initial'),
        ('real_estate', '0005_make_search_vector_editable_false'),
    ]

    operations = [
        migrations.AddField(
            model_name='propertytype',
            name='canonical_url',
            field=models.URLField(blank=True, help_text='Canonical URL for SEO', null=True, verbose_name='Canonical URL'),
        ),
        migrations.AddField(
            model_name='propertytype',
            name='hreflang_data',
            field=models.JSONField(blank=True, default=dict, help_text='Hreflang data for multilingual SEO', null=True, verbose_name='Hreflang Data'),
        ),
        migrations.AddField(
            model_name='propertytype',
            name='image',
            field=models.ForeignKey(blank=True, help_text='Main image for this property type', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='property_type_images', to='media.imagemedia', verbose_name='Main Image'),
        ),
        migrations.AddField(
            model_name='propertytype',
            name='is_public',
            field=models.BooleanField(db_index=True, default=True, help_text='Designates whether this type is publicly visible', verbose_name='Public'),
        ),
        migrations.AddField(
            model_name='propertytype',
            name='meta_description',
            field=models.CharField(blank=True, help_text='SEO description for search engines (max 300 characters)', max_length=300, null=True, verbose_name='Meta Description'),
        ),
        migrations.AddField(
            model_name='propertytype',
            name='meta_title',
            field=models.CharField(blank=True, db_index=True, help_text='SEO title for search engines (max 70 characters)', max_length=70, null=True, verbose_name='Meta Title'),
        ),
        migrations.AddField(
            model_name='propertytype',
            name='og_description',
            field=models.CharField(blank=True, help_text='Description for social media sharing', max_length=300, null=True, verbose_name='Open Graph Description'),
        ),
        migrations.AddField(
            model_name='propertytype',
            name='og_image',
            field=models.ForeignKey(blank=True, help_text='Image for social media sharing', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(app_label)s_%(class)s_og_images', to='media.imagemedia', verbose_name='Open Graph Image'),
        ),
        migrations.AddField(
            model_name='propertytype',
            name='og_title',
            field=models.CharField(blank=True, help_text='Title for social media sharing', max_length=70, null=True, verbose_name='Open Graph Title'),
        ),
        migrations.AddField(
            model_name='propertytype',
            name='robots_meta',
            field=models.CharField(blank=True, default='index,follow', help_text='Robots meta tag content', max_length=50, null=True, verbose_name='Robots Meta'),
        ),
        migrations.AddField(
            model_name='propertytype',
            name='structured_data',
            field=models.JSONField(blank=True, default=dict, help_text='JSON-LD structured data', null=True, verbose_name='Structured Data'),
        ),
        migrations.AlterField(
            model_name='propertytype',
            name='description',
            field=models.TextField(blank=True, help_text='Detailed description of this property type', null=True, verbose_name='Description'),
        ),
    ]
