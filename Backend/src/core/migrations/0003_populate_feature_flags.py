from django.db import migrations


def populate_feature_flags(apps, schema_editor):
    FeatureFlag = apps.get_model('core', 'FeatureFlag')
    
    feature_flags = [
        {
            'key': 'portfolio',
            'is_active': True,
            'description': 'مدیریت و نمایش نمونه‌کارها. شامل CRUD نمونه‌کار، مدیریت تصاویر، SEO و export.'
        },
        {
            'key': 'blog',
            'is_active': True,
            'description': 'مدیریت مقالات و پست‌های بلاگ. شامل نوشتن، ویرایش، انتشار و مدیریت دسته‌بندی‌ها.'
        },
        {
            'key': 'ai',
            'is_active': True,
            'description': 'ابزارها و سرویس‌های هوش مصنوعی. شامل مدل‌های AI، provider management و integration.'
        },
        {
            'key': 'chatbot',
            'is_active': True,
            'description': 'سیستم چت‌بات هوشمند برای پاسخگویی خودکار به سوالات کاربران.'
        },
        {
            'key': 'ticket',
            'is_active': True,
            'description': 'سیستم تیکتینگ برای پشتیبانی و ارتباط با مشتریان.'
        },
        {
            'key': 'email',
            'is_active': True,
            'description': 'مدیریت ایمیل‌ها شامل ارسال، دریافت، template management و automation.'
        },
        {
            'key': 'page',
            'is_active': True,
            'description': 'صفحات سفارشی وب‌سایت مانند درباره ما، تماس با ما و صفحات landing.'
        },
        {
            'key': 'form',
            'is_active': True,
            'description': 'فرم‌ساز و مدیریت فرم‌ها برای جمع‌آوری اطلاعات از کاربران.'
        },
        {
            'key': 'real_estate',
            'is_active': True,
            'description': 'مدیریت املاک: مدیریت ملک‌ها، نمایندگان، آژانس‌ها و تمامی امکانات مربوط به املاک'
        },
    ]
    
    for flag_data in feature_flags:
        FeatureFlag.objects.get_or_create(
            key=flag_data['key'],
            defaults={
                'is_active': flag_data['is_active'],
                'description': flag_data['description']
            }
        )


def reverse_populate_feature_flags(apps, schema_editor):
    FeatureFlag = apps.get_model('core', 'FeatureFlag')
    
    keys_to_delete = [
        'portfolio', 'blog', 'ai', 'chatbot',
        'ticket', 'email', 'page', 'form', 'real_estate'
    ]
    
    FeatureFlag.objects.filter(key__in=keys_to_delete).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_rename_core_featur_is_acti_created_idx_core_featur_is_acti_31f4f0_idx_and_more'),
    ]

    operations = [
        migrations.RunPython(
            populate_feature_flags,
            reverse_populate_feature_flags
        ),
    ]

