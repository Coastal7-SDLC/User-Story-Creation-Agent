"""
Main FastAPI application for the User Story Creation Agent.
"""
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
import logging
import json
import traceback
import io
import os

from .config import settings
from .services import OpenRouterService
from .jira_service import JiraService
from .mongodb_service import MongoDBService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="AI-powered user story generation from business requirements with Jira integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
try:
    openrouter_service = OpenRouterService()
    logger.info("✅ OpenRouter service initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize OpenRouter service: {e}")
    openrouter_service = None

try:
    mongodb_service = MongoDBService()
    logger.info("✅ MongoDB service initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize MongoDB service: {e}")
    mongodb_service = None

try:
    jira_service = JiraService()
    logger.info("✅ Jira service initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize Jira service: {e}")
    jira_service = None


@app.get("/", response_model=dict)
async def root():
    """Root endpoint with API information."""
    return {
        "message": "User Story Creation Agent API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "status": "running"
    }


@app.get("/health", response_model=dict)
async def health_check():
    """Health check endpoint."""
    try:
        # Test OpenRouter service
        if openrouter_service is None:
            return {
                "status": "unhealthy",
                "api": "disconnected",
                "error": "OpenRouter service not initialized",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # Test MongoDB service
        mongodb_status = "connected" if mongodb_service else "disconnected"
        
        # Test Jira service
        jira_status = "connected" if jira_service else "disconnected"
        
        return {
            "status": "healthy",
            "api": "connected",
            "model": settings.openrouter_model,
            "mongodb": mongodb_status,
            "jira": jira_status,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "api": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@app.get("/test-download")
async def test_download():
    """Test download endpoint."""
    try:
        content = "Test file content\nThis is a test download."
        return StreamingResponse(
            io.BytesIO(content.encode('utf-8')),
            media_type="text/plain",
            headers={"Content-Disposition": "attachment; filename=test.txt"}
        )
    except Exception as e:
        logger.error(f"Test download failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-user-stories")
async def generate_user_stories(request: Request):
    """
    Generate user stories from business requirements using AI.
    
    This endpoint takes project requirements and uses OpenRouter API to generate
    actionable user stories in the format: "As a <role>, I want <feature> so that <reason>."
    
    Args:
        request: FastAPI request object containing JSON data
        
    Returns:
        JSON response with generated user stories
        
    Raises:
        HTTPException: If generation fails or requirements are invalid
    """
    try:
        # Check if service is available
        if openrouter_service is None:
            raise HTTPException(
                status_code=503, 
                detail="OpenRouter service is not available. Please check your configuration."
            )
        
        # Parse request body
        try:
            body = await request.json()
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON in request body")
        
        # Validate request
        if not body:
            raise HTTPException(status_code=422, detail="Request body is empty")
        
        if "requirements" not in body:
            raise HTTPException(status_code=422, detail="Missing 'requirements' field")
        
        requirements = body["requirements"]
        if not requirements or not isinstance(requirements, str):
            raise HTTPException(status_code=422, detail="Requirements must be a non-empty string")
        
        if len(requirements.strip()) < 10:
            raise HTTPException(
                status_code=422, 
                detail="Requirements must be at least 10 characters long"
            )
        
        logger.info(f"Generating user stories for requirements: {requirements[:100]}...")
        
        # Generate user stories using OpenRouter (synchronous call)
        try:
            result = openrouter_service.generate_user_stories(requirements)
            
            if not result or "stories" not in result or len(result["stories"]) == 0:
                raise Exception("No user stories were generated")
            
            logger.info(f"Successfully generated {len(result['stories'])} user stories with acceptance criteria")
            
            # Save to MongoDB if available
            story_id = None
            if mongodb_service:
                try:
                    response_data = {
                        "user_stories": result["stories"],
                        "requirements": requirements,
                        "created_at": datetime.utcnow().isoformat(),
                        "model": settings.openrouter_model,
                        "status": "success"
                    }
                    story_id = await mongodb_service.save_user_stories(response_data)
                    logger.info(f"✅ Saved user stories to MongoDB with ID: {story_id}")
                except Exception as db_error:
                    logger.warning(f"⚠️ Failed to save to MongoDB: {db_error}")
                    story_id = f"story_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            else:
                story_id = f"story_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            
            # Return response
            response_data = {
                "user_stories": result["stories"],
                "id": story_id,
                "created_at": datetime.utcnow().isoformat(),
                "model": settings.openrouter_model,
                "status": "success"
            }
            
            return JSONResponse(content=response_data)
            
        except Exception as api_error:
            logger.error(f"OpenRouter API error: {api_error}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to generate user stories: {str(api_error)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error generating user stories: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )


@app.post("/analyze-requirements")
async def analyze_requirements(request: Request):
    """
    Analyze project requirements and estimate the number of user stories that will be generated.
    
    Args:
        request: FastAPI request object containing JSON data with requirements
        
    Returns:
        JSON response with analysis results and estimated story count
    """
    try:
        # Check if service is available
        if openrouter_service is None:
            raise HTTPException(
                status_code=503, 
                detail="OpenRouter service is not available. Please check your configuration."
            )
        
        # Parse request body
        try:
            body = await request.json()
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON in request body")
        
        # Validate request
        if not body:
            raise HTTPException(status_code=422, detail="Request body is empty")
        
        if "requirements" not in body:
            raise HTTPException(status_code=422, detail="Missing 'requirements' field")
        
        requirements = body["requirements"]
        if not requirements or not isinstance(requirements, str):
            raise HTTPException(status_code=422, detail="Requirements must be a non-empty string")
        
        if len(requirements.strip()) < 10:
            raise HTTPException(
                status_code=422, 
                detail="Requirements must be at least 10 characters long"
            )
        
        logger.info(f"Analyzing requirements: {requirements[:100]}...")
        
        # Analyze requirements complexity
        word_count = len(requirements.split())
        sentence_count = len([s for s in requirements.split('.') if s.strip()])
        
        # Estimate complexity based on content analysis
        complexity_score = 0
        
        # Simple heuristics for complexity estimation
        if word_count < 50:
            complexity_score = 1  # Simple
        elif word_count < 150:
            complexity_score = 2  # Medium
        elif word_count < 300:
            complexity_score = 3  # Complex
        else:
            complexity_score = 4  # Very Complex
        
        # Adjust based on technical terms and features mentioned
        technical_terms = ['api', 'database', 'authentication', 'authorization', 'integration', 'workflow', 'reporting', 'dashboard', 'notification', 'payment', 'search', 'filter', 'export', 'import']
        feature_count = sum(1 for term in technical_terms if term.lower() in requirements.lower())
        
        if feature_count > 5:
            complexity_score = min(4, complexity_score + 1)
        elif feature_count > 2:
            complexity_score = min(4, complexity_score + 0.5)
        
        # Estimate story count based on complexity
        story_estimates = {
            1: {"min": 2, "max": 4, "complexity": "Simple"},
            2: {"min": 4, "max": 6, "complexity": "Medium"},
            3: {"min": 6, "max": 10, "complexity": "Complex"},
            4: {"min": 8, "max": 15, "complexity": "Very Complex"}
        }
        
        estimate = story_estimates.get(complexity_score, {"min": 4, "max": 8, "complexity": "Medium"})
        
        analysis_result = {
            "requirements_analysis": {
                "word_count": word_count,
                "sentence_count": sentence_count,
                "estimated_complexity": estimate["complexity"],
                "complexity_score": complexity_score,
                "feature_indicators": feature_count
            },
            "story_estimation": {
                "estimated_min_stories": estimate["min"],
                "estimated_max_stories": estimate["max"],
                "recommended_approach": f"Based on the complexity, expect {estimate['min']}-{estimate['max']} user stories"
            },
            "analysis_timestamp": datetime.utcnow().isoformat(),
            "status": "success"
        }
        
        logger.info(f"Requirements analysis completed: {estimate['complexity']} complexity, {estimate['min']}-{estimate['max']} stories estimated")
        
        return JSONResponse(content=analysis_result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error analyzing requirements: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled exceptions."""
    logger.error(f"Unhandled exception: {exc}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error", 
            "error_code": "INTERNAL_ERROR",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@app.post("/download-user-stories")
async def download_user_stories(request: Request):
    """
    Download user stories in different formats (TXT, MD, PDF).
    
    Args:
        request: FastAPI request object containing JSON data with user stories and format
        
    Returns:
        JSON response with file content and metadata
    """
    try:
        logger.info("Download endpoint called")
        
        # Parse request body
        try:
            body = await request.json()
            logger.info(f"Request body parsed successfully")
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            raise HTTPException(status_code=400, detail="Invalid JSON in request body")
        
        # Validate request
        if not body:
            logger.error("Empty request body")
            raise HTTPException(status_code=422, detail="Request body is empty")
        
        if "user_stories" not in body:
            logger.error("Missing user_stories field")
            raise HTTPException(status_code=422, detail="Missing 'user_stories' field")
        
        if "format" not in body:
            logger.error("Missing format field")
            raise HTTPException(status_code=422, detail="Missing 'format' field")
        
        user_stories = body["user_stories"]
        format_type = body["format"].lower()
        
        logger.info(f"Processing {len(user_stories)} stories in {format_type} format")
        
        if not user_stories or not isinstance(user_stories, list):
            logger.error("Invalid user_stories format")
            raise HTTPException(status_code=422, detail="User stories must be a non-empty list")
        
        if format_type not in ["txt", "md", "pdf"]:
            logger.error(f"Invalid format: {format_type}")
            raise HTTPException(status_code=422, detail="Format must be 'txt', 'md', or 'pdf'")
        
        # Generate filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"user_stories_{timestamp}.{format_type}"
        logger.info(f"Generated filename: {filename}")
        
        # Create content based on format
        if format_type == "txt":
            logger.info("Creating TXT content")
            content = "USER STORIES\n"
            content += "=" * 50 + "\n\n"
            for i, story in enumerate(user_stories, 1):
                # Handle both string and object formats
                story_text = story if isinstance(story, str) else story.get("story", str(story))
                content += f"{i}. {story_text}\n\n"
                
                # Add acceptance criteria if available
                if isinstance(story, dict) and "acceptance_criteria" in story and story["acceptance_criteria"]:
                    content += "   Acceptance Criteria:\n"
                    for j, criteria in enumerate(story["acceptance_criteria"], 1):
                        content += f"   {j}. {criteria}\n"
                    content += "\n"
            
            logger.info("TXT content created successfully")
            return JSONResponse(content={
                "content": content,
                "filename": filename,
                "format": "txt",
                "mime_type": "text/plain"
            })
        
        elif format_type == "md":
            logger.info("Creating MD content with criteria")
            content = "# User Stories with Acceptance Criteria\n\n"
            content += f"*Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}*\n\n"
            content += "---\n\n"
            
            for i, story in enumerate(user_stories, 1):
                # Handle both string and object formats
                story_text = story if isinstance(story, str) else story.get("story", str(story))
                content += f"## {i}. {story_text}\n\n"
                
                # Add acceptance criteria if available
                if isinstance(story, dict) and "acceptance_criteria" in story and story["acceptance_criteria"]:
                    content += "### Acceptance Criteria:\n\n"
                    for j, criteria in enumerate(story["acceptance_criteria"], 1):
                        content += f"{j}. {criteria}\n"
                    content += "\n"
                content += "---\n\n"
            
            return JSONResponse(content={
                "content": content,
                "filename": filename,
                "format": "md",
                "mime_type": "text/markdown"
            })
        
        elif format_type == "pdf":
            try:
                # Import reportlab for PDF generation
                from reportlab.lib.pagesizes import letter
                from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
                from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                from reportlab.lib.units import inch
                
                # Create PDF content
                buffer = io.BytesIO()
                doc = SimpleDocTemplate(buffer, pagesize=letter)
                story = []
                
                # Styles
                styles = getSampleStyleSheet()
                title_style = ParagraphStyle(
                    'CustomTitle',
                    parent=styles['Heading1'],
                    fontSize=16,
                    spaceAfter=30,
                    alignment=1  # Center alignment
                )
                story_style = ParagraphStyle(
                    'CustomStory',
                    parent=styles['Normal'],
                    fontSize=12,
                    spaceAfter=20,
                    leftIndent=20
                )
                criteria_style = ParagraphStyle(
                    'CustomCriteria',
                    parent=styles['Normal'],
                    fontSize=11,
                    spaceAfter=15,
                    leftIndent=40,
                    bulletIndent=20
                )
                
                # Title
                story.append(Paragraph("USER STORIES WITH ACCEPTANCE CRITERIA", title_style))
                story.append(Spacer(1, 20))
                
                # Date
                date_text = f"Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"
                story.append(Paragraph(date_text, styles['Normal']))
                story.append(Spacer(1, 30))
                
                # User stories
                for i, user_story in enumerate(user_stories, 1):
                    # Handle both string and object formats
                    story_text_content = user_story if isinstance(user_story, str) else user_story.get("story", str(user_story))
                    story_text = f"{i}. {story_text_content}"
                    story.append(Paragraph(story_text, story_style))
                    
                    # Add acceptance criteria if available
                    if isinstance(user_story, dict) and "acceptance_criteria" in user_story and user_story["acceptance_criteria"]:
                        story.append(Paragraph("Acceptance Criteria:", styles['Heading3']))
                        for j, criteria in enumerate(user_story["acceptance_criteria"], 1):
                            criteria_text = f"• {criteria}"
                            story.append(Paragraph(criteria_text, criteria_style))
                    
                    story.append(Spacer(1, 20))
                
                # Build PDF
                doc.build(story)
                buffer.seek(0)
                
                # Return PDF as base64 encoded string
                import base64
                pdf_content = base64.b64encode(buffer.getvalue()).decode('utf-8')
                
                return JSONResponse(content={
                    "content": pdf_content,
                    "filename": filename,
                    "format": "pdf",
                    "mime_type": "application/pdf",
                    "encoding": "base64"
                })
                
            except ImportError:
                raise HTTPException(
                    status_code=500, 
                    detail="PDF generation requires reportlab library. Please install it with: pip install reportlab"
                )
            except Exception as e:
                logger.error(f"PDF generation error: {e}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"PDF generation failed: {str(e)}"
                )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading user stories: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download user stories: {str(e)}"
        )


# ============================================================================
# JIRA INTEGRATION ENDPOINTS
# ============================================================================

@app.get("/jira/health", response_model=dict)
async def jira_health_check():
    """Health check for Jira service."""
    try:
        if jira_service is None:
            return {
                "status": "unhealthy",
                "service": "jira",
                "error": "Jira service not initialized",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # Test Jira connection
        health_result = jira_service.health_check()
        
        if health_result["status"] == "healthy":
            return {
                "status": "healthy",
                "service": "jira",
                "connection": "connected",
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            return {
                "status": "unhealthy",
                "service": "jira",
                "connection": "failed",
                "timestamp": datetime.utcnow().isoformat()
            }
            
    except Exception as e:
        logger.error(f"Jira health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "jira",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@app.get("/jira/projects", response_model=dict)
async def get_jira_projects():
    """Get all accessible Jira projects."""
    try:
        if jira_service is None:
            raise HTTPException(
                status_code=503,
                detail="Jira service is not available. Please check your configuration."
            )
        
        projects = jira_service.get_projects()
        
        return {
            "status": "success",
            "projects": projects,
            "count": len(projects),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching Jira projects: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch Jira projects: {str(e)}"
        )


@app.get("/jira/projects/{project_key}", response_model=dict)
async def get_jira_project_details(project_key: str):
    """Get detailed information about a specific Jira project."""
    try:
        if jira_service is None:
            raise HTTPException(
                status_code=503,
                detail="Jira service is not available. Please check your configuration."
            )
        
        project_details = jira_service.get_project_details(project_key)
        
        return {
            "status": "success",
            "project": project_details,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching project details for {project_key}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch project details: {str(e)}"
        )


@app.get("/jira/projects/{project_key}/issue-types", response_model=dict)
async def get_jira_issue_types(project_key: str):
    """Get available issue types for a specific project."""
    try:
        if jira_service is None:
            raise HTTPException(
                status_code=503,
                detail="Jira service is not available. Please check your configuration."
            )
        
        issue_types = jira_service.get_issue_types(project_key)
        
        return {
            "status": "success",
            "project_key": project_key,
            "issue_types": issue_types,
            "count": len(issue_types),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching issue types for {project_key}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch issue types: {str(e)}"
        )


@app.post("/jira/export-stories", response_model=dict)
async def export_stories_to_jira(request: Request):
    """
    Export user stories to Jira.
    
    This endpoint takes generated user stories and creates them as issues in Jira,
    optionally creating an epic to group related stories.
    """
    try:
        if jira_service is None:
            raise HTTPException(
                status_code=503,
                detail="Jira service is not available. Please check your configuration."
            )
        
        # Parse request body
        try:
            body = await request.json()
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON in request body")
        
        # Validate request
        if not body:
            raise HTTPException(status_code=422, detail="Request body is empty")
        
        if "stories" not in body:
            raise HTTPException(status_code=422, detail="Missing 'stories' field")
        
        if "project_key" not in body:
            raise HTTPException(status_code=422, detail="Missing 'project_key' field")
        
        stories = body["stories"]
        project_key = body["project_key"]
        create_epic = body.get("create_epic", True)
        epic_name = body.get("epic_name", "User Stories")
        
        if not stories or not isinstance(stories, list):
            raise HTTPException(status_code=422, detail="Stories must be a non-empty list")
        
        if not project_key or not isinstance(project_key, str):
            raise HTTPException(status_code=422, detail="Project key must be a non-empty string")
        
        logger.info(f"Exporting {len(stories)} stories to Jira project: {project_key}")
        
        # Export stories to Jira
        export_result = jira_service.export_stories_to_jira(
            stories=stories,
            project_key=project_key,
            create_epic=create_epic,
            epic_name=epic_name
        )
        
        logger.info(f"Successfully exported {export_result['total_exported']} stories to Jira")
        
        return {
            "status": "success",
            "message": f"Exported {export_result['total_exported']} stories to Jira",
            "export_result": export_result,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting stories to Jira: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export stories to Jira: {str(e)}"
        )


@app.get("/jira/issues/{issue_key}", response_model=dict)
async def get_jira_issue_details(issue_key: str):
    """Get detailed information about a Jira issue."""
    try:
        if jira_service is None:
            raise HTTPException(
                status_code=503,
                detail="Jira service is not available. Please check your configuration."
            )
        
        issue_details = jira_service.get_issue_details(issue_key)
        
        return {
            "status": "success",
            "issue": issue_details,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching issue details for {issue_key}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch issue details: {str(e)}"
        )


# MongoDB endpoints
@app.get("/user-stories")
async def get_user_stories(skip: int = 0, limit: int = 10):
    """Get all user stories with pagination."""
    if not mongodb_service:
        raise HTTPException(status_code=503, detail="MongoDB service not available")
    
    try:
        stories = await mongodb_service.get_user_stories(skip, limit)
        return {"stories": stories, "skip": skip, "limit": limit}
    except Exception as e:
        logger.error(f"Error fetching user stories: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user stories: {str(e)}")


@app.get("/user-stories/{story_id}")
async def get_user_story(story_id: str):
    """Get a specific user story by ID."""
    if not mongodb_service:
        raise HTTPException(status_code=503, detail="MongoDB service not available")
    
    try:
        story = await mongodb_service.get_user_story_by_id(story_id)
        if not story:
            raise HTTPException(status_code=404, detail="User story not found")
        return {"story": story}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user story {story_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user story: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
