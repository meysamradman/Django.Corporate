from django.db import migrations

def fix_media_paths(apps, schema_editor):
    """
    修复媒体文件路径中的重复/media/问题
    """
    # 获取所有媒体模型
    ImageMedia = apps.get_model('media', 'ImageMedia')
    VideoMedia = apps.get_model('media', 'VideoMedia')
    AudioMedia = apps.get_model('media', 'AudioMedia')
    DocumentMedia = apps.get_model('media', 'DocumentMedia')
    
    # 修复ImageMedia文件路径
    for media in ImageMedia.objects.filter(file__startswith='media/media/'):
        old_path = media.file.name
        new_path = old_path.replace('media/media/', 'media/', 1)
        media.file.name = new_path
        media.save(update_fields=['file'])
    
    # 修复VideoMedia文件路径
    for media in VideoMedia.objects.filter(file__startswith='media/media/'):
        old_path = media.file.name
        new_path = old_path.replace('media/media/', 'media/', 1)
        media.file.name = new_path
        media.save(update_fields=['file'])
    
    # 修复AudioMedia文件路径
    for media in AudioMedia.objects.filter(file__startswith='media/media/'):
        old_path = media.file.name
        new_path = old_path.replace('media/media/', 'media/', 1)
        media.file.name = new_path
        media.save(update_fields=['file'])
    
    # 修复DocumentMedia文件路径
    for media in DocumentMedia.objects.filter(file__startswith='media/media/'):
        old_path = media.file.name
        new_path = old_path.replace('media/media/', 'media/', 1)
        media.file.name = new_path
        media.save(update_fields=['file'])
    
    # 同样修复封面图片路径
    for media in VideoMedia.objects.filter(cover_image__isnull=False):
        if media.cover_image and media.cover_image.file.name.startswith('media/media/'):
            old_path = media.cover_image.file.name
            new_path = old_path.replace('media/media/', 'media/', 1)
            media.cover_image.file.name = new_path
            media.cover_image.save(update_fields=['file'])
    
    for media in AudioMedia.objects.filter(cover_image__isnull=False):
        if media.cover_image and media.cover_image.file.name.startswith('media/media/'):
            old_path = media.cover_image.file.name
            new_path = old_path.replace('media/media/', 'media/', 1)
            media.cover_image.file.name = new_path
            media.cover_image.save(update_fields=['file'])
    
    for media in DocumentMedia.objects.filter(cover_image__isnull=False):
        if media.cover_image and media.cover_image.file.name.startswith('media/media/'):
            old_path = media.cover_image.file.name
            new_path = old_path.replace('media/media/', 'media/', 1)
            media.cover_image.file.name = new_path
            media.cover_image.save(update_fields=['file'])


def reverse_fix_media_paths(apps, schema_editor):
    """
    反向操作（如果需要回滚）
    """
    # 为了简化，我们不实现完整的反向操作
    # 在实际应用中，您可能需要根据具体情况实现
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('media', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            fix_media_paths,
            reverse_fix_media_paths
        ),
    ]