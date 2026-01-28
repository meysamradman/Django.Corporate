
import django.core.validators
import django.utils.timezone
import uuid
from django.db import migrations, models

class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='ContactFormField',
            fields=[
                ('id', models.AutoField(editable=False, help_text='Primary key identifier', primary_key=True, serialize=False, verbose_name='ID')),
                ('public_id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, help_text='Unique identifier for public-facing operations', unique=True, verbose_name='Public ID')),
                ('is_active', models.BooleanField(db_index=True, default=True, help_text='Designates whether this record should be treated as active', verbose_name='Active Status')),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now, editable=False, help_text='Date and time when the record was created', verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Date and time when the record was last updated', verbose_name='Updated At')),
                ('field_type', models.CharField(choices=[('text', 'Text'), ('email', 'Email'), ('phone', 'Phone'), ('textarea', 'Textarea'), ('select', 'Select'), ('checkbox', 'Checkbox'), ('radio', 'Radio'), ('number', 'Number'), ('date', 'Date'), ('url', 'URL')], db_index=True, default='text', help_text='Type of field (text, email, select, etc.)', max_length=20, verbose_name='Field Type')),
                ('field_key', models.CharField(db_index=True, help_text='Unique key for the field (e.g., name, email, phone)', max_length=100, unique=True, validators=[django.core.validators.MinLengthValidator(2, message='Field key must be at least 2 characters.')], verbose_name='Field Key')),
                ('label', models.CharField(help_text='Field label displayed to users', max_length=200, verbose_name='Label')),
                ('placeholder', models.CharField(blank=True, help_text='Placeholder text inside the field (optional)', max_length=200, null=True, verbose_name='Placeholder')),
                ('required', models.BooleanField(db_index=True, default=True, help_text='Whether this field is required', verbose_name='Required')),
                ('order', models.PositiveIntegerField(db_index=True, default=0, help_text='Display order in form (lower numbers appear first)', verbose_name='Display Order')),
                ('platforms', models.JSONField(default=list, help_text="List of platforms where this field is displayed: ['website', 'mobile_app']", verbose_name='Platforms')),
                ('options', models.JSONField(blank=True, default=list, help_text="Options for select field: [{'value': 'option1', 'label': 'Option 1'}]", verbose_name='Options')),
                ('validation_rules', models.JSONField(blank=True, default=dict, help_text="Validation rules: {'min_length': 3, 'max_length': 100, 'pattern': '...'}", verbose_name='Validation Rules')),
            ],
            options={
                'verbose_name': 'Contact Form Field',
                'verbose_name_plural': 'Contact Form Fields',
                'db_table': 'form_contact_fields',
                'ordering': ['order', 'field_key'],
                'abstract': False,
                'indexes': [models.Index(fields=['is_active', 'order'], name='form_contac_is_acti_93798d_idx'), models.Index(fields=['field_type', 'is_active'], name='form_contac_field_t_e68d1d_idx')],
            },
        ),
    ]
