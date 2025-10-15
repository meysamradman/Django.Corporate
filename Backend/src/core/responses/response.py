from rest_framework.renderers import JSONRenderer
from datetime import datetime


class APIResponse(JSONRenderer):
    """
    Custom renderer that transforms all API responses to a consistent format
    - Works automatically without manual calls
    - Compatible with pagination
    - Compatible with exception handlers
    """
    
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response_data = {}
        response = renderer_context.get('response') if renderer_context else None
        status_code = response.status_code if response else 200
        
        # Common metadata
        response_data['metaData'] = {
            "status": "success" if status_code < 400 else "error",
            "message": self._extract_message(data, status_code),
            "AppStatusCode": status_code,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Check if response is paginated
        if isinstance(data, dict) and 'results' in data:
            # Paginated response
            response_data['pagination'] = {
                "count": data.get('count', 0),
                "next": data.get('next'),
                "previous": data.get('previous'),
                "page_size": len(data.get('results', [])),
            }
            response_data['data'] = data.get('results', [])
        else:
            # Normal response
            response_data['data'] = data if data is not None else {}
        
        return super().render(response_data, accepted_media_type, renderer_context)
    
    def _extract_message(self, data, status_code):
        """Extract message from data or status code"""
        if status_code >= 400:
            if isinstance(data, dict):
                return data.get('detail') or data.get('message') or "An error occurred"
            return "An error occurred"
        return "Request successful"