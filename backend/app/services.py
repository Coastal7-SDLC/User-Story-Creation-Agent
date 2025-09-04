"""
Business logic services for the User Story Creation Agent.
"""
from openai import OpenAI
import json
import logging
import traceback
from typing import List

from .config import settings

logger = logging.getLogger(__name__)


class OpenRouterService:
    """Service for interacting with OpenRouter API."""
    
    def __init__(self):
        """Initialize the OpenRouter service with proper error handling."""
        try:
            # Validate configuration
            if not settings.openrouter_api_key:
                raise ValueError("OPENROUTER_API_KEY is not set")
            
            if not settings.openrouter_base_url:
                raise ValueError("OPENROUTER_BASE_URL is not set")
            
            if not settings.openrouter_model:
                raise ValueError("OPENROUTER_MODEL is not set")
            
            logger.info(f"Initializing OpenRouter service with model: {settings.openrouter_model}")
            
            # Create client
            self.client = OpenAI(
                base_url=settings.openrouter_base_url,
                api_key=settings.openrouter_api_key,
            )
            
            logger.info("✅ OpenRouter client created successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize OpenRouter service: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
    
    def generate_user_stories(self, requirements: str) -> dict:
        """
        Generate user stories with acceptance criteria from requirements using OpenRouter API.
        
        Args:
            requirements: Project requirements or business description
            
        Returns:
            Dictionary containing user stories and their acceptance criteria
            
        Raises:
            Exception: If generation fails
        """
        try:
            # Validate input
            if not requirements or not isinstance(requirements, str):
                raise ValueError("Requirements must be a non-empty string")
            
            if len(requirements.strip()) < 10:
                raise ValueError("Requirements must be at least 10 characters long")
            
            logger.info(f"Generating user stories with acceptance criteria for requirements: {requirements[:100]}...")
            
            # Create prompt
            prompt = f"""
            Given the following project requirements, generate user stories with acceptance criteria for agile development.
            
            Requirements:
            {requirements}
            
            Please analyze the requirements and generate an appropriate number of user stories based on the complexity and scope of the project. 
            - For simple requirements: Generate 2-4 user stories
            - For medium complexity: Generate 4-6 user stories  
            - For complex requirements: Generate 6-10 user stories
            - For very complex projects: Generate 8-15 user stories
            
            The number should be proportional to the scope and complexity of the requirements provided.
            
            Please output ONLY a JSON array of objects. Each object should contain:
            - "story": The user story in format "As a <role>, I want <feature> so that <reason>."
            - "acceptance_criteria": An array of acceptance criteria in "Given... When... Then..." format
            
            Example format:
            [
                {{
                    "story": "As a user, I want to register so that I can have a personal account.",
                    "acceptance_criteria": [
                        "Given I am on the registration page, When I fill in valid email and password, Then I should be able to create an account",
                        "Given I am on the registration page, When I submit with invalid email format, Then I should see an error message",
                        "Given I am on the registration page, When I submit with weak password, Then I should see password strength requirements"
                    ]
                }}
            ]
            
            Generate the appropriate number of user stories based on the complexity of the requirements provided, with 3-4 acceptance criteria each.
            """
            
            logger.info(f"Making API call to OpenRouter with model: {settings.openrouter_model}")
            
            # Make API call
            response = self.client.chat.completions.create(
                model=settings.openrouter_model,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a professional software analyst who creates clear, actionable user stories with acceptance criteria for agile development. You analyze project requirements and determine the appropriate number of user stories based on complexity and scope. For simple projects, generate fewer stories. For complex projects, generate more comprehensive stories. Always respond with valid JSON arrays containing story and acceptance_criteria fields."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000,
                extra_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "User Story Creation Agent",
                }
            )
            
            # Extract content
            content = response.choices[0].message.content.strip()
            logger.info(f"Received response from OpenRouter: {content[:200]}...")
            
            # Try to parse JSON response
            try:
                stories_with_criteria = json.loads(content)
                if isinstance(stories_with_criteria, list) and len(stories_with_criteria) > 0:
                    logger.info(f"Successfully parsed {len(stories_with_criteria)} user stories with acceptance criteria from JSON")
                    return {"stories": stories_with_criteria}
                else:
                    logger.warning("Response is not a valid list, extracting from text")
                    return self._extract_stories_with_criteria_from_text(content)
                    
            except json.JSONDecodeError as json_error:
                logger.warning(f"JSON parsing failed: {json_error}, extracting from text")
                return self._extract_stories_with_criteria_from_text(content)
                
        except Exception as e:
            logger.error(f"Error generating user stories with acceptance criteria: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise Exception(f"Failed to generate user stories with acceptance criteria: {str(e)}")
    
    def _extract_stories_with_criteria_from_text(self, text: str) -> dict:
        """
        Extract user stories with acceptance criteria from text response when JSON parsing fails.
        
        Args:
            text: Raw text response from the API
            
        Returns:
            Dictionary containing stories with acceptance criteria
        """
        try:
            lines = text.split('\n')
            stories_with_criteria = []
            current_story = None
            current_criteria = []
            
            for line in lines:
                line = line.strip()
                
                # Check if line contains a user story
                if line.startswith('As a ') and ('I want' in line or 'I need' in line):
                    # Save previous story if exists
                    if current_story:
                        stories_with_criteria.append({
                            "story": current_story,
                            "acceptance_criteria": current_criteria if current_criteria else [
                                f"Given the user story '{current_story}', When implemented correctly, Then the feature should work as expected"
                            ]
                        })
                    
                    # Start new story
                    current_story = line
                    current_criteria = []
                
                # Check if line contains acceptance criteria
                elif line.startswith('Given ') and 'When ' in line and 'Then ' in line:
                    current_criteria.append(line)
                
                # Check for numbered criteria
                elif line and any(char.isdigit() for char in line[:3]) and ('Given ' in line or 'When ' in line or 'Then ' in line):
                    # Remove numbering
                    criteria = line
                    for i in range(1, 10):
                        criteria = criteria.replace(f"{i}. ", "").replace(f"{i}) ", "")
                    if criteria.startswith('Given ') or criteria.startswith('When ') or criteria.startswith('Then '):
                        current_criteria.append(criteria)
            
            # Add the last story
            if current_story:
                stories_with_criteria.append({
                    "story": current_story,
                    "acceptance_criteria": current_criteria if current_criteria else [
                        f"Given the user story '{current_story}', When implemented correctly, Then the feature should work as expected"
                    ]
                })
            
            if stories_with_criteria:
                logger.info(f"Extracted {len(stories_with_criteria)} user stories with acceptance criteria from text")
                return {"stories": stories_with_criteria}
            else:
                logger.warning("No user stories found in text, returning default")
                return {
                    "stories": [{
                        "story": "As a user, I want to implement the requirements so that the system meets the business needs.",
                        "acceptance_criteria": [
                            "Given the requirements are clear, When implemented correctly, Then the system should meet business needs",
                            "Given the system is implemented, When tested thoroughly, Then it should work as expected"
                        ]
                    }]
                }
                
        except Exception as e:
            logger.error(f"Error extracting stories with criteria from text: {e}")
            return {
                "stories": [{
                    "story": "As a user, I want to implement the requirements so that the system meets the business needs.",
                    "acceptance_criteria": [
                        "Given the requirements are clear, When implemented correctly, Then the system should meet business needs"
                    ]
                }]
            }
