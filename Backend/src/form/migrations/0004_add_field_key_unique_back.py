# Generated manually to add unique constraint back to field_key

from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('form', '0003_alter_contactformfield_options_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='contactformfield',
            name='field_key',
            field=models.CharField(
                db_index=True,
                help_text='Unique key for the field (e.g., name, email, phone)',
                max_length=100,
                unique=True,
                validators=[django.core.validators.MinLengthValidator(2, message='Field key must be at least 2 characters.')],
                verbose_name='Field Key'
            ),
        ),
    ]
