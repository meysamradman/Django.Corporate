from django.db import migrations, models
from django.db.models import Q
from django.utils.text import slugify


def fill_feature_slug_and_cleanup_parent(apps, schema_editor):
    PropertyFeature = apps.get_model('real_estate', 'PropertyFeature')

    used_slugs = set(
        PropertyFeature.objects.exclude(slug='').values_list('slug', flat=True)
    )

    for feature in PropertyFeature.objects.order_by('id'):
        if feature.parent_id == feature.id:
            feature.parent_id = None

        if feature.parent_id:
            parent = PropertyFeature.objects.filter(id=feature.parent_id).first()
            if parent and parent.parent_id:
                feature.parent_id = None

        current_slug = (feature.slug or '').strip()
        if current_slug:
            base_slug = current_slug
        else:
            base_slug = slugify(feature.title or '', allow_unicode=True) or f"feature-{feature.id}"

        candidate = base_slug
        counter = 2
        while candidate in used_slugs:
            candidate = f"{base_slug}-{counter}"
            counter += 1

        feature.slug = candidate
        used_slugs.add(candidate)
        feature.save(update_fields=['slug', 'parent'])


class Migration(migrations.Migration):

    dependencies = [
        ('real_estate', '0020_propertylabel_slug_unique_non_empty'),
    ]

    operations = [
        migrations.AddField(
            model_name='propertyfeature',
            name='slug',
            field=models.SlugField(
                allow_unicode=True,
                blank=True,
                db_index=True,
                default='',
                help_text='URL-friendly identifier for the feature',
                max_length=120,
                verbose_name='URL Slug',
            ),
        ),
        migrations.AddField(
            model_name='propertyfeature',
            name='parent',
            field=models.ForeignKey(
                blank=True,
                db_index=True,
                help_text='Optional parent feature (max one nesting level)',
                null=True,
                on_delete=models.SET_NULL,
                related_name='children',
                to='real_estate.propertyfeature',
                verbose_name='Parent Feature',
            ),
        ),
        migrations.RunPython(fill_feature_slug_and_cleanup_parent, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name='propertyfeature',
            constraint=models.UniqueConstraint(
                fields=('slug',),
                condition=~Q(slug=''),
                name='uq_property_feature_slug_non_empty',
            ),
        ),
    ]
