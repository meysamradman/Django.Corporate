from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0004_pageview_created_by'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dailystats',
            name='date',
            field=models.DateField(db_index=True),
        ),
        migrations.AddConstraint(
            model_name='dailystats',
            constraint=models.UniqueConstraint(fields=('date', 'site_id'), name='analytics_daily_stats_date_site_uniq'),
        ),
    ]
