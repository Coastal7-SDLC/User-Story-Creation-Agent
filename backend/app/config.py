"""
Configuration settings for the User Story Creation Agent.
"""
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""
    
    def __init__(self):
        # MongoDB Configuration
        self.mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/user_stories_db")
        
        # OpenRouter Configuration
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY", "")
        self.openrouter_model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
        self.openrouter_base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        
        # Jira Configuration
        self.jira_url = os.getenv("JIRA_URL", "")
        self.jira_username = os.getenv("JIRA_USERNAME", "")
        self.jira_api_token = os.getenv("JIRA_API_TOKEN", "")
        self.jira_project_key = os.getenv("JIRA_PROJECT_KEY", "")
        
        # Application Configuration
        self.app_name = os.getenv("APP_NAME", "User Story Creation Agent")
        self.debug = os.getenv("DEBUG", "false").lower() == "true"
        self.host = os.getenv("HOST", "0.0.0.0")
        self.port = int(os.getenv("PORT", "8000"))


# Global settings instance
settings = Settings()
