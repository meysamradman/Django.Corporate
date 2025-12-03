from .general_settings_service import (
    get_general_settings,
    update_general_settings,
)
from .contact_phone_service import (
    get_contact_phones,
    create_contact_phone,
    get_contact_phone_by_id,
    update_contact_phone,
    delete_contact_phone,
)
from .contact_mobile_service import (
    get_contact_mobiles,
    create_contact_mobile,
    get_contact_mobile_by_id,
    update_contact_mobile,
    delete_contact_mobile,
)
from .contact_email_service import (
    get_contact_emails,
    create_contact_email,
    get_contact_email_by_id,
    update_contact_email,
    delete_contact_email,
)
from .social_media_service import (
    get_social_medias,
    create_social_media,
    get_social_media_by_id,
    update_social_media,
    delete_social_media,
)

__all__ = [
    'get_general_settings',
    'update_general_settings',
    'get_contact_phones',
    'create_contact_phone',
    'get_contact_phone_by_id',
    'update_contact_phone',
    'delete_contact_phone',
    'get_contact_mobiles',
    'create_contact_mobile',
    'get_contact_mobile_by_id',
    'update_contact_mobile',
    'delete_contact_mobile',
    'get_contact_emails',
    'create_contact_email',
    'get_contact_email_by_id',
    'update_contact_email',
    'delete_contact_email',
    'get_social_medias',
    'create_social_media',
    'get_social_media_by_id',
    'update_social_media',
    'delete_social_media',
]
