def normalize_platform(platform: str | None) -> str:
    return (platform or "website").strip().lower()
