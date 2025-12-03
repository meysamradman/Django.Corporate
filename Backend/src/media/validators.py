import re
from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible
from django.conf import settings

from src.media.messages.messages import MEDIA_ERRORS

ALLOWED_EXTENSIONS = settings.MEDIA_ALLOWED_EXTENSIONS

MAX_FILE_SIZES = settings.MEDIA_FILE_SIZE_LIMITS


@deconstructible
class FileSizeValidator:
    def __call__(self, data):
        ext = data.name.split('.')[-1].lower()
        media_type = None

        for mt, exts in ALLOWED_EXTENSIONS.items():
            if ext in exts:
                media_type = mt
                break

        if not media_type:
            raise ValidationError(MEDIA_ERRORS["invalid_file_type"])

        max_size = MAX_FILE_SIZES.get(media_type)
        if max_size and data.size > max_size:
            raise ValidationError(
                f"File size exceeds maximum allowed size of {max_size // (1024 * 1024)}MB for {media_type}."
            )


@deconstructible
class SVGSafeValidator:
    def __call__(self, value):
        if value.name.lower().endswith('.svg'):
            if value.size > MAX_FILE_SIZES['image']:
                raise ValidationError(
                    "SVG file size exceeds maximum allowed size of 5MB."
                )

            svg_content = value.read(1024 * 50).decode('utf-8', errors='ignore')
            value.seek(0)

            if re.search(r'<script|<foreignObject|<iframe', svg_content, re.IGNORECASE):
                raise ValidationError(
                    "SVG file contains potentially dangerous elements."
                )


@deconstructible
class VideoSafeValidator:
    def __call__(self, value):
        if value.name.lower().split('.')[-1] in ALLOWED_EXTENSIONS['video']:
            max_size = MAX_FILE_SIZES['video']
            if value.size > max_size:
                raise ValidationError(
                    f"Video file size exceeds maximum allowed size of {max_size // (1024 * 1024)}MB."
                )

            if hasattr(value, 'temporary_file_path'):
                try:
                    from hachoir.parser import createParser
                    from hachoir.metadata import extractMetadata

                    parser = createParser(value.temporary_file_path())
                    if not parser:
                        raise ValidationError(MEDIA_ERRORS["invalid_video_format"])

                    metadata = extractMetadata(parser)
                    if not metadata.get('duration', 0) > 0:
                        raise ValidationError(MEDIA_ERRORS["corrupted_video"])

                except ImportError:
                    pass