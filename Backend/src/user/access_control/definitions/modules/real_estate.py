REAL_ESTATE_PERMISSIONS = {
    'real_estate.property.read': {
        'module': 'real_estate_properties',
        'action': 'read',
        'display_name': 'View Properties',
        'description': 'Allow viewing property listings and details',
    },
    'real_estate.property.create': {
        'module': 'real_estate_properties',
        'action': 'create',
        'display_name': 'Create Property',
        'description': 'Allow creating new properties',
    },
    'real_estate.property.update': {
        'module': 'real_estate_properties',
        'action': 'update',
        'display_name': 'Update Property',
        'description': 'Allow updating properties',
    },
    'real_estate.property.finalize': {
        'module': 'real_estate_properties',
        'action': 'finalize',
        'display_name': 'Finalize Property Deal',
        'description': 'Allow finalizing sold/rented deals for properties',
    },
    'real_estate.property.delete': {
        'module': 'real_estate_properties',
        'action': 'delete',
        'display_name': 'Delete Property',
        'description': 'Allow deleting properties',
    },
    
    'real_estate.agent.read': {
        'module': 'real_estate_agents',
        'action': 'read',
        'display_name': 'View Agents',
        'description': 'Allow viewing property agents list and details',
    },
    'real_estate.agent.create': {
        'module': 'real_estate_agents',
        'action': 'create',
        'display_name': 'Create Agent',
        'description': 'Allow creating new property agents',
    },
    'real_estate.agent.update': {
        'module': 'real_estate_agents',
        'action': 'update',
        'display_name': 'Update Agent',
        'description': 'Allow updating property agents',
    },
    'real_estate.agent.delete': {
        'module': 'real_estate_agents',
        'action': 'delete',
        'display_name': 'Delete Agent',
        'description': 'Allow deleting property agents',
    },
    
    'real_estate.agency.read': {
        'module': 'real_estate_agencies',
        'action': 'read',
        'display_name': 'View Agencies',
        'description': 'Allow viewing real estate agencies list and details',
    },
    'real_estate.agency.create': {
        'module': 'real_estate_agencies',
        'action': 'create',
        'display_name': 'Create Agency',
        'description': 'Allow creating new real estate agencies',
    },
    'real_estate.agency.update': {
        'module': 'real_estate_agencies',
        'action': 'update',
        'display_name': 'Update Agency',
        'description': 'Allow updating real estate agencies',
    },
    'real_estate.agency.delete': {
        'module': 'real_estate_agencies',
        'action': 'delete',
        'display_name': 'Delete Agency',
        'description': 'Allow deleting real estate agencies',
    },
    
    'real_estate.type.read': {
        'module': 'real_estate_properties',
        'action': 'read',
        'display_name': 'View Property Type',
        'description': 'Allow viewing property types',
    },
    'real_estate.type.create': {
        'module': 'real_estate_properties',
        'action': 'create',
        'display_name': 'Create Property Type',
        'description': 'Allow creating property types',
    },
    'real_estate.type.update': {
        'module': 'real_estate_properties',
        'action': 'update',
        'display_name': 'Update Property Type',
        'description': 'Allow updating property types',
    },
    'real_estate.type.delete': {
        'module': 'real_estate_properties',
        'action': 'delete',
        'display_name': 'Delete Property Type',
        'description': 'Allow deleting property types',
    },
    
    'real_estate.listing_type.read': {
        'module': 'real_estate_properties',
        'action': 'read',
        'display_name': 'View Listing Types',
        'description': 'Allow viewing listing types',
    },
    'real_estate.listing_type.create': {
        'module': 'real_estate_properties',
        'action': 'create',
        'display_name': 'Create Listing Type',
        'description': 'Allow creating listing types',
    },
    'real_estate.listing_type.update': {
        'module': 'real_estate_properties',
        'action': 'update',
        'display_name': 'Update Listing Type',
        'description': 'Allow updating listing types',
    },
    'real_estate.listing_type.delete': {
        'module': 'real_estate_properties',
        'action': 'delete',
        'display_name': 'Delete Listing Type',
        'description': 'Allow deleting listing types',
    },

    'real_estate.location.read': {
        'module': 'real_estate_properties',
        'action': 'read',
        'display_name': 'View Property Locations',
        'description': 'Allow viewing provinces, cities and regions',
    },
    'real_estate.location.create': {
        'module': 'real_estate_properties',
        'action': 'create',
        'display_name': 'Create Property Location',
        'description': 'Allow creating provinces, cities and regions',
    },
    'real_estate.location.update': {
        'module': 'real_estate_properties',
        'action': 'update',
        'display_name': 'Update Property Location',
        'description': 'Allow updating provinces, cities and regions',
    },
    'real_estate.location.delete': {
        'module': 'real_estate_properties',
        'action': 'delete',
        'display_name': 'Delete Property Location',
        'description': 'Allow deleting provinces, cities and regions',
    },
    
    'real_estate.label.read': {
        'module': 'real_estate_properties',
        'action': 'read',
        'display_name': 'View Property Labels',
        'description': 'Allow viewing property labels',
    },
    'real_estate.label.create': {
        'module': 'real_estate_properties',
        'action': 'create',
        'display_name': 'Create Property Label',
        'description': 'Allow creating property labels',
    },
    'real_estate.label.update': {
        'module': 'real_estate_properties',
        'action': 'update',
        'display_name': 'Update Property Label',
        'description': 'Allow updating property labels',
    },
    'real_estate.label.delete': {
        'module': 'real_estate_properties',
        'action': 'delete',
        'display_name': 'Delete Property Label',
        'description': 'Allow deleting property labels',
    },
    
    'real_estate.feature.read': {
        'module': 'real_estate_properties',
        'action': 'read',
        'display_name': 'View Property Features',
        'description': 'Allow viewing property features',
    },
    'real_estate.feature.create': {
        'module': 'real_estate_properties',
        'action': 'create',
        'display_name': 'Create Property Feature',
        'description': 'Allow creating property features',
    },
    'real_estate.feature.update': {
        'module': 'real_estate_properties',
        'action': 'update',
        'display_name': 'Update Property Feature',
        'description': 'Allow updating property features',
    },
    'real_estate.feature.delete': {
        'module': 'real_estate_properties',
        'action': 'delete',
        'display_name': 'Delete Property Feature',
        'description': 'Allow deleting property features',
    },
    
    'real_estate.tag.read': {
        'module': 'real_estate_properties',
        'action': 'read',
        'display_name': 'View Property Tags',
        'description': 'Allow viewing property tags',
    },
    'real_estate.tag.create': {
        'module': 'real_estate_properties',
        'action': 'create',
        'display_name': 'Create Property Tag',
        'description': 'Allow creating property tags',
    },
    'real_estate.tag.update': {
        'module': 'real_estate_properties',
        'action': 'update',
        'display_name': 'Update Property Tag',
        'description': 'Allow updating property tags',
    },
    'real_estate.tag.delete': {
        'module': 'real_estate_properties',
        'action': 'delete',
        'display_name': 'Delete Property Tag',
        'description': 'Allow deleting property tags',
    },
}

