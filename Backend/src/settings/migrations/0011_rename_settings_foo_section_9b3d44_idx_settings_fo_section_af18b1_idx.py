
from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('settings', '0010_footer_about_model'),
    ]

    operations = [
        migrations.RenameIndex(
            model_name='footerlink',
            new_name='settings_fo_section_af18b1_idx',
            old_name='settings_foo_section_9b3d44_idx',
        ),
    ]
