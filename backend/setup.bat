@echo off
echo Setting up AI Vision Hub Backend...
echo.

REM Check for Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python not found! Please install Python 3.8+ first.
    echo Download from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo Python found. Creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install --upgrade pip
pip install -r requirements.txt

echo.
echo Setup complete! 
echo.
echo To start the server:
echo 1. Run: venv\Scripts\activate.bat
echo 2. Run: uvicorn app:app --reload
echo.
echo Make sure yolo8s.pt is in this directory!
pause