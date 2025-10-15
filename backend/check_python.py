#!/usr/bin/env python3
"""
Python Environment Checker for AI Vision Hub
Run this to verify your Python installation and dependencies
"""

import sys
import os
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    print("=== Python Version Check ===")
    print(f"Python version: {sys.version}")
    
    if sys.version_info < (3, 8):
        print("❌ ERROR: Python 3.8+ is required")
        return False
    else:
        print("✅ Python version is compatible")
        return True

def check_pip():
    """Check if pip is available"""
    print("\n=== Pip Check ===")
    try:
        import pip
        print("✅ pip is available")
        return True
    except ImportError:
        print("❌ ERROR: pip is not available")
        return False

def check_yolo_model():
    """Check if YOLO model file exists"""
    print("\n=== YOLO Model Check ===")
    model_path = Path(__file__).parent / "yolo11n.pt"
    
    if model_path.exists():
        size_mb = model_path.stat().st_size / (1024 * 1024)
        print(f"✅ YOLO model found: {model_path}")
        print(f"   File size: {size_mb:.1f} MB")
        return True
    else:
        print("❌ ERROR: yolo11n.pt not found")
        print(f"   Expected location: {model_path}")
        print("   Please place your YOLO model file in the backend directory")
        return False

def check_dependencies():
    """Check if required packages can be imported"""
    print("\n=== Dependencies Check ===")
    
    required_packages = [
        ("fastapi", "FastAPI"),
        ("uvicorn", "Uvicorn"),
        ("PIL", "Pillow"),
        ("cv2", "OpenCV"),
        ("ultralytics", "Ultralytics"),
        ("yaml", "PyYAML")
    ]
    
    all_good = True
    
    for package, name in required_packages:
        try:
            __import__(package)
            print(f"✅ {name}")
        except ImportError:
            print(f"❌ {name} - Not installed")
            all_good = False
    
    return all_good

def main():
    print("AI Vision Hub - Environment Checker")
    print("=" * 40)
    
    checks = [
        check_python_version(),
        check_pip(),
        check_yolo_model(),
        check_dependencies()
    ]
    
    print("\n=== Summary ===")
    if all(checks):
        print("🎉 All checks passed! You're ready to run AI Vision Hub")
        print("\nTo start the server:")
        print("1. uvicorn app:app --reload")
        print("2. Open http://localhost:8000 in your browser")
    else:
        print("❌ Some issues found. Please fix the errors above.")
        print("\nIf dependencies are missing, run:")
        print("pip install -r requirements.txt")

if __name__ == "__main__":
    main()