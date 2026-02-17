import hashlib
import json

def hash_payload(payload: dict) -> str:
    payload_str = json.dumps(payload, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha256(payload_str.encode()).hexdigest()[:12]

def compose_media_key(scope: str, resource: str, identifier: str | int | None = None) -> str:
    if identifier is None:
        return f"{scope}:media:{resource}"
    return f"{scope}:media:{resource}:{identifier}"
