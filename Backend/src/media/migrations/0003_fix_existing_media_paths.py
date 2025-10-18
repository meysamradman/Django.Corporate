from django.db import migrations

def fix_existing_media_paths(apps, schema_editor):
    """
    Fix existing media file paths by removing the extra 'media/' prefix
    """
    # Get all media models
    ImageMedia = apps.get_model('media', 'ImageMedia')
    VideoMedia = apps.get_model('media', 'VideoMedia')
    AudioMedia = apps.get_model('media', 'AudioMedia')
    DocumentMedia = apps.get_model('media', 'DocumentMedia')
    
    # Fix ImageMedia file paths
    for media in ImageMedia.objects.all():
        if media.file and media.file.name.startswith('media/media/'):
            old_path = media.file.name
            new_path = old_path.replace('media/media/', '', 1)
            media.file.name = new_path
            media.save(update_fields=['file'])
    
    # Fix VideoMedia file paths
    for media in VideoMedia.objects.all():
        if media.file and media.file.name.startswith('media/media/'):
            old_path = media.file.name
            new_path = old_path.replace('media/media/', '', 1)
            media.file.name = new_path
            media.save(update_fields=['file'])
    
    # Fix AudioMedia file paths
    for media in AudioMedia.objects.all():
        if media.file and media.file.name.startswith('media/media/'):
            old_path = media.file.name
            new_path = old_path.replace('media/media/', '', 1)
            media.file.name = new_path
            media.save(update_fields=['file'])
    
    # Fix DocumentMedia file paths
    for media in DocumentMedia.objects.all():
        if media.file and media.file.name.startswith('media/media/'):
            old_path = media.file.name
            new_path = old_path.replace('media/media/', '', 1)
            media.file.name = new_path
            media.save(update_fields=['file'])
    
    # Fix cover image paths for videos
    for media in VideoMedia.objects.filter(cover_image__isnull=False):
        if media.cover_image and media.cover_image.file.name.startswith('media/media/'):
            old_path = media.cover_image.file.name
            new_path = old_path.replace('media/media/', '', 1)
            media.cover_image.file.name = new_path
            media.cover_image.save(update_fields=['file'])
    
    # Fix cover image paths for audios
    for media in AudioMedia.objects.filter(cover_image__isnull=False):
        if media.cover_image and media.cover_image.file.name.startswith('media/media/'):
            old_path = media.cover_image.file.name
            new_path = old_path.replace('media/media/', '', 1)
            media.cover_image.file.name = new_path
            media.cover_image.save(update_fields=['file'])
    
    # Fix cover image paths for documents
    for media in DocumentMedia.objects.filter(cover_image__isnull=False):
        if media.cover_image and media.cover_image.file.name.startswith('media/media/'):
            old_path = media.cover_image.file.name
            new_path = old_path.replace('media/media/', '', 1)
            media.cover_image.file.name = new_path
            media.cover_image.save(update_fields=['file'])


def reverse_fix_existing_media_paths(apps, schema_editor):
    """
    Reverse operation - add back the 'media/' prefix
    """
    # Get all media models
    ImageMedia = apps.get_model('media', 'ImageMedia')
    VideoMedia = apps.get_model('media', 'VideoMedia')
    AudioMedia = apps.get_model('media', 'AudioMedia')
    DocumentMedia = apps.get_model('media', 'DocumentMedia')
    
    # Add back 'media/' prefix to ImageMedia file paths
    for media in ImageMedia.objects.all():
        if media.file and not media.file.name.startswith('media/'):
            old_path = media.file.name
            new_path = f"media/{old_path}"
            media.file.name = new_path
            media.save(update_fields=['file'])
    
    # Add back 'media/' prefix to VideoMedia file paths
    for media in VideoMedia.objects.all():
        if media.file and not media.file.name.startswith('media/'):
            old_path = media.file.name
            new_path = f"media/{old_path}"
            media.file.name = new_path
            media.save(update_fields=['file'])
    
    # Add back 'media/' prefix to AudioMedia file paths
    for media in AudioMedia.objects.all():
        if media.file and not media.file.name.startswith('media/'):
            old_path = media.file.name
            new_path = f"media/{old_path}"
            media.file.name = new_path
            media.save(update_fields=['file'])
    
    # Add back 'media/' prefix to DocumentMedia file paths
    for media in DocumentMedia.objects.all():
        if media.file and not media.file.name.startswith('media/'):
            old_path = media.file.name
            new_path = f"media/{old_path}"
            media.file.name = new_path
            media.save(update_fields=['file'])
    
    # Add back 'media/' prefix to cover image paths for videos
    for media in VideoMedia.objects.filter(cover_image__isnull=False):
        if media.cover_image and not media.cover_image.file.name.startswith('media/'):
            old_path = media.cover_image.file.name
            new_path = f"media/{old_path}"
            media.cover_image.file.name = new_path
            media.cover_image.save(update_fields=['file'])
    
    # Add back 'media/' prefix to cover image paths for audios
    for media in AudioMedia.objects.filter(cover_image__isnull=False):
        if media.cover_image and not media.cover_image.file.name.startswith('media/'):
            old_path = media.cover_image.file.name
            new_path = f"media/{old_path}"
            media.cover_image.file.name = new_path
            media.cover_image.save(update_fields=['file'])
    
    # Add back 'media/' prefix to cover image paths for documents
    for media in DocumentMedia.objects.filter(cover_image__isnull=False):
        if media.cover_image and not media.cover_image.file.name.startswith('media/'):
            old_path = media.cover_image.file.name
            new_path = f"media/{old_path}"
            media.cover_image.file.name = new_path
            media.cover_image.save(update_fields=['file'])


class Migration(migrations.Migration):
    dependencies = [
        ('media', '0002_fix_media_paths'),
    ]

    operations = [
        migrations.RunPython(
            fix_existing_media_paths,
            reverse_fix_existing_media_paths
        ),
    ]