from typing import Dict, Any
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS, CONTENT_ERRORS
from src.ai.destinations.registry import ContentDestinationRegistry

class ContentDestinationHandler:

    @classmethod
    def save_to_destination(
        cls,
        content_data: Dict[str, Any],
        destination: str,
        destination_data: Dict[str, Any],
        admin
    ) -> Dict[str, Any]:

        if destination == 'direct':
            return {
                'saved': False,
                'destination': 'direct',
                'message': AI_SUCCESS['content_not_saved']
            }
        
        try:
            handler = ContentDestinationRegistry.get_handler(destination)
            return handler(content_data, destination_data, admin)
        except ValueError:
            raise ValueError(AI_ERRORS['destination_not_supported'].format(destination=destination))
