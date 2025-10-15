from rest_framework.views import exception_handler
from datetime import datetime


def custom_exception_handler(exc, context):
    """Custom exception handler for consistent error responses"""
    response = exception_handler(exc, context)
    
    if response is not None:
        # Custom format for errors
        custom_response = {
            'metaData': {
                'status': 'error',
                'message': str(exc),
                'AppStatusCode': response.status_code,
                'timestamp': datetime.utcnow().isoformat()
            },
            'data': response.data
        }
        response.data = custom_response
    
    return response