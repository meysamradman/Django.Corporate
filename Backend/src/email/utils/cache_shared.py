def compose_email_key(*parts: str) -> str:
    return ":".join(part for part in parts if part)
