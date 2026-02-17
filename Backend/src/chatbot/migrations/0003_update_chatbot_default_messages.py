from django.db import migrations, models

def migrate_legacy_chatbot_messages(apps, schema_editor):
    ChatbotSettings = apps.get_model('chatbot', 'ChatbotSettings')

    legacy_welcome = 'Hello! How can I help you?'
    legacy_default = "Sorry, I didn't understand. Please ask your question more clearly."

    new_welcome = 'سلام! چطور می‌تونم کمکتون کنم؟'
    new_default = 'متوجه نشدم. لطفاً سوالتان را واضح‌تر بپرسید.'

    ChatbotSettings.objects.filter(welcome_message=legacy_welcome).update(welcome_message=new_welcome)
    ChatbotSettings.objects.filter(default_message=legacy_default).update(default_message=new_default)

class Migration(migrations.Migration):

    dependencies = [
        ('chatbot', '0002_chatbotsettings_created_by_faq_created_by'),
    ]

    operations = [
        migrations.AlterField(
            model_name='chatbotsettings',
            name='welcome_message',
            field=models.CharField(
                default='سلام! چطور می‌تونم کمکتون کنم؟',
                help_text='Message displayed when chatbot starts',
                max_length=500,
                verbose_name='Welcome Message',
            ),
        ),
        migrations.AlterField(
            model_name='chatbotsettings',
            name='default_message',
            field=models.CharField(
                default='متوجه نشدم. لطفاً سوالتان را واضح‌تر بپرسید.',
                help_text="Message displayed when chatbot doesn't understand the query",
                max_length=500,
                verbose_name='Default Message',
            ),
        ),
        migrations.RunPython(migrate_legacy_chatbot_messages, migrations.RunPython.noop),
    ]
