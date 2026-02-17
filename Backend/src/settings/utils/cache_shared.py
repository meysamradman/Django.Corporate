import hashlib
import json


def hash_payload(payload):
    payload_str = json.dumps(payload, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha256(payload_str.encode()).hexdigest()[:12]
