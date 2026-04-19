import logging

from supabase import Client, create_client

from app.core.config import settings

logger = logging.getLogger(__name__)

_supabase_client: Client | None = None


def get_client() -> Client:
    """Return the module-level Supabase client singleton."""
    global _supabase_client
    if _supabase_client is None:
        logger.info("Initialising Supabase client …")
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _supabase_client
