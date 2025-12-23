from supabase import create_client, Client
from config import settings
import logging

logger = logging.getLogger(__name__)

# Supabase client for PostgreSQL operations
def get_supabase_client() -> Client:
    """Get Supabase client for database operations"""
    try:
        supabase: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_key  # Use service role key for backend
        )
        return supabase
    except Exception as e:
        logger.error(f"Failed to create Supabase client: {str(e)}")
        raise

# Get a single instance
supabase_client = None

def get_db() -> Client:
    """Dependency to get database client"""
    global supabase_client
    if supabase_client is None:
        supabase_client = get_supabase_client()
    return supabase_client
