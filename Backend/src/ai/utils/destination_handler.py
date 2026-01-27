from typing import Dict, Any
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS, CONTENT_ERRORS
from src.ai.destinations.registry import ContentDestinationRegistry

class ContentDestinationHandler:
    """
    Handler for saving AI-generated content to various destinations.
    Delegates saving logic to registered handlers.
    """
    
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
        
        # Use Registry to find handler
        try:
            handler = ContentDestinationRegistry.get_handler(destination)
            return handler(content_data, destination_data, admin)
        except ValueError:
            raise ValueError(AI_ERRORS['destination_not_supported'].format(destination=destination))
