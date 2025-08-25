# Setup Guide - User Story Creation Agent

This guide will help you set up and run the User Story Creation Agent project on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Python 3.10+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 16+** - [Download Node.js](https://nodejs.org/)
- **npm** - Comes with Node.js
- **MongoDB** - Either local MongoDB or MongoDB Atlas account
- **OpenRouter API Key** - [Get API Key](https://openrouter.ai/)

## Quick Start (Windows)

1. **Clone or download the project**
2. **Start the Backend:**
   - Double-click `start_backend.bat`
   - Follow the prompts to set up environment variables

3. **Start the Frontend:**
   - Double-click `start_frontend.bat`
   - The React app will open in your browser

## Quick Start (Linux/Mac)

1. **Clone or download the project**
2. **Make scripts executable:**
   ```bash
   chmod +x start_backend.sh start_frontend.sh
   ```

3. **Start the Backend:**
   ```bash
   ./start_backend.sh
   ```

4. **Start the Frontend (in a new terminal):**
   ```bash
   ./start_frontend.sh
   ```

## Manual Setup

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/user_stories_db
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_MODEL=openai/gpt-4o
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   ```

6. **Start the server:**
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   REACT_APP_API_URL=http://localhost:8000
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

## Configuration

### MongoDB Setup

#### Option 1: MongoDB Atlas (Recommended)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string
5. Update `MONGODB_URI` in your `.env` file

#### Option 2: Local MongoDB

1. Install MongoDB on your system
2. Start the MongoDB service
3. Use connection string: `mongodb://localhost:27017/user_stories_db`

### OpenRouter Setup

1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Get your API key from the dashboard
3. Update `OPENROUTER_API_KEY` in your `.env` file
4. Optionally change the model (default: `openai/gpt-4o`)

## Testing the Application

1. **Backend Health Check:**
   - Visit: `http://localhost:8000/health`
   - Should return: `{"status": "healthy", "database": "connected"}`

2. **API Documentation:**
   - Visit: `http://localhost:8000/docs`
   - Interactive Swagger UI for testing endpoints

3. **Frontend Application:**
   - Visit: `http://localhost:3000`
   - Should show the User Story Creation Agent interface

## Usage

1. **Generate User Stories:**
   - Enter your project requirements in the text area
   - Click "Generate Stories"
   - View the generated user stories

2. **View History:**
   - Click "Generation History" to see previously generated stories
   - Click on any story to view its details

3. **Copy Stories:**
   - Use the copy buttons to copy individual or all stories
   - Stories are automatically saved to the database

## Troubleshooting

### Common Issues

1. **Backend won't start:**
   - Check if MongoDB is running
   - Verify your `.env` file configuration
   - Check if port 8000 is available

2. **Frontend won't start:**
   - Check if Node.js is installed
   - Verify your `.env` file configuration
   - Check if port 3000 is available

3. **API calls failing:**
   - Ensure backend is running on `http://localhost:8000`
   - Check browser console for CORS errors
   - Verify OpenRouter API key is valid

4. **Database connection issues:**
   - Check MongoDB connection string
   - Ensure network connectivity to MongoDB Atlas
   - Verify database user permissions

### Error Messages

- **"Failed to connect to MongoDB"**: Check your MongoDB URI and network connection
- **"Failed to generate user stories"**: Check your OpenRouter API key and model configuration
- **"No response from server"**: Ensure backend is running and accessible

## Development

### Project Structure

```
user-story-creation-agent/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI application
│   │   ├── models.py       # Pydantic models
│   │   ├── services.py     # Business logic
│   │   ├── database.py     # MongoDB connection
│   │   └── config.py       # Configuration
│   ├── requirements.txt
│   └── env.example
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   └── App.js         # Main app component
│   ├── package.json
│   └── env.example
└── README.md
```

### Adding Features

1. **Backend:**
   - Add new endpoints in `app/main.py`
   - Create new models in `app/models.py`
   - Add business logic in `app/services.py`

2. **Frontend:**
   - Create new components in `src/components/`
   - Add API calls in `src/services/api.js`
   - Update the main app in `src/App.js`

## Deployment

### Backend Deployment

The backend can be deployed to:
- **Heroku**: Use the provided `requirements.txt`
- **AWS Lambda**: Use serverless framework
- **Docker**: Create a Dockerfile
- **VPS**: Use gunicorn with nginx

### Frontend Deployment

The frontend can be deployed to:
- **Netlify**: Connect to your GitHub repository
- **Vercel**: Automatic deployment from Git
- **AWS S3**: Static website hosting
- **GitHub Pages**: Free hosting for static sites

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the error logs in the console
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed

## License

This project is licensed under the MIT License.
