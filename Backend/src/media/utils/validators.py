from django.core.exceptions import ValidationError
from django.conf import settings
from src.media.messages.messages import MEDIA_ERRORS

ALLOWED_IMAGE_EXTENSIONS = settings.MEDIA_ALLOWED_EXTENSIONS.get('image', [])
MAX_IMAGE_SIZE = settings.MEDIA_FILE_SIZE_LIMITS.get('image', 5 * 1024 * 1024)

def validate_image_file(file):
    ext = file.name.split('.')[-1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(MEDIA_ERRORS['invalid_file_extension'].format(ext=ext, extensions=', '.join(ALLOWED_IMAGE_EXTENSIONS)))
    if file.size > MAX_IMAGE_SIZE:
        max_size_mb = MAX_IMAGE_SIZE // (1024 * 1024)
        raise ValidationError(MEDIA_ERRORS['file_size_exceeds_limit'].format(max_size_mb=max_size_mb))
    if ext == 'svg':
        max_svg_size = min(MAX_IMAGE_SIZE, 5242880)
        if file.size > max_svg_size:
            raise ValidationError(MEDIA_ERRORS['svg_size_exceeds_limit'])
        try:
            svg_content = file.read(1024 * 50).decode('utf-8', errors='ignore')
            file.seek(0)
            dangerous_elements = ['<script', '<foreignObject', '<iframe']
            for element in dangerous_elements:
                if element in svg_content:
                    raise ValidationError(MEDIA_ERRORS['svg_dangerous_element'].format(element=element))
        except Exception:
            raise ValidationError(MEDIA_ERRORS['invalid_svg_format'])
    return file