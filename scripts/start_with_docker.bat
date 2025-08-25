@echo off
echo ========================================
echo Starting User Story Creation Agent with Docker
echo ========================================
echo.

echo This will start the entire application using Docker
echo This avoids Python 3.13 compatibility issues
echo.

echo Checking if Docker is installed...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)
echo Docker is available.
echo.

echo Checking if docker-compose is available...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: docker-compose is not available
    echo Please ensure Docker Desktop is running
    pause
    exit /b 1
)
echo docker-compose is available.
echo.

echo Setting up environment variables...
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit .env file with your:
    echo - MongoDB URI (or use local MongoDB that will be started)
    echo - OpenRouter API key
    echo.
    echo Press any key to continue after editing .env...
    pause
) else (
    echo .env file already exists.
)
echo.

echo Starting services with Docker Compose...
echo This will start:
echo - Backend (FastAPI) on http://localhost:8000
echo - Frontend (React) on http://localhost:3000
echo - MongoDB on localhost:27017
echo.

docker-compose up --build
echo.

echo Services stopped. To start again, run: docker-compose up
pause
