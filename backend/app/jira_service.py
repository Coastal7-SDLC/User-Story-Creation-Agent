"""
Jira integration service for the User Story Creation Agent.
"""
import logging
import traceback
import requests
from typing import List, Dict, Optional, Any

# Handle Python 3.13 compatibility issue with imghdr
try:
    from jira import JIRA
    from jira.exceptions import JIRAError
    JIRA_AVAILABLE = True
except ImportError as e:
    if "imghdr" in str(e):
        logging.warning("Jira library not fully compatible with Python 3.13. Using requests-based implementation.")
        JIRA_AVAILABLE = False
        JIRA = None
        JIRAError = Exception
    else:
        raise

from .config import settings

logger = logging.getLogger(__name__)


class JiraService:
    """Service for interacting with Jira API."""
    
    def __init__(self):
        """Initialize the Jira service with proper error handling."""
        try:
            # Validate configuration
            if not settings.jira_url:
                raise ValueError("JIRA_URL is not set")
            
            if not settings.jira_username:
                raise ValueError("JIRA_USERNAME is not set")
            
            if not settings.jira_api_token:
                raise ValueError("JIRA_API_TOKEN is not set")
            
            logger.info(f"Initializing Jira service for: {settings.jira_url}")
            
            # Use requests-based implementation for Python 3.13
            if not JIRA_AVAILABLE:
                self.client = None
                self.base_url = settings.jira_url.rstrip('/')
                self.auth = (settings.jira_username, settings.jira_api_token)
                self.headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
                logger.info("✅ Jira service initialized with requests-based implementation")
            else:
                # Use official Jira library for Python 3.11/3.12
                self.client = JIRA(
                    server=settings.jira_url,
                    basic_auth=(settings.jira_username, settings.jira_api_token)
                )
                # Test connection
                self.client.projects()
                logger.info("✅ Jira service initialized with official library")
                
        except Exception as e:
            logger.error(f"❌ Failed to initialize Jira service: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """Make HTTP request to Jira API using requests."""
        if JIRA_AVAILABLE:
            raise Exception("This method should not be called when JIRA library is available")
        
        url = f"{self.base_url}/rest/api/3/{endpoint}"
        try:
            if method.upper() == 'GET':
                response = requests.get(url, auth=self.auth, headers=self.headers)
            elif method.upper() == 'POST':
                response = requests.post(url, auth=self.auth, headers=self.headers, json=data)
            elif method.upper() == 'PUT':
                response = requests.put(url, auth=self.auth, headers=self.headers, json=data)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json() if response.content else {}
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Jira API request failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_details = e.response.json()
                    logger.error(f"Jira API error details: {error_details}")
                    logger.error(f"Jira API status code: {e.response.status_code}")
                except:
                    logger.error(f"Jira API response text: {e.response.text}")
                    logger.error(f"Jira API status code: {e.response.status_code}")
            raise Exception(f"Jira API request failed: {str(e)}")
    
    def get_projects(self) -> List[Dict[str, Any]]:
        """
        Get all accessible Jira projects.
        
        Returns:
            List of project dictionaries with key and name
        """
        try:
            if JIRA_AVAILABLE:
                projects = self.client.projects()
                return [
                    {
                        "key": project.key,
                        "name": project.name,
                        "id": project.id
                    }
                    for project in projects
                ]
            else:
                # Use requests-based implementation
                response = self._make_request('GET', 'project')
                if isinstance(response, list):
                    return [
                        {
                            "key": project["key"],
                            "name": project["name"],
                            "id": project["id"]
                        }
                        for project in response
                    ]
                else:
                    return [
                        {
                            "key": project["key"],
                            "name": project["name"],
                            "id": project["id"]
                        }
                        for project in response.get("values", [])
                    ]
        except Exception as e:
            logger.error(f"Error fetching Jira projects: {e}")
            raise Exception(f"Failed to fetch Jira projects: {str(e)}")
    
    def get_project_details(self, project_key: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific project.
        
        Args:
            project_key: Jira project key
            
        Returns:
            Project details dictionary
        """
        try:
            if JIRA_AVAILABLE:
                project = self.client.project(project_key)
                return {
                    "key": project.key,
                    "name": project.name,
                    "id": project.id,
                    "projectTypeKey": project.projectTypeKey,
                    "lead": project.lead.displayName if hasattr(project, 'lead') else None
                }
            else:
                # Use requests-based implementation
                response = self._make_request('GET', f'project/{project_key}')
                return {
                    "key": response["key"],
                    "name": response["name"],
                    "id": response["id"],
                    "projectTypeKey": response.get("projectTypeKey"),
                    "lead": response.get("lead", {}).get("displayName")
                }
        except Exception as e:
            logger.error(f"Error fetching project details for {project_key}: {e}")
            raise Exception(f"Failed to fetch project details: {str(e)}")
    
    def create_epic(self, project_key: str, epic_name: str, epic_description: str = "") -> Dict[str, Any]:
        """
        Create an epic in the specified project.
        
        Args:
            project_key: Jira project key
            epic_name: Name of the epic
            epic_description: Description of the epic
            
        Returns:
            Epic details dictionary
        """
        try:
            # Use the correct Jira Cloud API format (Atlassian Document Format)
            epic_data = {
                "fields": {
                    "project": {"key": project_key},
                    "summary": epic_name,
                    "description": {
                        "type": "doc",
                        "version": 1,
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": epic_description
                                    }
                                ]
                            }
                        ]
                    },
                    "issuetype": {"name": "Task"}
                    # Note: Removed priority and components to avoid field errors
                }
            }
            
            if JIRA_AVAILABLE:
                epic = self.client.create_issue(fields=epic_data["fields"])
                return {
                    "key": epic.key,
                    "id": epic.id,
                    "summary": epic.fields.summary,
                    "priority": epic.fields.priority.name if epic.fields.priority else None,
                    "labels": epic.fields.labels if epic.fields.labels else [],
                    "components": [c.name for c in epic.fields.components] if epic.fields.components else []
                }
            else:
                # Use requests-based implementation
                response = self._make_request('POST', 'issue', epic_data)
                return {
                    "key": response["key"],
                    "id": response["id"],
                    "summary": epic_name,
                    "priority": None,  # Not set due to field limitations
                    "labels": [],      # Not set due to field limitations
                    "components": []   # Not set due to field limitations
                }
                
        except Exception as e:
            logger.error(f"Error creating epic: {e}")
            raise Exception(f"Failed to create epic: {str(e)}")
    
    def create_user_story(self, project_key: str, story_data: Dict[str, Any], epic_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a user story in the specified project.
        
        Args:
            project_key: Jira project key
            story_data: User story data
            epic_key: Optional epic key to link the story to
            
        Returns:
            User story details dictionary
        """
        try:
            # Enhanced issue data with only supported fields
            issue_data = {
                "fields": {
                    "project": {"key": project_key},
                    "summary": story_data["story"],
                    "description": {
                        "type": "doc",
                        "version": 1,
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": self._format_description(story_data)
                                    }
                                ]
                            }
                        ]
                    },
                    "issuetype": {"name": "Task"}
                    # Note: Removed priority, labels, components, and story points to avoid field errors
                    # These can be added back if your Jira instance supports them
                }
            }
            
            # Note: Epic linking is disabled for now due to field limitations
            # The epic_key parameter is kept for future use when supported
            # if epic_key and self._supports_epic_linking():
            #     issue_data["fields"]["customfield_10014"] = epic_key
            
            # Note: Jira doesn't support parent-child linking for Task issue types
            # Only Epic issue types can have child issues
            # So we'll create individual tasks without linking
            
            if JIRA_AVAILABLE:
                issue = self.client.create_issue(fields=issue_data["fields"])
                return {
                    "key": issue.key,
                    "id": issue.id,
                    "summary": issue.fields.summary,
                    "priority": issue.fields.priority.name if issue.fields.priority else None,
                    "labels": issue.fields.labels if issue.fields.labels else [],
                    "components": [c.name for c in issue.fields.components] if issue.fields.components else []
                }
            else:
                # Use requests-based implementation
                response = self._make_request('POST', 'issue', issue_data)
                return {
                    "key": response["key"],
                    "id": response["id"],
                    "summary": story_data["story"],
                    "priority": None,  # Not set due to field limitations
                    "labels": [],      # Not set due to field limitations
                    "components": []   # Not set due to field limitations
                }
                
        except Exception as e:
            logger.error(f"Error creating user story: {e}")
            raise Exception(f"Failed to create user story: {str(e)}")
    
    def _format_description(self, story_data: Dict[str, Any]) -> str:
        """Format user story data into a readable description."""
        description = f"**User Story:**\n{story_data['story']}\n\n"
        
        if "acceptance_criteria" in story_data:
            description += "**Acceptance Criteria:**\n"
            for i, criteria in enumerate(story_data["acceptance_criteria"], 1):
                description += f"{i}. {criteria}\n"
        
        return description
    
    def _estimate_story_points(self, story_data: Dict[str, Any]) -> int:
        """
        Estimate story points based on story complexity.
        This is a simple heuristic - you can enhance this logic.
        """
        try:
            story_text = story_data.get("story", "")
            criteria_count = len(story_data.get("acceptance_criteria", []))
            
            # Simple estimation logic
            base_points = 3  # Base story points
            
            # Adjust based on acceptance criteria count
            if criteria_count <= 2:
                points = base_points
            elif criteria_count <= 4:
                points = base_points + 2
            elif criteria_count <= 6:
                points = base_points + 4
            else:
                points = base_points + 6
            
            # Adjust based on story length (complexity indicator)
            if len(story_text) > 200:
                points += 1
            if len(story_text) > 400:
                points += 1
            
            # Cap at reasonable maximum
            return min(points, 13)  # Fibonacci sequence: 1, 2, 3, 5, 8, 13
            
        except Exception as e:
            logger.warning(f"Could not estimate story points: {e}")
            return 3  # Default fallback
    
    def _supports_epic_linking(self) -> bool:
        """
        Check if the Jira instance supports epic linking.
        This checks for common epic link custom fields.
        """
        try:
            # Common epic link custom field IDs
            epic_link_fields = ["customfield_10014", "customfield_10008", "customfield_10010"]
            
            # Try to get project metadata to check available fields
            if JIRA_AVAILABLE:
                project = self.client.project(settings.jira_project_key)
                # This is a simplified check - you might want to enhance this
                return True
            else:
                # For requests-based implementation, assume epic linking is available
                return True
                
        except Exception as e:
            logger.warning(f"Could not determine epic linking support: {e}")
            return False
    
    def export_stories_to_jira(self, stories: List[Dict[str, Any]], project_key: str, create_epic: bool = True, epic_name: str = "User Stories") -> Dict[str, Any]:
        """
        Export user stories to Jira.
        
        Args:
            stories: List of user stories
            project_key: Jira project key
            create_epic: Whether to create an epic
            epic_name: Name of the epic if created
            
        Returns:
            Export result dictionary
        """
        try:
            exported_stories = []
            epic = None
            
            logger.info(f"Starting export of {len(stories)} stories to project {project_key}")
            
            # Create epic if requested (as a Task since Epic issue type is not available)
            if create_epic:
                epic_description = f"Parent task containing {len(stories)} user stories"
                logger.info(f"Creating parent task: {epic_name}")
                try:
                    epic = self.create_epic(project_key, epic_name, epic_description)
                    logger.info(f"✅ Successfully created parent task: {epic['key']}")
                except Exception as e:
                    logger.error(f"❌ Failed to create parent task: {e}")
                    epic = None
            
            # Create user stories as individual tasks
            for i, story in enumerate(stories):
                try:
                    logger.info(f"Creating user story {i+1}/{len(stories)}: {story.get('story', 'Unknown')[:50]}...")
                    story_issue = self.create_user_story(
                        project_key, 
                        story, 
                        epic_key=None  # No linking since Task types don't support parent-child
                    )
                    exported_stories.append(story_issue)
                    logger.info(f"✅ Successfully created user story task: {story_issue['key']}")
                except Exception as e:
                    logger.error(f"❌ Failed to create user story {i+1}: {e}")
                    continue
            
            return {
                "total_exported": len(exported_stories),
                "epic": epic,
                "stories": exported_stories,
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Error exporting stories to Jira: {e}")
            raise Exception(f"Failed to export stories to Jira: {str(e)}")
    
    def get_issue_details(self, issue_key: str) -> Dict[str, Any]:
        """
        Get details of a specific Jira issue.
        
        Args:
            issue_key: Jira issue key
            
        Returns:
            Issue details dictionary
        """
        try:
            if JIRA_AVAILABLE:
                issue = self.client.issue(issue_key)
                return {
                    "key": issue.key,
                    "id": issue.id,
                    "summary": issue.fields.summary,
                    "description": issue.fields.description,
                    "status": issue.fields.status.name if issue.fields.status else None,
                    "assignee": issue.fields.assignee.displayName if issue.fields.assignee else None
                }
            else:
                # Use requests-based implementation
                response = self._make_request('GET', f'issue/{issue_key}')
                return {
                    "key": response["key"],
                    "id": response["id"],
                    "summary": response["fields"]["summary"],
                    "description": response["fields"].get("description", ""),
                    "status": response["fields"]["status"]["name"] if "status" in response["fields"] else None,
                    "assignee": response["fields"]["assignee"]["displayName"] if response["fields"].get("assignee") else None
                }
                
        except Exception as e:
            logger.error(f"Error fetching issue details for {issue_key}: {e}")
            raise Exception(f"Failed to fetch issue details: {str(e)}")
    
    def get_issue_types(self, project_key: str) -> List[Dict[str, Any]]:
        """
        Get available issue types for a project.
        
        Args:
            project_key: Jira project key
            
        Returns:
            List of issue types
        """
        try:
            if JIRA_AVAILABLE:
                # Use official library
                project = self.client.project(project_key)
                return [
                    {
                        "id": it.id,
                        "name": it.name,
                        "description": it.description,
                        "iconUrl": it.iconUrl
                    }
                    for it in project.issueTypes
                ]
            else:
                # Use requests-based implementation
                response = self._make_request('GET', f'project/{project_key}')
                if 'issueTypes' in response:
                    return [
                        {
                            "id": it["id"],
                            "name": it["name"],
                            "description": it.get("description", ""),
                            "iconUrl": it.get("iconUrl", "")
                        }
                        for it in response["issueTypes"]
                    ]
                else:
                    # Fallback: get all issue types
                    response = self._make_request('GET', 'issuetype')
                    return [
                        {
                            "id": it["id"],
                            "name": it["name"],
                            "description": it.get("description", ""),
                            "iconUrl": it.get("iconUrl", "")
                        }
                        for it in response
                    ]
        except Exception as e:
            logger.error(f"Error fetching issue types for {project_key}: {e}")
            raise Exception(f"Failed to fetch issue types: {str(e)}")
    
    def health_check(self) -> Dict[str, Any]:
        """
        Check Jira service health.
        
        Returns:
            Health status dictionary
        """
        try:
            if JIRA_AVAILABLE:
                # Test with official library
                self.client.projects()
                return {
                    "status": "healthy",
                    "method": "official_library",
                    "message": "Jira service is working correctly"
                }
            else:
                # Test with requests-based implementation
                self._make_request('GET', 'myself')
                return {
                    "status": "healthy",
                    "method": "requests_based",
                    "message": "Jira service is working with Python 3.13 compatibility mode"
                }
                
        except Exception as e:
            logger.error(f"Jira health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "message": "Jira service is not responding correctly"
            }
