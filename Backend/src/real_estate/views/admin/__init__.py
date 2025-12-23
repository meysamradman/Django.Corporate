from .property_views import PropertyAdminViewSet
from .type_views import PropertyTypeAdminViewSet
from .state_views import PropertyStateAdminViewSet
from .label_views import PropertyLabelAdminViewSet
from .feature_views import PropertyFeatureAdminViewSet
from .tag_views import PropertyTagAdminViewSet
from .agent_views import PropertyAgentAdminViewSet
from .agency_views import RealEstateAgencyAdminViewSet

__all__ = [
    'PropertyAdminViewSet',
    'PropertyTypeAdminViewSet',
    'PropertyStateAdminViewSet',
    'PropertyLabelAdminViewSet',
    'PropertyFeatureAdminViewSet',
    'PropertyTagAdminViewSet',
    'PropertyAgentAdminViewSet',
    'RealEstateAgencyAdminViewSet',
]

