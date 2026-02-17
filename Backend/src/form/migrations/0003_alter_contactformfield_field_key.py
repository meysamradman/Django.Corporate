
import django.core.validators
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('form', '0002_contactformfield_created_by'),
    ]

    operations = [
        migrations.AlterField(
            model_name='contactformfield',
            name='field_key',
            field=models.CharField(db_index=True, help_text='Unique key for the field (e.g., name, email, phone)', max_length=100, unique=True, validators=[django.core.validators.MinLengthValidator(2, message='کلید فیلد باید حداقل 2 کاراکتر باشد')], verbose_name='Field Key'),
        ),
    ]
