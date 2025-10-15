@echo off
echo Starting AI Vision Hub Backend...
echo.

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo Virtual environment not found! Please run setup.bat first.
    pause
    exit /b 1
)

REM Check if yolo11n.pt exists
if not exist "yolo11n.pt" (
    echo ERROR: yolo11n.pt not found!
    echo Please place your YOLO model file in this directory.
    echo The file should be: %cd%\yolo11n.pt
    pause
    exit /b 1
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Starting FastAPI server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
uvicorn app:app --reload --host 0.0.0.0 --port 8000