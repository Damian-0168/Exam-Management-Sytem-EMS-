from pydantic_settings import BaseSettings
from pathlib import Path
from dotenv import load_dotenv
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

class Settings(BaseSettings):
    # Database
    mongo_url: str = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    db_name: str = os.getenv('DB_NAME', 'test_database')
    
    # CORS
    cors_origins: str = os.getenv('CORS_ORIGINS', '*')
    
    # Supabase
    supabase_url: str = os.getenv('SUPABASE_URL', '')
    supabase_service_key: str = os.getenv('SUPABASE_SERVICE_KEY', '')
    supabase_anon_key: str = os.getenv('SUPABASE_ANON_KEY', '')
    
    # SendGrid
    sendgrid_api_key: str = os.getenv('SENDGRID_API_KEY', '')
    sendgrid_from_email: str = os.getenv('SENDGRID_FROM_EMAIL', '')
    
    # JWT
    jwt_secret: str = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
    jwt_algorithm: str = 'HS256'
    jwt_expiration_hours: int = 24
    
    # Storage
    storage_bucket_name: str = os.getenv('STORAGE_BUCKET_NAME', 'exam-pdfs')
    signed_url_expiration_seconds: int = 3600  # 1 hour
    
    class Config:
        env_file = '.env'

settings = Settings()
