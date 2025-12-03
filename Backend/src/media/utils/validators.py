from django.core.exceptions import ValidationError
from django.conf import settings

ALLOWED_IMAGE_EXTENSIONS = settings.MEDIA_ALLOWED_EXTENSIONS.get('image', [])
MAX_IMAGE_SIZE = settings.MEDIA_FILE_SIZE_LIMITS.get('image', 5 * 1024 * 1024)


def validate_image_file(file):
    ext = file.name.split('.')[-1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(f"File extension '{ext}' is not allowed. Allowed extensions: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}")
    if file.size > MAX_IMAGE_SIZE:
        max_size_mb = MAX_IMAGE_SIZE // (1024 * 1024)
        raise ValidationError(f"Image file size exceeds maximum allowed size of {max_size_mb}MB.")
    if ext == 'svg':
        max_svg_size = min(MAX_IMAGE_SIZE, 5242880)
        if file.size > max_svg_size:
            raise ValidationError("SVG file size exceeds maximum allowed size of 5MB.")
        try:
            svg_content = file.read(1024 * 50).decode('utf-8', errors='ignore')
            file.seek(0)
            dangerous_elements = ['<script', '<foreignObject', '<iframe']
            for element in dangerous_elements:
                if element in svg_content:
                    raise ValidationError(f"SVG file contains potentially dangerous element: {element}")
        except Exception:
            raise ValidationError("Invalid SVG file format.")
    return file