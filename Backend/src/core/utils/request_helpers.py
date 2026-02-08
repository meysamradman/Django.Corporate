import json
from typing import Any, List, Dict

class MultipartDataParser:

    @staticmethod
    def extract_list(
        data: Dict[str, Any], 
        field_name: str, 
        convert_to_int: bool = False
    ) -> List[Any]:

        value = data.get(field_name)
        if not value:
            return []
        
        result = []
        
        if isinstance(value, list):
            result = [v for v in value if v]
        
        elif isinstance(value, str):
            value = value.strip()
            
            if value.startswith('['):
                try:
                    parsed = json.loads(value)
                    if isinstance(parsed, list):
                        result = parsed
                except (json.JSONDecodeError, ValueError):
                    pass
            
            if not result:
                result = [v.strip() for v in value.split(',') if v.strip()]
        
        else:
            result = [value]
        
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
