import os
from dotenv import load_dotenv

# Load local environment variables if present
load_dotenv('.env.local')

DEFAULT_BASE_URI = "https://semantic-data-catalog.com"

def get_base_uri() -> str:
    """Return BASE_URI from environment or a default value."""
    return os.getenv("BASE_URI") or DEFAULT_BASE_URI
