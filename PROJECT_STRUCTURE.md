# Project Structure

This document provides a detailed overview of the User Story Creation Agent project structure.

## 📁 Root Directory

```
user-story-creation-agent/
├── backend/                 # FastAPI backend application
├── frontend/               # React frontend application
├── scripts/                # Startup and utility scripts
├── .dockerignore           # Docker ignore patterns
├── .gitignore              # Git ignore patterns
├── docker-compose.yml      # Docker Compose configuration
├── README.md               # Main project documentation
├── SETUP.md                # Detailed setup instructions
└── PROJECT_STRUCTURE.md    # This file
```

## 🐍 Backend Structure

```
backend/
├── app/                    # Main application package
│   ├── __init__.py         # Package initialization
│   ├── main.py            # FastAPI application entry point
│   ├── config.py          # Configuration settings
│   └── services.py        # OpenRouter API service
├── requirements.txt        # Python dependencies
├── env.example            # Environment variables template
├── Dockerfile             # Backend container definition
├── init-mongo.js          # MongoDB initialization script
└── venv/                  # Python virtual environment (gitignored)
```

### Backend Components

- **`app/main.py`**: FastAPI application with endpoints for user story generation and download
- **`app/config.py`**: Environment configuration and settings management
- **`app/services.py`**: OpenRouter API integration for AI-powered story generation
- **`requirements.txt`**: Python dependencies including FastAPI, uvicorn, openai, and reportlab

## ⚛️ Frontend Structure

```
frontend/
├── public/                # Static assets
│   ├── index.html         # Main HTML template
│   └── manifest.json      # Web app manifest
├── src/                   # React source code
│   ├── components/        # React components
│   │   ├── Header.js      # Application header
│   │   ├── HistoryPanel.js # Story history panel
│   │   ├── UserStoryForm.js # Story generation form
│   │   └── UserStoryList.js # Story display and download
│   ├── services/          # API services
│   │   └── api.js         # HTTP client and API functions
│   ├── App.js             # Main React application
│   ├── index.js           # Application entry point
│   └── index.css          # Global styles
├── package.json           # Node.js dependencies and scripts
├── package-lock.json      # Dependency lock file
├── Dockerfile             # Frontend container definition
├── nginx.conf             # Nginx configuration for production
├── postcss.config.js      # PostCSS configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── env.example            # Environment variables template
```

### Frontend Components

- **`UserStoryForm.js`**: Form for entering project requirements and generating stories
- **`UserStoryList.js`**: Display generated stories with download functionality
- **`Header.js`**: Application header with navigation
- **`HistoryPanel.js`**: Panel for viewing story generation history
- **`api.js`**: Centralized API service for backend communication

## 🔧 Scripts Directory

```
scripts/
├── start_backend.bat      # Start backend server
├── start_frontend.bat     # Start frontend development server
└── start_with_docker.bat  # Start application with Docker Compose
```

## 🐳 Docker Configuration

- **`docker-compose.yml`**: Multi-service container orchestration
- **`backend/Dockerfile`**: Backend container definition
- **`frontend/Dockerfile`**: Frontend container definition
- **`frontend/nginx.conf`**: Nginx configuration for production
- **`.dockerignore`**: Files to exclude from Docker builds

## 📄 Documentation

- **`README.md`**: Main project documentation with quick start guide
- **`SETUP.md`**: Detailed setup and configuration instructions
- **`PROJECT_STRUCTURE.md`**: This file - detailed structure overview

## 🔒 Environment Configuration

### Backend Environment Variables
```bash
OPENROUTER_API_KEY=your_api_key_here
MONGODB_URI=mongodb://localhost:27017/user_stories
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
```

### Frontend Environment Variables
```bash
REACT_APP_API_URL=http://localhost:8000
```

## 🚀 Key Features by Directory

### Backend Features
- **AI Integration**: OpenRouter API for story generation
- **Multiple Export Formats**: TXT, Markdown, and PDF generation
- **RESTful API**: FastAPI with automatic documentation
- **Health Monitoring**: Health check endpoints

### Frontend Features
- **Modern UI**: React with Tailwind CSS
- **Real-time Updates**: Live story generation
- **Download Options**: Multiple format downloads
- **Responsive Design**: Mobile-friendly interface

### Scripts Features
- **Easy Startup**: One-click application launch
- **Environment Management**: Automatic virtual environment activation
- **Docker Support**: Containerized deployment options

## 📊 File Size Overview

- **Backend**: ~50KB (excluding venv)
- **Frontend**: ~800KB (excluding node_modules)
- **Documentation**: ~15KB
- **Scripts**: ~3KB
- **Total**: ~868KB (clean project)

## 🔍 Development Workflow

1. **Setup**: Use scripts for easy environment setup
2. **Development**: Run backend and frontend separately for development
3. **Testing**: Use API documentation at `/docs` endpoint
4. **Deployment**: Use Docker Compose for production deployment
5. **Maintenance**: Follow the documented structure for updates

---

This structure provides a clean, maintainable, and scalable architecture for the User Story Creation Agent application.
