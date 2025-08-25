# User Story Creation Agent

An AI-powered web application that generates user stories and acceptance criteria from business requirements using OpenRouter API, with seamless Jira integration for Agile development workflows.

## 🚀 Features

- **AI-Powered Generation**: Uses Meta Llama 3.3 70B model via OpenRouter API
- **Multiple Export Formats**: Download user stories in TXT, Markdown, and PDF formats
- **Acceptance Criteria**: Automatically generates acceptance criteria for each user story
- **Jira Integration**: Export generated stories directly to Jira with epic creation
- **Modern UI**: Clean, responsive React frontend with Tailwind CSS
- **RESTful API**: FastAPI backend with comprehensive documentation
- **Docker Support**: Containerized deployment with Docker Compose

## 📁 Project Structure

```
user-story-creation-agent/
├── backend/                 # FastAPI backend
│   ├── app/                # Application code
│   │   ├── __init__.py
│   │   ├── main.py         # FastAPI application
│   │   ├── config.py       # Configuration settings
│   │   └── services.py     # OpenRouter service
│   ├── requirements.txt    # Python dependencies
│   ├── env.example         # Environment variables template
│   ├── Dockerfile          # Backend container
│   └── init-mongo.js       # MongoDB initialization
├── frontend/               # React frontend
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── index.js       # Application entry point
│   ├── public/            # Static assets
│   ├── package.json       # Node.js dependencies
│   ├── Dockerfile         # Frontend container
│   └── nginx.conf         # Nginx configuration
├── scripts/               # Startup scripts
│   ├── start_backend.bat
│   ├── start_frontend.bat
│   └── start_with_docker.bat
├── docker-compose.yml     # Docker Compose configuration
├── .dockerignore          # Docker ignore file
├── README.md              # This file
└── SETUP.md               # Detailed setup instructions
```

## 🛠️ Quick Start

### Prerequisites

- Python 3.11+ (3.13 recommended)
- Node.js 18+
- Docker (optional)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd user-story-creation-agent
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 3. Environment Configuration

```bash
# Copy environment template
copy env.example .env

# Edit .env with your OpenRouter API key
OPENROUTER_API_KEY=your_api_key_here
```

### 4. Frontend Setup

```bash
cd ../frontend
npm install
```

### 5. Start the Application

#### Option A: Using Scripts (Recommended)
```bash
# Start backend
scripts\start_backend.bat

# Start frontend (in new terminal)
scripts\start_frontend.bat
```

#### Option B: Manual Start
```bash
# Backend
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm start
```

#### Option C: Docker
```bash
scripts\start_with_docker.bat
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📖 Usage

1. **Enter Requirements**: Describe your project requirements in the text area
2. **Generate Stories**: Click "Generate Stories" to create user stories
3. **Review Results**: View generated stories with acceptance criteria
4. **Export**: Download in TXT, Markdown, or PDF format

## 🔗 Jira Integration

The application includes seamless Jira integration to streamline your Agile development workflow:

### Features
- **Direct Export**: Export generated user stories directly to Jira
- **Epic Creation**: Automatically create epics to group related stories
- **Project Selection**: Choose from available Jira projects
- **Real-time Status**: Monitor export progress and connection health
- **Error Handling**: Comprehensive error handling and user feedback

### Setup
1. **Get Jira API Token**:
   - Go to your Jira profile settings
   - Generate an API token
   - Note your Jira instance URL

2. **Configure Environment**:
   ```bash
   # Add to your .env file
   JIRA_URL=https://yourcompany.atlassian.net
   JIRA_USERNAME=your-email@company.com
   JIRA_API_TOKEN=your-api-token
   JIRA_PROJECT_KEY=PROJ
   ```

3. **Export Workflow**:
   - Generate user stories using AI
   - Select target Jira project
   - Choose epic creation options
   - Export stories with one click

### Jira API Endpoints
- `GET /jira/health` - Jira service health check
- `GET /jira/projects` - List available Jira projects
- `POST /jira/export-stories` - Export stories to Jira
- `GET /jira/issues/{key}` - Get Jira issue details

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | Yes |
| `MONGODB_URI` | MongoDB connection string | No |
| `OPENROUTER_MODEL` | AI model to use | No (default: meta-llama/llama-3.3-70b-instruct:free) |
| `JIRA_URL` | Your Jira instance URL | Yes (for Jira integration) |
| `JIRA_USERNAME` | Your Jira username/email | Yes (for Jira integration) |
| `JIRA_API_TOKEN` | Your Jira API token | Yes (for Jira integration) |
| `JIRA_PROJECT_KEY` | Default Jira project key | No (for Jira integration) |

### API Endpoints

- `POST /generate-user-stories` - Generate user stories from requirements
- `POST /download-user-stories` - Download stories in various formats
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📝 Development

### Backend Development

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For detailed setup instructions and troubleshooting, see [SETUP.md](SETUP.md).

---

**Built with ❤️ using FastAPI, React, and OpenRouter API**
