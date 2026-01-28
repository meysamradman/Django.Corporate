
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='dailystats',
            name='site_id',
            field=models.CharField(db_index=True, default='default', max_length=50),
        ),
        migrations.AddField(
            model_name='dailystats',
            name='sources_distribution',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='dailystats',
            name='tablet_visits',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='pageview',
            name='site_id',
            field=models.CharField(db_index=True, default='default', max_length=50),
        ),
        migrations.AlterField(
            model_name='pageview',
            name='device',
            field=models.CharField(choices=[('mobile', 'Mobile'), ('desktop', 'Desktop'), ('tablet', 'Tablet'), ('other', 'Other')], db_index=True, max_length=10),
        ),
        migrations.AlterField(
            model_name='pageview',
            name='source',
            field=models.CharField(choices=[('web', 'Website'), ('app', 'Mobile Application'), ('desktop', 'Desktop Software'), ('bot', 'Bot/Scraper'), ('other', 'Other')], db_index=True, max_length=10),
        ),
    ]
