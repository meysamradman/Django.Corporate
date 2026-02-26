from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('real_estate', '0024_property_has_elevator_and_indexes'),
    ]

    operations = [
        migrations.AddField(
            model_name='propertyagent',
            name='show_in_team',
            field=models.BooleanField(
                db_index=True,
                default=False,
                help_text='Show this agent in public team sections',
                verbose_name='Show In Team',
            ),
        ),
        migrations.AddField(
            model_name='propertyagent',
            name='team_order',
            field=models.PositiveIntegerField(
                db_index=True,
                default=0,
                help_text='Sort order for team listing (lower first)',
                verbose_name='Team Order',
            ),
        ),
        migrations.AddIndex(
            model_name='propertyagent',
            index=models.Index(
                fields=['is_active', 'show_in_team', 'team_order'],
                name='real_estate_is_acti_8db51f_idx',
            ),
        ),
    ]
