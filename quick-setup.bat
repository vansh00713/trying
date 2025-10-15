@echo off
echo.
echo ========================================
echo NASA Space Station AI Vision Hub
echo Quick Setup Script
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 16+ from https://nodejs.org
    pause
    exit /b 1
)

echo ✓ Python and Node.js are installed
echo.

REM Setup Backend
echo Setting up Backend...
cd backend

REM Create virtual environment
echo Creating Python virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)

REM Activate virtual environment and install dependencies
echo Installing Python dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

REM Create necessary directories
echo Creating data directories...
if not exist "uploads" mkdir uploads
if not exist "sorted" mkdir sorted
if not exist "data" mkdir data
if not exist "exports" mkdir exports
if not exist "gallery" mkdir gallery

echo ✓ Backend setup complete
echo.

REM Setup Frontend
echo Setting up Frontend...
cd ..\frontend

echo Installing Node.js dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo ✓ Frontend setup complete
echo.

REM Create start scripts
echo Creating start scripts...
cd ..

REM Create backend start script
echo @echo off > start-backend.bat
echo echo Starting NASA Space Station AI Vision Hub Backend... >> start-backend.bat
echo cd backend >> start-backend.bat
echo call venv\Scripts\activate.bat >> start-backend.bat
echo echo Backend server will start at http://localhost:8000 >> start-backend.bat
echo echo Press Ctrl+C to stop the server >> start-backend.bat
echo python app.py >> start-backend.bat
echo pause >> start-backend.bat

REM Create frontend start script
echo @echo off > start-frontend.bat
echo echo Starting NASA Space Station AI Vision Hub Frontend... >> start-frontend.bat
echo cd frontend >> start-frontend.bat
echo echo Frontend will start at http://localhost:3000 >> start-frontend.bat
echo echo Press Ctrl+C to stop the server >> start-frontend.bat
echo npm run dev >> start-frontend.bat
echo pause >> start-frontend.bat

REM Create combined start script
echo @echo off > start-all.bat
echo echo ======================================== >> start-all.bat
echo echo NASA Space Station AI Vision Hub >> start-all.bat
echo echo Starting both Backend and Frontend... >> start-all.bat
echo echo ======================================== >> start-all.bat
echo echo. >> start-all.bat
echo echo Backend: http://localhost:8000 >> start-all.bat
echo echo Frontend: http://localhost:3000 >> start-all.bat
echo echo Space Station Dashboard: http://localhost:3000/space-station >> start-all.bat
echo echo. >> start-all.bat
echo echo Press Ctrl+C in each window to stop servers >> start-all.bat
echo echo. >> start-all.bat
echo start "Backend Server" start-backend.bat >> start-all.bat
echo timeout /t 3 >nul >> start-all.bat
echo start "Frontend Server" start-frontend.bat >> start-all.bat
echo echo. >> start-all.bat
echo echo Both servers are starting... >> start-all.bat
echo pause >> start-all.bat

echo.
echo ========================================
echo Setup Complete! 🎉
echo ========================================
echo.
echo IMPORTANT: Place your YOLO model file as 'backend/yolov8s.pt'
echo.
echo To start the application:
echo   Option 1: Run 'start-all.bat' (starts both servers)
echo   Option 2: Run 'start-backend.bat' and 'start-frontend.bat' separately
echo.
echo URLs:
echo   Backend API: http://localhost:8000
echo   Frontend: http://localhost:3000
echo   Space Station Dashboard: http://localhost:3000/space-station
echo.
echo Test endpoints:
echo   curl http://localhost:8000/health
echo   curl http://localhost:8000/space-station/equipment-status
echo.
echo For troubleshooting, see DEPLOYMENT_GUIDE.md
echo ========================================
pause