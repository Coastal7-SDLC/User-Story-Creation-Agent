@echo off
echo Starting User Story Creation Agent Backend...
echo.

cd backend

echo Creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
echo Checking Python version...
python --version
echo.
echo Installing dependencies (this may take a few minutes)...
pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo Trying alternative requirements for Python 3.13...
    pip install -r requirements-python313.txt
)

echo.
echo Please make sure to:
echo 1. Copy env.example to .env
echo 2. Update .env with your MongoDB URI and OpenRouter API key
echo 3. Start MongoDB or have MongoDB Atlas connection ready
echo.

echo Starting FastAPI server...
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
