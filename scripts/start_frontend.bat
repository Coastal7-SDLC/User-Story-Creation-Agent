@echo off
echo Starting User Story Creation Agent Frontend...
echo.

cd frontend

echo Installing dependencies...
npm install

echo.
echo Please make sure to:
echo 1. Copy env.example to .env
echo 2. Update .env with your backend API URL (default: http://localhost:8000)
echo 3. Ensure the backend server is running
echo.

echo Starting React development server...
npm start

pause
