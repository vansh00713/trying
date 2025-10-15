from ultralytics import YOLO
from pathlib import Path
import os

# Load the YOLO model (you'll need to place yolo11n.pt in the backend folder)
MODEL_PATH = Path(__file__).parent / "yolo11n.pt"

def get_model():
    """Load and return the YOLO model"""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Please place yolo11n.pt in the backend folder.")
    return YOLO(MODEL_PATH)

def run_inference(image_path, confidence_threshold=0.5):
    """
    Run YOLO inference on an image and return results in the required format
    
    Args:
        image_path (str): Path to the image file
        confidence_threshold (float): Minimum confidence for detections
        
    Returns:
        dict: Dictionary containing filename and detections
    """
    try:
        model = get_model()
        
        # Get filename from path
        filename = Path(image_path).name
        
        # Perform prediction with confidence threshold
        results = model.predict(image_path, conf=confidence_threshold)
        result = results[0]
        
        # Extract detections
        detections = []
        
        if result.boxes is not None:
            for box in result.boxes:
                # Get class name
                class_id = int(box.cls[0])
                label = model.names[class_id]
                
                # Get confidence
                confidence = float(box.conf[0])
                
                # Get bounding box coordinates (xyxy format)
                bbox = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                
                detection = {
                    "label": label,
                    "confidence": confidence,
                    "bbox": bbox
                }
                detections.append(detection)
        
        return {
            "filename": filename,
            "detections": detections
        }
        
    except Exception as e:
        print(f"Error in run_inference: {str(e)}")
        return {
            "filename": Path(image_path).name,
            "detections": []
        }

if __name__ == "__main__":
    # Test the function
    test_image = "test.jpg"  # Replace with actual test image
    if os.path.exists(test_image):
        result = run_inference(test_image)
        print(result)
    else:
        print("Please provide a test image to run inference")