def compose_analytics_key(resource: str, identifier: str | int | None = None) -> str:
    if identifier is None:
        return f"admin:analytics:{resource}"
    return f"admin:analytics:{resource}:{identifier}"


def should_bypass_cache(request) -> bool:
    if request is None:
        return False

    bypass_param = str(request.query_params.get('no_cache', '')).lower()
    if bypass_param in {'1', 'true', 'yes'}:
        return True

    bypass_header = str(request.headers.get('X-Bypass-Cache', '')).lower()
    return bypass_header in {'1', 'true', 'yes'}
