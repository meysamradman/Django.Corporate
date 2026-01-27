from typing import Dict, Any, Callable, List

class ContentDestinationRegistry:
    """
    Registry for managing AI content destinations.
    Allows apps to register themselves as destinations for AI-generated content.
    """
    _destinations: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def register(cls, key: str, label: str, handler: Callable):
        """
        Register a new destination handler.
        
        Args:
            key: Unique identifier for the destination (e.g., 'blog', 'real_estate')
            label: Human-readable label (e.g., 'وبلاگ', 'املاک')
            handler: Function that takes (content_data, destination_data, admin) and returns dict
        """
        cls._destinations[key] = {
            'label': label,
            'handler': handler
        }

    @classmethod
    def get_handler(cls, key: str) -> Callable:
        """Get the handler function for a specific destination."""
        if key not in cls._destinations:
            raise ValueError(f"Destination '{key}' is not registered.")
        return cls._destinations[key]['handler']

    @classmethod
    def get_all_destinations(cls) -> List[Dict[str, str]]:
        """Get a list of all available destinations for frontend."""
        return [
            {'key': key, 'label': data['label']}
            for key, data in cls._destinations.items()
        ]

    @classmethod
    def has_destination(cls, key: str) -> bool:
        """Check if a destination is registered."""
        return key in cls._destinations
