from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from pathlib import Path
import json
import os
import shutil
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import uuid
import csv
import io
import time
from collections import defaultdict
import asyncio
import cv2
from concurrent.futures import ThreadPoolExecutor

from predict import run_inference
from space_station_features import (
    SpaceStationAlertSystem, MissionLog, assess_detection_criticality,
    generate_response_protocol, generate_crew_safety_report, 
    SpaceStationEquipment, CrewSafetyProtocol
)
from advanced_equipment_analysis import (
    SmartEquipmentPositioning, EquipmentStatusDashboard, EquipmentConditionAssessment,
    IntelligentAutoLabeling, SpaceStationContextRecognition, ConfidenceLevel, EquipmentStatus
)

app = FastAPI(title="AI Vision Hub API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define paths
BASE_DIR = Path(__file__).parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
SORTED_DIR = BASE_DIR / "sorted"
DATA_DIR = BASE_DIR / "data"
EXPORTS_DIR = BASE_DIR / "exports"
GALLERY_DIR = BASE_DIR / "gallery"
LOGS_FILE = DATA_DIR / "logs.json"
CUSTOM_LABELS_FILE = DATA_DIR / "custom_labels.json"
ALERTS_FILE = DATA_DIR / "alerts.json"
PERFORMANCE_FILE = DATA_DIR / "performance.json"
SETTINGS_FILE = DATA_DIR / "settings.json"

# Create directories if they don't exist
for directory in [UPLOADS_DIR, SORTED_DIR, DATA_DIR, EXPORTS_DIR, GALLERY_DIR]:
    directory.mkdir(exist_ok=True)

# Thread pool for batch processing
executor = ThreadPoolExecutor(max_workers=4)

# Initialize advanced equipment analysis dashboard
equipment_dashboard = EquipmentStatusDashboard(DATA_DIR)

def load_logs() -> List[dict]:
    """Load logs from JSON file"""
    if not LOGS_FILE.exists():
        return []
    
    try:
        with open(LOGS_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []

def save_logs(logs: List[dict]):
    """Save logs to JSON file"""
    with open(LOGS_FILE, 'w') as f:
        json.dump(logs, f, indent=2)

def load_custom_labels() -> Dict[str, str]:
    """Load custom label mappings"""
    if not CUSTOM_LABELS_FILE.exists():
        return {}
    try:
        with open(CUSTOM_LABELS_FILE, 'r') as f:
            return json.load(f)
    except:
        return {}

def save_custom_labels(labels: Dict[str, str]):
    """Save custom label mappings"""
    with open(CUSTOM_LABELS_FILE, 'w') as f:
        json.dump(labels, f, indent=2)

def load_alerts() -> List[dict]:
    """Load alert configurations"""
    if not ALERTS_FILE.exists():
        return []
    try:
        with open(ALERTS_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_alerts(alerts: List[dict]):
    """Save alert configurations"""
    with open(ALERTS_FILE, 'w') as f:
        json.dump(alerts, f, indent=2)

def load_performance_data() -> List[dict]:
    """Load performance metrics"""
    if not PERFORMANCE_FILE.exists():
        return []
    try:
        with open(PERFORMANCE_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_performance_data(data: List[dict]):
    """Save performance metrics"""
    with open(PERFORMANCE_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def log_performance(filename: str, processing_time: float, detections_count: int):
    """Log performance metrics"""
    perf_data = load_performance_data()
    perf_entry = {
        "filename": filename,
        "processing_time": processing_time,
        "detections_count": detections_count,
        "timestamp": datetime.now().isoformat()
    }
    perf_data.append(perf_entry)
    
    # Keep only last 1000 entries
    if len(perf_data) > 1000:
        perf_data = perf_data[-1000:]
    
    save_performance_data(perf_data)

def check_alerts(detections: List[dict]) -> List[dict]:
    """Check if any detections trigger alerts"""
    alerts = load_alerts()
    triggered_alerts = []
    
    for alert in alerts:
        if not alert.get('active', True):
            continue
            
        target_label = alert.get('label', '').lower()
        min_confidence = alert.get('min_confidence', 0.0)
        
        for detection in detections:
            if (detection['label'].lower() == target_label and 
                detection['confidence'] >= min_confidence):
                triggered_alerts.append({
                    'alert_id': alert.get('id'),
                    'alert_name': alert.get('name'),
                    'detected_label': detection['label'],
                    'confidence': detection['confidence'],
                    'timestamp': datetime.now().isoformat()
                })
                break
    
    return triggered_alerts

def save_to_gallery(file_path: Path, detections: List[dict]):
    """Save processed image to gallery with metadata"""
    gallery_entry = {
        "filename": file_path.name,
        "path": str(file_path.relative_to(BASE_DIR)),
        "detections": detections,
        "timestamp": datetime.now().isoformat(),
        "total_detections": len(detections)
    }
    
    gallery_file = GALLERY_DIR / f"{file_path.stem}_meta.json"
    with open(gallery_file, 'w') as f:
        json.dump(gallery_entry, f, indent=2)

def save_image_to_uploads(file: UploadFile, filename: str) -> Path:
    """Save uploaded image to uploads directory"""
    file_path = UPLOADS_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return file_path

def sort_image_by_label(source_path: Path, top_label: str):
    """Sort image into labeled directory"""
    if not top_label:
        return
    
    # Create label directory if it doesn't exist
    label_dir = SORTED_DIR / top_label
    label_dir.mkdir(exist_ok=True)
    
    # Copy image to sorted directory
    destination = label_dir / source_path.name
    shutil.copy2(source_path, destination)

def log_detection(filename: str, detections: List[dict]):
    """Log detection results to JSON file"""
    logs = load_logs()
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Log each detection
    for detection in detections:
        log_entry = {
            "filename": filename,
            "label": detection["label"],
            "confidence": detection["confidence"],
            "timestamp": timestamp
        }
        logs.append(log_entry)
    
    # If no detections, still log the attempt
    if not detections:
        log_entry = {
            "filename": filename,
            "label": "no_detection",
            "confidence": 0.0,
            "timestamp": timestamp
        }
        logs.append(log_entry)
    
    save_logs(logs)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "AI Vision Hub API", "version": "1.0.0"}

@app.post("/predict")
async def predict_image(
    file: UploadFile = File(...), 
    confidence: float = Query(0.5, ge=0.1, le=1.0, description="Detection confidence threshold")
):
    """
    Upload an image and get AI predictions with configurable confidence
    """
    start_time = time.time()
    
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        
        # Save uploaded file
        file_path = save_image_to_uploads(file, unique_filename)
        
        # Run inference with custom confidence
        result = run_inference(str(file_path), confidence)
        
        # Apply custom labels if available
        custom_labels = load_custom_labels()
        for detection in result["detections"]:
            original_label = detection["label"]
            detection["original_label"] = original_label
            detection["label"] = custom_labels.get(original_label, original_label)
        
        # Get top label for sorting
        top_label = None
        if result["detections"]:
            # Sort by confidence and get top detection
            sorted_detections = sorted(result["detections"], key=lambda x: x["confidence"], reverse=True)
            top_label = sorted_detections[0]["label"]
            
            # Sort image into appropriate folder
            sort_image_by_label(file_path, top_label)
        
        # Check for alerts
        triggered_alerts = check_alerts(result["detections"])
        
        # Log the detection
        log_detection(result["filename"], result["detections"])
        
        # Save to gallery
        save_to_gallery(file_path, result["detections"])
        
        # Log performance
        processing_time = time.time() - start_time
        log_performance(result["filename"], processing_time, len(result["detections"]))
        
        # Return result with additional metadata
        response = {
            "success": True,
            "filename": result["filename"],
            "detections": result["detections"],
            "total_detections": len(result["detections"]),
            "top_label": top_label,
            "upload_path": str(file_path.relative_to(BASE_DIR)),
            "sorted_to": f"sorted/{top_label}" if top_label else None,
            "processing_time": processing_time,
            "confidence_threshold": confidence,
            "triggered_alerts": triggered_alerts
        }
        
        return JSONResponse(content=response)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/logs")
async def get_logs():
    """
    Get all detection logs for dashboard analytics
    """
    try:
        logs = load_logs()
        
        # Calculate some basic statistics
        total_detections = len([log for log in logs if log["label"] != "no_detection"])
        total_images = len(set(log["filename"] for log in logs))
        
        # Get label frequency
        label_counts = {}
        confidence_data = []
        
        for log in logs:
            if log["label"] != "no_detection":
                label_counts[log["label"]] = label_counts.get(log["label"], 0) + 1
                confidence_data.append({
                    "label": log["label"],
                    "confidence": log["confidence"],
                    "timestamp": log["timestamp"]
                })
        
        # Sort labels by frequency
        most_frequent_labels = sorted(label_counts.items(), key=lambda x: x[1], reverse=True)
        
        response = {
            "success": True,
            "logs": logs,
            "statistics": {
                "total_detections": total_detections,
                "total_images": total_images,
                "unique_labels": len(label_counts),
                "most_frequent_labels": most_frequent_labels[:10],  # Top 10
                "average_confidence": sum(item["confidence"] for item in confidence_data) / len(confidence_data) if confidence_data else 0
            },
            "confidence_data": confidence_data
        }
        
        return JSONResponse(content=response)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load logs: {str(e)}")

@app.delete("/logs")
async def clear_logs():
    """Clear all logs (useful for testing)"""
    try:
        save_logs([])
        return {"success": True, "message": "Logs cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear logs: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# ===== NEW ENHANCED FEATURES =====

@app.post("/predict/batch")
async def predict_batch(
    files: List[UploadFile] = File(...),
    confidence: float = Query(0.5, ge=0.1, le=1.0, description="Detection confidence threshold")
):
    """
    Upload multiple images for batch processing
    """
    if len(files) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 files allowed per batch")
    
    start_time = time.time()
    results = []
    
    async def process_file(file: UploadFile):
        try:
            if not file.content_type.startswith("image/"):
                return {"filename": file.filename, "error": "Not an image file"}
            
            # Generate unique filename
            file_extension = Path(file.filename).suffix
            unique_filename = f"{uuid.uuid4().hex}{file_extension}"
            
            # Save uploaded file
            file_path = save_image_to_uploads(file, unique_filename)
            
            # Run inference
            result = run_inference(str(file_path), confidence)
            
            # Apply custom labels
            custom_labels = load_custom_labels()
            for detection in result["detections"]:
                original_label = detection["label"]
                detection["original_label"] = original_label
                detection["label"] = custom_labels.get(original_label, original_label)
            
            # Get top label and sort
            top_label = None
            if result["detections"]:
                sorted_detections = sorted(result["detections"], key=lambda x: x["confidence"], reverse=True)
                top_label = sorted_detections[0]["label"]
                sort_image_by_label(file_path, top_label)
            
            # Check alerts and log
            triggered_alerts = check_alerts(result["detections"])
            log_detection(result["filename"], result["detections"])
            save_to_gallery(file_path, result["detections"])
            
            return {
                "filename": result["filename"],
                "original_filename": file.filename,
                "detections": result["detections"],
                "total_detections": len(result["detections"]),
                "top_label": top_label,
                "triggered_alerts": triggered_alerts,
                "success": True
            }
            
        except Exception as e:
            return {
                "filename": file.filename,
                "error": str(e),
                "success": False
            }
    
    # Process files concurrently
    tasks = [process_file(file) for file in files]
    results = await asyncio.gather(*tasks)
    
    # Log batch performance
    total_time = time.time() - start_time
    successful_results = [r for r in results if r.get('success', False)]
    total_detections = sum(r.get('total_detections', 0) for r in successful_results)
    
    log_performance(f"batch_{len(files)}_files", total_time, total_detections)
    
    return {
        "success": True,
        "total_files": len(files),
        "successful": len(successful_results),
        "failed": len(files) - len(successful_results),
        "total_processing_time": total_time,
        "total_detections": total_detections,
        "results": results
    }

@app.get("/gallery")
async def get_gallery(
    label_filter: Optional[str] = Query(None, description="Filter by detection label"),
    min_confidence: Optional[float] = Query(None, description="Minimum confidence filter"),
    limit: int = Query(50, ge=1, le=100, description="Number of results to return")
):
    """
    Get processed images gallery with filtering
    """
    gallery_files = list(GALLERY_DIR.glob("*_meta.json"))
    gallery_items = []
    
    for meta_file in gallery_files:
        try:
            with open(meta_file, 'r') as f:
                item = json.load(f)
                
            # Apply filters
            if label_filter:
                if not any(d['label'].lower() == label_filter.lower() for d in item['detections']):
                    continue
            
            if min_confidence is not None:
                if not any(d['confidence'] >= min_confidence for d in item['detections']):
                    continue
            
            gallery_items.append(item)
        except:
            continue
    
    # Sort by timestamp (newest first)
    gallery_items.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return {
        "success": True,
        "total_items": len(gallery_items),
        "items": gallery_items[:limit]
    }

@app.get("/export/{export_format}")
async def export_data(
    export_format: str,
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """
    Export detection data in various formats
    """
    if export_format not in ['csv', 'json', 'pdf']:
        raise HTTPException(status_code=400, detail="Format must be csv, json, or pdf")
    
    logs = load_logs()
    
    # Apply date filters
    if start_date or end_date:
        filtered_logs = []
        for log in logs:
            log_date = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00')).date()
            
            if start_date and log_date < datetime.fromisoformat(start_date).date():
                continue
            if end_date and log_date > datetime.fromisoformat(end_date).date():
                continue
                
            filtered_logs.append(log)
        logs = filtered_logs
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if export_format == 'csv':
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=['filename', 'label', 'confidence', 'timestamp'])
        writer.writeheader()
        writer.writerows(logs)
        
        filename = f"detections_export_{timestamp}.csv"
        content = output.getvalue()
        
        return StreamingResponse(
            io.BytesIO(content.encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    elif export_format == 'json':
        filename = f"detections_export_{timestamp}.json"
        export_data = {
            "export_timestamp": datetime.now().isoformat(),
            "total_records": len(logs),
            "date_range": {
                "start": start_date,
                "end": end_date
            },
            "detections": logs
        }
        
        content = json.dumps(export_data, indent=2)
        
        return StreamingResponse(
            io.BytesIO(content.encode()),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    # PDF export would require additional libraries like reportlab
    # For now, return JSON format
    return await export_data('json', start_date, end_date)

@app.get("/performance")
async def get_performance_analytics():
    """
    Get performance analytics and metrics
    """
    perf_data = load_performance_data()
    
    if not perf_data:
        return {
            "success": True,
            "message": "No performance data available",
            "metrics": {}
        }
    
    # Calculate metrics
    processing_times = [d['processing_time'] for d in perf_data]
    detection_counts = [d['detections_count'] for d in perf_data]
    
    metrics = {
        "total_processed": len(perf_data),
        "avg_processing_time": sum(processing_times) / len(processing_times),
        "min_processing_time": min(processing_times),
        "max_processing_time": max(processing_times),
        "avg_detections_per_image": sum(detection_counts) / len(detection_counts),
        "total_detections": sum(detection_counts),
        "processing_rate": len(perf_data) / sum(processing_times) * 3600 if sum(processing_times) > 0 else 0  # images per hour
    }
    
    return {
        "success": True,
        "metrics": metrics,
        "recent_data": perf_data[-20:]  # Last 20 entries
    }

@app.post("/labels/custom")
async def set_custom_labels(label_mappings: Dict[str, str] = Body(...)):
    """
    Set custom label mappings
    """
    try:
        save_custom_labels(label_mappings)
        return {
            "success": True,
            "message": "Custom labels saved successfully",
            "mappings": label_mappings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save custom labels: {str(e)}")

@app.get("/labels/custom")
async def get_custom_labels():
    """
    Get current custom label mappings
    """
    return {
        "success": True,
        "mappings": load_custom_labels()
    }

@app.post("/alerts")
async def create_alert(alert_data: Dict[str, Any] = Body(...)):
    """
    Create a new detection alert
    """
    alerts = load_alerts()
    
    new_alert = {
        "id": str(uuid.uuid4()),
        "name": alert_data.get("name", "Unnamed Alert"),
        "label": alert_data.get("label", ""),
        "min_confidence": alert_data.get("min_confidence", 0.5),
        "active": alert_data.get("active", True),
        "created_at": datetime.now().isoformat()
    }
    
    alerts.append(new_alert)
    save_alerts(alerts)
    
    return {
        "success": True,
        "message": "Alert created successfully",
        "alert": new_alert
    }

@app.get("/alerts")
async def get_alerts():
    """
    Get all detection alerts
    """
    return {
        "success": True,
        "alerts": load_alerts()
    }

@app.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    """
    Delete a detection alert
    """
    alerts = load_alerts()
    original_count = len(alerts)
    alerts = [a for a in alerts if a.get('id') != alert_id]
    
    if len(alerts) == original_count:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    save_alerts(alerts)
    
    return {
        "success": True,
        "message": "Alert deleted successfully"
    }

@app.get("/timeline")
async def get_detection_timeline(
    days: int = Query(30, ge=1, le=365, description="Number of days to include")
):
    """
    Get detection timeline for the specified number of days
    """
    logs = load_logs()
    
    # Filter logs by date range
    cutoff_date = datetime.now() - timedelta(days=days)
    filtered_logs = []
    
    for log in logs:
        try:
            log_datetime = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00'))
            if log_datetime >= cutoff_date:
                filtered_logs.append(log)
        except:
            continue
    
    # Group by date
    timeline = defaultdict(lambda: {'date': '', 'detections': 0, 'unique_labels': set(), 'files': set()})
    
    for log in filtered_logs:
        try:
            date_str = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00')).date().isoformat()
            timeline[date_str]['date'] = date_str
            timeline[date_str]['detections'] += 1
            timeline[date_str]['unique_labels'].add(log['label'])
            timeline[date_str]['files'].add(log['filename'])
        except:
            continue
    
    # Convert to list and format
    timeline_data = []
    for date_str, data in sorted(timeline.items()):
        timeline_data.append({
            'date': data['date'],
            'detections': data['detections'],
            'unique_labels': len(data['unique_labels']),
            'files_processed': len(data['files']),
            'labels': list(data['unique_labels'])
        })
    
    return {
        "success": True,
        "timeline": timeline_data,
        "total_days": len(timeline_data),
        "date_range": {
            "from": cutoff_date.date().isoformat(),
            "to": datetime.now().date().isoformat()
        }
    }

# ===== NASA SPACE STATION FEATURES =====

@app.post("/space-station/detection")
async def space_station_detection(
    file: UploadFile = File(...),
    station_module: str = Query("UNKNOWN", description="Space station module (e.g., HARMONY, DESTINY, COLUMBUS)"),
    crew_member: Optional[str] = Query(None, description="Crew member ID"),
    confidence: float = Query(0.7, ge=0.5, le=1.0, description="Higher confidence required for space missions")
):
    """
    NASA-grade equipment detection for space station operations
    """
    start_time = time.time()
    
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Generate unique filename with mission timestamp
        file_extension = Path(file.filename).suffix
        mission_time = datetime.utcnow().strftime('%Y%j_%H%M%S')
        unique_filename = f"MISSION_{mission_time}{file_extension}"
        
        # Save uploaded file
        file_path = save_image_to_uploads(file, unique_filename)
        
        # Run inference with higher confidence threshold for space missions
        result = run_inference(str(file_path), confidence)
        
        # Create NASA mission log entry
        mission_log = MissionLog.create_mission_entry(
            detection_data=result,
            crew_member=crew_member,
            station_module=station_module
        )
        
        # Create space station alert
        nasa_alert = SpaceStationAlertSystem.create_nasa_alert(
            detection_result=result,
            station_module=station_module,
            crew_member=crew_member
        )
        
        # Log detection with space station context
        log_detection(result["filename"], result["detections"])
        save_to_gallery(file_path, result["detections"])
        
        # Log performance
        processing_time = time.time() - start_time
        log_performance(result["filename"], processing_time, len(result["detections"]))
        
        response = {
            "success": True,
            "mission_log": mission_log,
            "nasa_alert": nasa_alert,
            "detection_result": result,
            "processing_time": processing_time,
            "station_module": station_module,
            "crew_member": crew_member,
            "confidence_threshold": confidence
        }
        
        return JSONResponse(content=response)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Space station detection failed: {str(e)}")

@app.get("/space-station/equipment-status")
async def get_equipment_status():
    """
    Get current equipment status and criticality assessment
    """
    logs = load_logs()
    
    if not logs:
        return {
            "success": True,
            "equipment_status": {},
            "message": "No detection data available"
        }
    
    # Get most recent detections for assessment
    recent_detections = {"detections": []}
    for log in logs[-20:]:  # Last 20 logs
        if log["label"] != "no_detection":
            recent_detections["detections"].append({
                "label": log["label"],
                "confidence": log["confidence"]
            })
    
    assessment = assess_detection_criticality(recent_detections)
    protocols = generate_response_protocol(recent_detections)
    
    return {
        "success": True,
        "equipment_config": {eq: {**config, "criticality": config["criticality"].value, "emergency_type": config["emergency_type"].value} 
                            for eq, config in SpaceStationEquipment.EQUIPMENT_CONFIG.items()},
        "current_assessment": assessment,
        "response_protocols": protocols,
        "last_updated": datetime.now().isoformat()
    }

@app.get("/space-station/emergency-checklist/{emergency_type}")
async def get_emergency_checklist(emergency_type: str):
    """
    Get emergency response checklist for specific emergency type
    """
    from space_station_features import EmergencyType
    
    try:
        emergency_enum = EmergencyType(emergency_type.lower())
        checklist = CrewSafetyProtocol.generate_emergency_checklist(emergency_enum)
        
        return {
            "success": True,
            "emergency_type": emergency_type,
            "checklist": checklist,
            "generated_at": datetime.now().isoformat()
        }
    except ValueError:
        available_types = [e.value for e in EmergencyType]
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid emergency type. Available types: {available_types}"
        )

@app.get("/space-station/crew-safety-report")
async def get_crew_safety_report():
    """
    Generate comprehensive crew safety status report
    """
    logs = load_logs()
    
    if not logs:
        return {
            "success": True,
            "message": "No detection history available for safety report",
            "report": None
        }
    
    # Convert logs to detection history format
    detections_history = []
    for log in logs:
        if log["label"] != "no_detection":
            detections_history.append({
                "timestamp": log["timestamp"],
                "detections": [{"label": log["label"], "confidence": log["confidence"]}]
            })
    
    safety_report = generate_crew_safety_report(detections_history)
    
    return {
        "success": True,
        "safety_report": safety_report,
        "report_summary": {
            "overall_safety_score": safety_report["overall_safety_score"],
            "critical_items": len([eq for eq, status in safety_report["equipment_status"].items() 
                                 if status["status"] == "CRITICAL"]),
            "total_recommendations": len(safety_report["recommendations"])
        }
    }

@app.post("/space-station/mission-log")
async def create_mission_log_entry(
    detection_data: Dict = Body(...),
    crew_member: Optional[str] = Body(None),
    station_module: str = Body("UNKNOWN"),
    mission_time: Optional[str] = Body(None)
):
    """
    Create manual mission log entry
    """
    try:
        mission_log = MissionLog.create_mission_entry(
            detection_data=detection_data,
            crew_member=crew_member,
            station_module=station_module,
            mission_time=mission_time
        )
        
        # Save to logs for persistence
        logs = load_logs()
        logs.append({
            "filename": f"manual_entry_{mission_log['log_id']}",
            "label": "mission_log_entry",
            "confidence": 1.0,
            "timestamp": mission_log['timestamp_utc'],
            "mission_log": mission_log
        })
        save_logs(logs)
        
        return {
            "success": True,
            "mission_log": mission_log,
            "message": "Mission log entry created successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create mission log: {str(e)}")

@app.get("/space-station/station-modules")
async def get_station_modules():
    """
    Get list of space station modules for dropdown selection
    """
    modules = [
        {"code": "HARMONY", "name": "Harmony Node", "description": "Connecting node and crew quarters"},
        {"code": "DESTINY", "name": "Destiny Laboratory", "description": "US laboratory module"},
        {"code": "COLUMBUS", "name": "Columbus Laboratory", "description": "European laboratory module"},
        {"code": "KIBO", "name": "Kibo Laboratory", "description": "Japanese experiment module"},
        {"code": "UNITY", "name": "Unity Node", "description": "First ISS component"},
        {"code": "TRANQUILITY", "name": "Tranquility Node", "description": "Life support and exercise area"},
        {"code": "CUPOLA", "name": "Cupola", "description": "Observation deck"},
        {"code": "QUEST", "name": "Quest Airlock", "description": "EVA preparation chamber"}
    ]
    
    return {
        "success": True,
        "modules": modules,
        "total_modules": len(modules)
    }

# ===== ADVANCED EQUIPMENT ANALYSIS ENDPOINTS =====

@app.post("/advanced-analysis/equipment-positioning")
async def analyze_equipment_positioning(file: UploadFile = File(...)):
    """
    Analyze equipment positioning and accessibility from image
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Save uploaded file
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = save_image_to_uploads(file, unique_filename)
        
        # Get image dimensions
        img = cv2.imread(str(file_path))
        img_height, img_width = img.shape[:2]
        image_dimensions = (img_width, img_height)
        
        # Run inference
        result = run_inference(str(file_path), confidence=0.5)
        
        # Analyze each detection for positioning
        positioning_analysis = []
        for detection in result["detections"]:
            analysis = SmartEquipmentPositioning.analyze_position(
                detection, image_dimensions
            )
            positioning_analysis.append({
                "detection": detection,
                "analysis": analysis
            })
            
            # Update equipment dashboard with positioning data
            equipment_type = detection["label"]
            equipment_dashboard.update_equipment_detection(
                equipment_type, detection, str(file_path), analysis
            )
        
        return {
            "success": True,
            "filename": result["filename"],
            "total_detections": len(result["detections"]),
            "positioning_analysis": positioning_analysis,
            "image_dimensions": image_dimensions,
            "recommendations": [item for analysis in positioning_analysis 
                              for item in analysis["analysis"].get("recommendations", [])],
            "flags": [item for analysis in positioning_analysis 
                    for item in analysis["analysis"].get("flags", [])]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/advanced-analysis/equipment-status")
async def get_equipment_status():
    """
    Get comprehensive equipment status from dashboard
    """
    try:
        status_summary = equipment_dashboard.get_equipment_status_summary()
        return {
            "success": True,
            "status_summary": status_summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get equipment status: {str(e)}")

@app.get("/advanced-analysis/equipment-trends/{equipment_type}")
async def get_equipment_trends(equipment_type: str, days: int = Query(7, ge=1, le=30)):
    """
    Get trend analysis for specific equipment type
    """
    try:
        trends = equipment_dashboard.get_equipment_trends(equipment_type, days)
        return {
            "success": True,
            "equipment_type": equipment_type,
            "trends": trends
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get trends: {str(e)}")

@app.post("/advanced-analysis/condition-assessment")
async def assess_equipment_condition(file: UploadFile = File(...)):
    """
    Assess equipment condition with confidence-based flagging
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Save uploaded file
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = save_image_to_uploads(file, unique_filename)
        
        # Run inference
        result = run_inference(str(file_path), confidence=0.5)
        
        # Get image dimensions
        img = cv2.imread(str(file_path))
        img_height, img_width = img.shape[:2]
        image_dimensions = (img_width, img_height)
        
        # Analyze each detection for positioning first
        position_analyses = {}
        for detection in result["detections"]:
            equipment_type = detection["label"]
            position_analyses[equipment_type] = SmartEquipmentPositioning.analyze_position(
                detection, image_dimensions
            )
        
        # Assess condition for each detection
        condition_assessments = []
        for detection in result["detections"]:
            equipment_type = detection["label"]
            
            # Get historical data if available
            historical_data = equipment_dashboard.detection_history.get(equipment_type, [])
            
            # Assess condition
            condition = EquipmentConditionAssessment.assess_condition(
                detection, 
                position_analyses[equipment_type], 
                historical_data
            )
            
            condition_assessments.append({
                "equipment_type": equipment_type,
                "assessment": condition
            })
        
        return {
            "success": True,
            "filename": result["filename"],
            "total_detections": len(result["detections"]),
            "condition_assessments": condition_assessments,
            "requires_inspection": any(item["assessment"].get("requires_inspection", False) 
                                     for item in condition_assessments),
            "recommendations": [item for assessment in condition_assessments 
                              for item in assessment["assessment"].get("recommendations", [])]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assessment failed: {str(e)}")

@app.post("/advanced-analysis/auto-labeling")
async def generate_labeling_suggestions(file: UploadFile = File(...), confidence_threshold: float = Query(0.6, ge=0.3, le=0.9)):
    """
    Generate intelligent auto-labeling suggestions for training data improvement
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Save uploaded file
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = save_image_to_uploads(file, unique_filename)
        
        # Run inference
        result = run_inference(str(file_path), confidence=0.3)  # Low threshold to get more candidates
        
        # Get image dimensions
        img = cv2.imread(str(file_path))
        img_height, img_width = img.shape[:2]
        image_dimensions = (img_width, img_height)
        
        # Generate labeling suggestions
        labeling_suggestions = IntelligentAutoLabeling.generate_labeling_suggestions(
            result["detections"], str(file_path), confidence_threshold
        )
        
        # Generate bounding box improvement suggestions for each detection
        bbox_improvements = []
        for detection in result["detections"]:
            improvements = IntelligentAutoLabeling.suggest_bbox_improvements(
                detection, image_dimensions
            )
            bbox_improvements.append({
                "label": detection["label"],
                "confidence": detection["confidence"],
                "improvements": improvements
            })
        
        return {
            "success": True,
            "filename": result["filename"],
            "labeling_suggestions": labeling_suggestions,
            "bbox_improvements": bbox_improvements,
            "confidence_threshold_used": confidence_threshold
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-labeling failed: {str(e)}")

@app.post("/advanced-analysis/space-context")
async def analyze_space_context(file: UploadFile = File(...)):
    """
    Analyze space station context from image
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Save uploaded file
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = save_image_to_uploads(file, unique_filename)
        
        # Run inference
        result = run_inference(str(file_path), confidence=0.5)
        
        # Analyze context
        context_analysis = SpaceStationContextRecognition.analyze_context(
            result["detections"], str(file_path), confidence_threshold=0.6
        )
        
        return {
            "success": True,
            "filename": result["filename"],
            "total_detections": len(result["detections"]),
            "context_analysis": context_analysis,
            "module_prediction": context_analysis["module_prediction"],
            "safety_assessment": context_analysis["safety_assessment"],
            "confidence_assessment": context_analysis["confidence_assessment"],
            "recommendations": context_analysis["contextual_recommendations"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Context analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
