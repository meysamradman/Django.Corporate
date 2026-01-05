"""
Real Estate Constants
مقادیر ثابت و لیست‌های گزینه‌های املاک
"""
from .document_types import (
    DOCUMENT_TYPE_CHOICES,
    get_document_type_label,
    get_document_type_choices_list,
)
from .space_type_choices import (
    SPACE_TYPE_CHOICES,
    get_space_type_label,
    get_space_type_choices_list,
)
from .construction_status_choices import (
    CONSTRUCTION_STATUS_CHOICES,
    get_construction_status_label,
    get_construction_status_choices_list,
)
from .property_condition_choices import (
    PROPERTY_CONDITION_CHOICES,
    get_property_condition_label,
    get_property_condition_choices_list,
)
from .property_direction_choices import (
    PROPERTY_DIRECTION_CHOICES,
    get_property_direction_label,
    get_property_direction_choices_list,
)
from .city_position_choices import (
    CITY_POSITION_CHOICES,
    get_city_position_label,
    get_city_position_choices_list,
)
from .unit_type_choices import (
    UNIT_TYPE_CHOICES,
    get_unit_type_label,
    get_unit_type_choices_list,
)
from .listing_type_choices import (
    LISTING_TYPE_CHOICES,
    get_listing_type_label,
    get_listing_type_choices_list,
)
from .property_status_choices import (
    PROPERTY_STATUS_CHOICES,
    get_property_status_label,
    get_property_status_choices_list,
)

__all__ = [
    # Document Types
    'DOCUMENT_TYPE_CHOICES',
    'get_document_type_label',
    'get_document_type_choices_list',
    # Space Types (Short-term rental)
    'SPACE_TYPE_CHOICES',
    'get_space_type_label',
    'get_space_type_choices_list',
    # Construction Status (Pre-sale)
    'CONSTRUCTION_STATUS_CHOICES',
    'get_construction_status_label',
    'get_construction_status_choices_list',
    # Property Condition
    'PROPERTY_CONDITION_CHOICES',
    'get_property_condition_label',
    'get_property_condition_choices_list',
    # Property Direction
    'PROPERTY_DIRECTION_CHOICES',
    'get_property_direction_label',
    'get_property_direction_choices_list',
    # City Position
    'CITY_POSITION_CHOICES',
    'get_city_position_label',
    'get_city_position_choices_list',
    # Unit Type
    'UNIT_TYPE_CHOICES',
    'get_unit_type_label',
    'get_unit_type_choices_list',
    # Listing Types
    'LISTING_TYPE_CHOICES',
    'get_listing_type_label',
    'get_listing_type_choices_list',
    # Property Status
    'PROPERTY_STATUS_CHOICES',
    'get_property_status_label',
    'get_property_status_choices_list',
]
