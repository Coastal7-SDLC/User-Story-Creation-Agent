# Jira Task Customization Guide

This guide explains how to customize the Jira task creation in your User Story Creation Agent project.

## 🎯 **What Gets Created in Jira**

### **Default Task Fields**
When you export user stories to Jira, each story becomes a **Task** with the following fields:

| Field | Value | Description |
|-------|-------|-------------|
| **Issue Type** | Task | Standard work item type |
| **Summary** | User story text | The main user story description |
| **Description** | Formatted content | Story + Acceptance criteria |
| **Priority** | Medium | Default priority level |
| **Labels** | user-story, ai-generated, requirements | Categorization tags |
| **Components** | General | Default component assignment |
| **Story Points** | Auto-calculated | Estimated effort (3-13 points) |

### **Epic Fields (Parent Task)**
| Field | Value | Description |
|-------|-------|-------------|
| **Issue Type** | Task | Parent task for grouping |
| **Summary** | Epic name | User-defined epic name |
| **Description** | Epic description | Contains story count |
| **Priority** | High | Higher priority for epics |
| **Labels** | epic, ai-generated, requirements, parent-task | Epic-specific tags |

## 🔧 **Customizing Task Fields**

### **1. Story Point Estimation**

The system automatically estimates story points based on complexity:

```python
def _estimate_story_points(self, story_data: Dict[str, Any]) -> int:
    # Base points: 3
    base_points = 3
    
    # Adjust based on acceptance criteria count
    criteria_count = len(story_data.get("acceptance_criteria", []))
    if criteria_count <= 2:
        points = base_points
    elif criteria_count <= 4:
        points = base_points + 2
    elif criteria_count <= 6:
        points = base_points + 4
    else:
        points = base_points + 6
    
    # Adjust based on story length
    if len(story_data.get("story", "")) > 200:
        points += 1
    if len(story_data.get("story", "")) > 400:
        points += 1
    
    return min(points, 13)  # Cap at 13 points
```

**Customization Options:**
- **Change base points**: Modify `base_points = 3`
- **Adjust criteria weight**: Change the criteria count thresholds
- **Modify length factors**: Adjust the 200/400 character thresholds
- **Change maximum**: Modify the `min(points, 13)` cap

### **2. Priority Assignment**

Currently set to "Medium" for all stories. You can customize this:

```python
# In jira_service.py, modify the create_user_story method
"priority": {"name": "High"},  # Change to High, Medium, Low, or Highest
```

**Priority Options:**
- **Highest**: Critical features
- **High**: Important features
- **Medium**: Standard features (default)
- **Low**: Nice-to-have features
- **Lowest**: Optional features

### **3. Labels and Components**

Customize the automatic labels and components:

```python
# In config.py
JIRA_DEFAULT_LABELS = ["user-story", "ai-generated", "requirements", "your-custom-label"]
JIRA_DEFAULT_COMPONENT = "Frontend"  # Change from "General"
```

**Common Label Ideas:**
- `frontend`, `backend`, `database`
- `feature`, `bugfix`, `enhancement`
- `sprint-1`, `sprint-2`, `release-1.0`
- `high-priority`, `low-effort`

**Component Ideas:**
- `Frontend`, `Backend`, `API`, `Database`
- `Authentication`, `User Management`, `Reporting`
- `Mobile App`, `Web App`, `Admin Panel`

## 🚀 **Advanced Customizations**

### **1. Custom Field Mapping**

Map to your specific Jira custom fields:

```python
# In config.py
JIRA_STORY_POINTS_FIELD = "customfield_10016"  # Your story points field
JIRA_EPIC_LINK_FIELD = "customfield_10014"     # Your epic link field
JIRA_SPRINT_FIELD = "customfield_10020"        # Your sprint field
JIRA_EPIC_NAME_FIELD = "customfield_10015"     # Your epic name field
```

**How to Find Custom Field IDs:**
1. Go to Jira → Administration → Issues → Custom fields
2. Look for the field ID in the URL or field details
3. Common field IDs:
   - Story Points: `customfield_10016`
   - Epic Link: `customfield_10014`
   - Sprint: `customfield_10020`

### **2. Dynamic Priority Based on Content**

Make priority dynamic based on story content:

```python
def _determine_priority(self, story_data: Dict[str, Any]) -> str:
    story_text = story_data.get("story", "").lower()
    
    # High priority keywords
    if any(word in story_text for word in ["security", "login", "password", "critical"]):
        return "High"
    
    # Medium priority (default)
    return "Medium"
```

### **3. Smart Component Assignment**

Assign components based on story content:

```python
def _determine_component(self, story_data: Dict[str, Any]) -> str:
    story_text = story_data.get("story", "").lower()
    
    if any(word in story_text for word in ["login", "user", "profile", "dashboard"]):
        return "User Management"
    elif any(word in story_text for word in ["database", "data", "storage"]):
        return "Database"
    elif any(word in story_text for word in ["api", "endpoint", "service"]):
        return "API"
    else:
        return "General"
```

### **4. Sprint Assignment**

Automatically assign stories to sprints:

```python
# Add to issue_data in create_user_story
"customfield_10020": "Sprint 1"  # Your sprint field
```

## 📋 **Testing Your Customizations**

### **1. Run the Test Script**

```bash
cd backend
python test_jira_export.py
```

This will test:
- Story point estimation
- Task creation with custom fields
- Epic creation
- Bulk export functionality

### **2. Test Individual Components**

```python
# Test story point estimation
from jira_service import JiraService
jira_service = JiraService()

test_story = {
    "story": "Complex story with many requirements",
    "acceptance_criteria": ["Criteria 1", "Criteria 2", "Criteria 3", "Criteria 4"]
}

points = jira_service._estimate_story_points(test_story)
print(f"Estimated points: {points}")
```

### **3. Verify in Jira**

After export, check in Jira that:
- ✅ All custom fields are populated
- ✅ Priorities are set correctly
- ✅ Labels and components are assigned
- ✅ Story points are calculated
- ✅ Epic linking works (if enabled)

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **Custom fields not found**
   - Verify field IDs in Jira admin
   - Check field permissions for your user

2. **Priority not setting**
   - Ensure priority scheme is configured in Jira
   - Check if priority field is required

3. **Labels not applying**
   - Verify label field exists in your project
   - Check label permissions

4. **Story points not working**
   - Confirm story points field ID
   - Ensure field is numeric type

### **Debug Mode:**

Enable detailed logging:

```python
# In config.py
DEBUG = True

# In jira_service.py
logger.setLevel(logging.DEBUG)
```

## 🎉 **Example Custom Configuration**

Here's a complete example of a customized configuration:

```python
# config.py
JIRA_DEFAULT_PRIORITY = "High"
JIRA_DEFAULT_LABELS = ["user-story", "ai-generated", "frontend", "sprint-1"]
JIRA_DEFAULT_COMPONENT = "User Interface"
JIRA_STORY_POINTS_FIELD = "customfield_10016"
JIRA_EPIC_LINK_FIELD = "customfield_10014"

# jira_service.py
def _determine_priority(self, story_data):
    story_text = story_data.get("story", "").lower()
    if "security" in story_text or "login" in story_text:
        return "Highest"
    elif "critical" in story_text:
        return "High"
    return "Medium"

def _determine_component(self, story_data):
    story_text = story_data.get("story", "").lower()
    if "ui" in story_text or "interface" in story_text:
        return "User Interface"
    elif "api" in story_text:
        return "API"
    return "General"
```

This configuration will create professional, well-categorized tasks that your development team will love to work with! 🚀
