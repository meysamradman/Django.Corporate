from typing import Dict, Any, Callable, List
from src.ai.messages.messages import AI_ERRORS

class ContentDestinationRegistry:
    
    _destinations: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def register(cls, key: str, label: str, handler: Callable):
        
        cls._destinations[key] = {
            'label': label,
            'handler': handler
        }

    @classmethod
    def get_handler(cls, key: str) -> Callable:
        
        if key not in cls._destinations:
            raise ValueError(AI_ERRORS['destination_not_supported'].format(destination=key))
        return cls._destinations[key]['handler']

    @classmethod
    def get_all_destinations(cls) -> List[Dict[str, str]]:
        
        return [
            {'key': key, 'label': data['label']}
            for key, data in cls._destinations.items()
        ]

    @classmethod
    def has_destination(cls, key: str) -> bool:
        
        return key in cls._destinations
