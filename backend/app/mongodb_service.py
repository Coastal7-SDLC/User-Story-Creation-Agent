"""
MongoDB service for the User Story Creation Agent.
"""
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from typing import List, Dict, Optional, Any
from urllib.parse import quote_plus

from .config import settings

logger = logging.getLogger(__name__)


class MongoDBService:
    """Service for MongoDB operations."""
    
    def __init__(self):
        """Initialize MongoDB connection."""
        try:
            # Fix MongoDB URI by properly encoding special characters
            if '@' in settings.mongodb_uri:
                # Parse the URI and encode the password part
                uri_parts = settings.mongodb_uri.split('@')
                if len(uri_parts) == 2:
                    auth_part = uri_parts[0]
                    rest_part = uri_parts[1]
                    
                    # Extract and encode username and password
                    if '://' in auth_part:
                        protocol_part = auth_part.split('://')[0] + '://'
                        credentials_part = auth_part.split('://')[1]
                        
                        if ':' in credentials_part:
                            username = credentials_part.split(':')[0]
                            password = credentials_part.split(':')[1]
                            
                            # Encode the password
                            encoded_password = quote_plus(password)
                            
                            # Reconstruct the URI
                            fixed_uri = f"{protocol_part}{username}:{encoded_password}@{rest_part}"
                            logger.info("✅ Fixed MongoDB URI with encoded password")
                        else:
                            fixed_uri = settings.mongodb_uri
                    else:
                        fixed_uri = settings.mongodb_uri
                else:
                    fixed_uri = settings.mongodb_uri
            else:
                fixed_uri = settings.mongodb_uri
            
            self.client = AsyncIOMotorClient(fixed_uri)
            self.db = self.client.user_stories_db
            self.stories_collection = self.db.user_stories
            
            logger.info("✅ MongoDB service initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize MongoDB service: {e}")
            raise
    
    async def test_connection(self) -> bool:
        """Test MongoDB connection."""
        try:
            # Ping the database
            await self.client.admin.command('ping')
            logger.info("✅ MongoDB connection test successful")
            return True
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"❌ MongoDB connection test failed: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Unexpected error testing MongoDB connection: {e}")
            return False
    
    async def save_user_stories(self, stories_data: Dict[str, Any]) -> str:
        """Save user stories to MongoDB."""
        try:
            result = await self.stories_collection.insert_one(stories_data)
            story_id = str(result.inserted_id)
            logger.info(f"✅ Saved user stories with ID: {story_id}")
            return story_id
        except Exception as e:
            logger.error(f"❌ Failed to save user stories: {e}")
            raise Exception(f"Failed to save user stories: {str(e)}")
    
    async def get_user_stories(self, skip: int = 0, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user stories with pagination."""
        try:
            cursor = self.stories_collection.find().skip(skip).limit(limit).sort("created_at", -1)
            stories = await cursor.to_list(length=limit)
            logger.info(f"✅ Retrieved {len(stories)} user stories")
            return stories
        except Exception as e:
            logger.error(f"❌ Failed to retrieve user stories: {e}")
            raise Exception(f"Failed to retrieve user stories: {str(e)}")
    
    async def get_user_story_by_id(self, story_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific user story by ID."""
        try:
            from bson import ObjectId
            story = await self.stories_collection.find_one({"_id": ObjectId(story_id)})
            if story:
                logger.info(f"✅ Retrieved user story with ID: {story_id}")
            else:
                logger.warning(f"⚠️ User story with ID {story_id} not found")
            return story
        except Exception as e:
            logger.error(f"❌ Failed to retrieve user story: {e}")
            raise Exception(f"Failed to retrieve user story: {str(e)}")
    
    async def close_connection(self):
        """Close MongoDB connection."""
        try:
            self.client.close()
            logger.info("✅ MongoDB connection closed")
        except Exception as e:
            logger.error(f"❌ Error closing MongoDB connection: {e}")
