def rate_limit_key(ip_address: str) -> str:
    return f"chatbot:rate_limit:{ip_address}"
