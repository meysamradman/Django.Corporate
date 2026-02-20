from django.db import migrations, models
from django.db.models import Q


def deduplicate_label_slugs(apps, schema_editor):
    PropertyLabel = apps.get_model('real_estate', 'PropertyLabel')

    used_slugs = set()
    for label in PropertyLabel.objects.exclude(slug='').order_by('id'):
        base_slug = (label.slug or '').strip()
        if not base_slug:
            continue

        candidate = base_slug
        counter = 2
        while candidate in used_slugs:
            candidate = f"{base_slug}-{counter}"
            counter += 1

        if candidate != label.slug:
            label.slug = candidate
            label.save(update_fields=['slug'])

        used_slugs.add(candidate)


class Migration(migrations.Migration):

    dependencies = [
        ('real_estate', '0019_cityregion_slug_and_more'),
    ]

    operations = [
        migrations.RunPython(deduplicate_label_slugs, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name='propertylabel',
            constraint=models.UniqueConstraint(
                fields=('slug',),
                condition=~Q(slug=''),
                name='uq_property_label_slug_non_empty',
            ),
        ),
    ]
