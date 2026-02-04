import json
from typing import Any, List, Dict

class MultipartDataParser:
    """
    Parser for handling complex data sent via standard HTML forms or multipart/form-data.
    Supports JSON strings, CSV-style strings, and standard list structures.
    """
    
    @staticmethod
    def extract_list(
        data: Dict[str, Any], 
        field_name: str, 
        convert_to_int: bool = False
    ) -> List[Any]:
        """
        Extracts a list from request data dynamically.
        """
        value = data.get(field_name)
        if not value:
            return []
        
        result = []
        
        # 1. Handle actual lists
        if isinstance(value, list):
            result = [v for v in value if v]
        
        # 2. Handle strings (JSON or CSV)
        elif isinstance(value, str):
            value = value.strip()
            
            # Check if it's a JSON array
            if value.startswith('['):
                try:
                    parsed = json.loads(value)
                    if isinstance(parsed, list):
                        result = parsed
                except (json.JSONDecodeError, ValueError):
                    pass
            
            # Fallback to CSV if not JSON or if JSON parse failed/returned non-list
            if not result:
                result = [v.strip() for v in value.split(',') if v.strip()]
        
        # 3. Handle single items
        else:
            result = [value]
        
        # 4. Convert to integers if requested
        if convert_to_int:
            converted = []
            for v in result:
                try:
                    converted.append(int(v))
                except (ValueError, TypeError):
                    pass
            return converted
        
        return result
    
    @staticmethod
    def extract_dict(data: Dict[str, Any], field_name: str) -> Dict[str, Any]:
        """
        Safely extracts a dictionary from request data.
        """
        value = data.get(field_name)
        if not value:
            return {}
        
        if isinstance(value, dict):
            return value
        
        if isinstance(value, str):
            try:
                return json.loads(value)
            except (json.JSONDecodeError, ValueError):
                return {}
        
        return {}
