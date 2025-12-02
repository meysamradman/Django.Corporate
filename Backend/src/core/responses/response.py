from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from datetime import datetime
from urllib.parse import urlparse, parse_qs


class APIResponse(JSONRenderer):
    
    @staticmethod
    def success(message="Request successful", data=None, status_code=200):
        response_data = {
            'metaData': {
                "status": "success",
                "message": message,
                "AppStatusCode": status_code,
                "timestamp": datetime.utcnow().isoformat()
            },
            'data': data if data is not None else {}
        }
        return Response(response_data, status=status_code)
    
    @staticmethod
    def error(message="An error occurred", errors=None, status_code=400):
        response_data = {
            'metaData': {
                "status": "error",
                "message": message,
                "AppStatusCode": status_code,
                "timestamp": datetime.utcnow().isoformat()
            },
            'data': {}
        }
        
        if errors:
            response_data['errors'] = errors
            
        return Response(response_data, status=status_code)
    
    def render(self, data, accepted_media_type=None, renderer_context=None):
        if isinstance(data, dict) and 'results' in data and 'count' in data:
            status_code = renderer_context.get('response').status_code if renderer_context and renderer_context.get('response') else 200
            
            count = data.get('count', 0)
            next_url = data.get('next')
            previous_url = data.get('previous')
            results = data.get('results', [])
            page_size = self._get_page_size_from_request(renderer_context)
            
            current_page = 1
            total_pages = max(1, (count + page_size - 1) // page_size if page_size > 0 else 1)
            
            try:
                request = renderer_context.get('request') if renderer_context else None
                if request and hasattr(request, 'query_params'):
                    offset = request.query_params.get('offset', 0)
                    limit = request.query_params.get('limit', page_size)
                    try:
                        offset = int(offset)
                        limit = int(limit)
                        if limit > 0:
                            current_page = (offset // limit) + 1
                    except (ValueError, TypeError):
                        pass
            except Exception:
                pass
            
            response_data = {
                'metaData': {
                    "status": "success",
                    "message": "Request successful",
                    "AppStatusCode": status_code,
                    "timestamp": datetime.utcnow().isoformat()
                },
                'pagination': {
                    "count": count,
                    "next": next_url,
                    "previous": previous_url,
                    "page_size": page_size,
                    "current_page": current_page,
                    "total_pages": total_pages
                },
                'data': results
            }
            return super().render(response_data, accepted_media_type, renderer_context)
        
        if isinstance(data, dict) and 'detail' in data and len(data) <= 2:
            status_code = renderer_context.get('response').status_code if renderer_context and renderer_context.get('response') else 400
            response_data = {
                'metaData': {
                    "status": "error" if status_code >= 400 else "success",
                    "message": data.get('detail', 'An error occurred' if status_code >= 400 else 'Request successful'),
                    "AppStatusCode": status_code,
                    "timestamp": datetime.utcnow().isoformat()
                },
                'data': {}
            }
            return super().render(response_data, accepted_media_type, renderer_context)
        
        if isinstance(data, dict) and 'metaData' in data and 'data' in data:
            return super().render(data, accepted_media_type, renderer_context)
        
        response_data = {}
        response = renderer_context.get('response') if renderer_context else None
        status_code = response.status_code if response else 200
        
        response_data['metaData'] = {
            "status": "success" if status_code < 400 else "error",
            "message": self._extract_message(data, status_code),
            "AppStatusCode": status_code,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        response_data['data'] = data if data is not None else {}
        
        return super().render(response_data, accepted_media_type, renderer_context)
    
    def _extract_message(self, data, status_code):
        if status_code >= 400:
            if isinstance(data, dict):
                return data.get('detail') or data.get('message') or "An error occurred"
            return "An error occurred"
        return "Request successful"
    
    def _get_page_size_from_request(self, renderer_context):
        try:
            request = renderer_context.get('request') if renderer_context else None
            if request and hasattr(request, 'query_params'):
                limit = request.query_params.get('limit', 10)
                try:
                    return int(limit)
                except (ValueError, TypeError):
                    pass
        except Exception:
            pass
        return 10