# 🚀 Quick Test Guide - Enhanced Jira Export

This guide will help you quickly test the enhanced Jira task creation features.

## ⚡ **Quick Start (5 minutes)**

### **1. Configure Environment**
```bash
# Copy environment template
cd backend
copy env.example .env

# Edit .env with your Jira details
JIRA_URL=https://yourcompany.atlassian.net
JIRA_USERNAME=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token-here
JIRA_PROJECT_KEY=PROJ
```

### **2. Test Story Point Estimation**
```bash
# Test the story point calculation logic
python test_jira_export.py
```

**Expected Output:**
```
🧮 Testing Story Point Estimation
========================================
Story 1: 3 points
   Text length: 12 characters
   Criteria count: 1

Story 2: 7 points
   Text length: 89 characters
   Criteria count: 4

Story 3: 11 points
   Text length: 108 characters
   Criteria count: 7
```

### **3. Test Jira Connection**
```bash
# Test if Jira is accessible
curl http://localhost:8000/jira/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "method": "official_library",
  "message": "Jira service is working correctly"
}
```

## 🧪 **Full Export Test**

### **1. Start Backend**
```bash
# Start your backend server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **2. Test Complete Workflow**
```bash
# Run the full test suite
python test_jira_export.py
```

**What Gets Tested:**
- ✅ Jira service initialization
- ✅ Health check
- ✅ Project loading
- ✅ Epic creation
- ✅ Individual story creation
- ✅ Bulk export
- ✅ Story point estimation

## 📱 **Frontend Testing**

### **1. Start Frontend**
```bash
cd frontend
npm start
```

### **2. Test PDF Upload**
1. Upload a PDF with requirements
2. Generate user stories
3. Click "Export to Jira"
4. Select project and configure epic
5. Click export

### **3. Verify in Jira**
Check your Jira project for:
- **Epic task** with high priority
- **User story tasks** with medium priority
- **Labels** like "user-story", "ai-generated"
- **Story points** (3-13 range)
- **Components** assigned to "General"

## 🔧 **Customization Testing**

### **1. Test Priority Changes**
```python
# In jira_service.py, change priority
"priority": {"name": "High"},  # Change from "Medium"
```

### **2. Test Custom Labels**
```python
# In config.py, add custom labels
JIRA_DEFAULT_LABELS = ["user-story", "ai-generated", "frontend", "sprint-1"]
```

### **3. Test Component Assignment**
```python
# In config.py, change default component
JIRA_DEFAULT_COMPONENT = "Frontend"  # Change from "General"
```

## 📊 **Expected Results**

### **Task in Jira Will Look Like:**
```
Issue Key: PROJ-124
Type: Task
Summary: As a user, I want to log in to access my account
Priority: Medium
Labels: user-story, ai-generated, requirements
Components: General
Story Points: 5
Description:
**User Story:**
As a user, I want to log in to access my account

**Acceptance Criteria:**
1. User can enter email and password
2. System validates credentials
3. User is redirected to dashboard on success
```

### **Epic Task Will Look Like:**
```
Issue Key: PROJ-123
Type: Task
Summary: User Authentication Stories
Priority: High
Labels: epic, ai-generated, requirements, parent-task
Components: General
Description: Parent task containing 3 user stories
```

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Jira service not available"**
   - Check your `.env` file
   - Verify Jira credentials
   - Ensure Jira URL is accessible

2. **"Failed to fetch projects"**
   - Check Jira API token permissions
   - Verify project key exists
   - Check network connectivity

3. **"Failed to create issue"**
   - Verify issue type "Task" exists
   - Check field permissions
   - Ensure required fields are filled

### **Debug Mode:**
```python
# In config.py
DEBUG = True

# In jira_service.py
logger.setLevel(logging.DEBUG)
```

## 🎯 **Success Criteria**

Your test is successful when:
- ✅ Story point estimation works (3-13 points)
- ✅ Tasks are created in Jira with all fields
- ✅ Epic is created as parent task
- ✅ All stories have proper labels and components
- ✅ Priority levels are set correctly
- ✅ Story points are calculated and assigned

## 🎉 **Next Steps**

After successful testing:
1. **Customize priorities** based on your needs
2. **Add custom labels** for your workflow
3. **Configure components** for your team structure
4. **Adjust story points** calculation logic
5. **Set up epic linking** if supported

**You now have a professional, production-ready Jira export system!** 🚀

## 📞 **Need Help?**

- Check the logs in your terminal
- Verify Jira configuration
- Review the `JIRA_CUSTOMIZATION.md` guide
- Test individual components step by step
