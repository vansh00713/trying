# 🚀 NASA Space Station AI Vision Hub - Deployment Guide

## Complete Step-by-Step Setup for New Devices

This guide will help you clone and run the NASA Space Station Emergency Detection System on any new device.

---

## 📋 Prerequisites

Before starting, ensure you have:
- **Git** installed
- **Python 3.8+** 
- **Node.js 16+** and npm
- **Your trained YOLO model** (`yolov8s.pt` or similar)

---

## 🔄 Step 1: Clone the Repository

```bash
# Clone the repository
git clone <your-repository-url>
cd ai-vision-hub

# Verify the structure
dir  # Windows
# ls -la  # macOS/Linux
```

Expected structure:
```
ai-vision-hub/
├── backend/
│   ├── app.py
│   ├── space_station_features.py
│   ├── predict.py
│   ├── requirements.txt
│   └── setup.bat (Windows)
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── README.md
├── SPACE_STATION_FEATURES.md
└── DEPLOYMENT_GUIDE.md
```

---

## 🐍 Step 2: Backend Setup

### For Windows Users (Automated)

```bash
# Navigate to backend directory
cd backend

# Run the automated setup script
setup.bat

# This will:
# - Check Python installation
# - Create virtual environment
# - Install all dependencies
# - Create necessary directories
```

### For Manual Setup (All Platforms)

```bash
# Navigate to backend directory
cd backend

# Check Python version
python --version
# Should be 3.8 or higher

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create required directories
mkdir uploads sorted data exports gallery
# Windows PowerShell:
# New-Item -ItemType Directory -Path uploads, sorted, data, exports, gallery -Force
```

### Verify Backend Installation

```bash
# Test Python dependencies
python -c "import fastapi, uvicorn, ultralytics; print('All dependencies installed successfully')"
```

---

## 🤖 Step 3: YOLO Model Setup

### Option A: Use Pre-trained YOLOv8s
```bash
# Download YOLOv8s model (will download automatically on first use)
python -c "from ultralytics import YOLO; YOLO('yolov8s.pt')"
```

### Option B: Use Your Custom Model
```bash
# Copy your trained model to the backend directory
# Place your model file as: backend/yolov8s.pt
# Or update the model path in predict.py if using a different name
```

### Verify Model Setup
```bash
# Test model loading
python -c "from predict import run_inference; print('Model loaded successfully')"
```

---

## ⚛️ Step 4: Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install Node.js dependencies
npm install

# Verify installation
npm list --depth=0
```

Expected key dependencies:
- React 18+
- Vite
- Tailwind CSS
- Framer Motion
- Recharts

---

## 🚀 Step 5: Start the Application

### Terminal 1: Start Backend Server

```bash
# Navigate to backend and activate environment
cd backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Start the FastAPI server
python app.py
# Or alternatively:
# uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be available at:** http://localhost:8000

### Terminal 2: Start Frontend Development Server

```bash
# Navigate to frontend directory
cd frontend

# Start the React development server
npm run dev
```

**Frontend will be available at:** http://localhost:3000

---

## 🧪 Step 6: Verify Installation

### Test Backend API
```bash
# Test health endpoint
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","timestamp":"2024-10-15T21:00:00.000Z"}
```

### Test Space Station Endpoints
```bash
# Test equipment status
curl http://localhost:8000/space-station/equipment-status

# Test station modules
curl http://localhost:8000/space-station/station-modules

# Test emergency checklist
curl http://localhost:8000/space-station/emergency-checklist/fire
```

### Test Frontend
1. Open http://localhost:3000
2. Navigate through the application
3. Test image upload functionality
4. Access the Space Station Dashboard

---

## 📁 Step 7: Data Directory Structure

The application will create these directories automatically:

```
ai-vision-hub/
├── data/
│   ├── logs.json              # Detection logs
│   ├── custom_labels.json     # Custom label mappings
│   ├── alerts.json           # Alert configurations
│   ├── performance.json      # Performance metrics
│   └── settings.json         # Application settings
├── uploads/                  # Uploaded images
├── sorted/                   # Images sorted by detection
├── exports/                  # Data exports
└── gallery/                  # Gallery metadata
```

---

## 🔧 Step 8: Configuration (Optional)

### Backend Configuration
Edit `backend/app.py` to modify:
- **CORS origins** for frontend URL
- **File upload limits**
- **Confidence thresholds**
- **Alert settings**

### Frontend Configuration
Edit `frontend/src/utils/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:8000';  // Update if backend is on different host/port
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Python/Pip Not Found**
```bash
# Install Python from python.org
# Add to PATH during installation

# Verify installation
python --version
pip --version
```

**2. Virtual Environment Issues**
```bash
# Delete and recreate virtual environment
rmdir /s venv  # Windows
# rm -rf venv    # macOS/Linux

python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**3. Node.js/NPM Issues**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rmdir /s node_modules  # Windows
# rm -rf node_modules    # macOS/Linux

npm install
```

**4. CORS Errors**
- Ensure backend CORS settings include your frontend URL
- Check that both servers are running on expected ports

**5. Model Loading Issues**
```bash
# Check if model file exists
dir backend\yolov8s.pt  # Windows
# ls -la backend/yolov8s.pt  # macOS/Linux

# Test model loading
python -c "from ultralytics import YOLO; model = YOLO('yolov8s.pt'); print('Model loaded')"
```

**6. Port Already in Use**
```bash
# Backend (change port)
uvicorn app:app --reload --port 8001

# Frontend (change port)
npm run dev -- --port 3001
```

---

## 🚀 Production Deployment

### Backend (FastAPI)
```bash
# Install production server
pip install gunicorn

# Run with Gunicorn
gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend (React)
```bash
# Build for production
npm run build

# Serve static files (example with serve)
npm install -g serve
serve -s dist -l 3000
```

### Environment Variables
Create `.env` files for production configuration:

**Backend `.env`:**
```env
CORS_ORIGINS=https://your-frontend-domain.com
MODEL_PATH=./yolov8s.pt
CONFIDENCE_THRESHOLD=0.7
```

**Frontend `.env`:**
```env
VITE_API_BASE_URL=https://your-backend-domain.com
```

---

## 📊 Monitoring and Maintenance

### Log Files
- **Backend logs**: Check console output or configure logging
- **Detection logs**: `data/logs.json`
- **Performance metrics**: `data/performance.json`

### Data Backup
Regular backup of:
- `data/` directory (all JSON files)
- `uploads/` directory (uploaded images)
- `sorted/` directory (processed images)

### Updates
```bash
# Update backend dependencies
pip install -r requirements.txt --upgrade

# Update frontend dependencies
npm update
```

---

## 🎯 NASA Space Station Specific Setup

### Model Training Data
Ensure your YOLO model is trained on:
- Fire extinguisher
- Oxygen tank  
- Nitrogen tank
- First aid box
- Fire alarm
- Safety switch panel
- Emergency phone

### Custom Labels
Update equipment labels in the Space Station Dashboard by configuring:
```bash
# POST to /labels/custom with your label mappings
curl -X POST http://localhost:8000/labels/custom \
  -H "Content-Type: application/json" \
  -d '{"fire_extinguisher": "Fire Extinguisher", "oxygen_tank": "Oxygen Tank"}'
```

---

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Verify all prerequisites** are installed
3. **Check console logs** for error messages
4. **Ensure all ports are available** (8000 for backend, 3000 for frontend)
5. **Verify file permissions** for data directories

---

## ✅ Quick Verification Checklist

- [ ] Repository cloned successfully
- [ ] Python 3.8+ installed and accessible
- [ ] Node.js 16+ and npm installed
- [ ] Backend virtual environment created and activated
- [ ] Backend dependencies installed (requirements.txt)
- [ ] YOLO model file in backend directory
- [ ] Frontend dependencies installed (package.json)
- [ ] Backend server starts successfully (port 8000)
- [ ] Frontend server starts successfully (port 3000)
- [ ] API endpoints respond correctly
- [ ] Space Station Dashboard accessible
- [ ] Image upload functionality works
- [ ] Emergency equipment detection functioning

**🎉 Congratulations! Your NASA Space Station AI Vision Hub is ready for mission-critical operations!**