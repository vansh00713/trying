# NASA Space Station Emergency Detection System
# Enhanced features for mission-critical equipment monitoring

from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from enum import Enum
import json
import asyncio
from pathlib import Path

class EmergencyType(Enum):
    FIRE = "fire"
    OXYGEN_CRITICAL = "oxygen_critical" 
    NITROGEN_LEAK = "nitrogen_leak"
    MEDICAL_EMERGENCY = "medical_emergency"
    SAFETY_SYSTEM_FAILURE = "safety_system_failure"
    COMMUNICATION_FAILURE = "communication_failure"
    EVACUATION = "evacuation"

class Priority(Enum):
    CRITICAL = "CRITICAL"  # Life threatening - immediate action required
    HIGH = "HIGH"         # Safety equipment missing/damaged
    MEDIUM = "MEDIUM"     # Equipment needs attention
    LOW = "LOW"          # Routine monitoring

class SpaceStationEquipment:
    """Define space station equipment categories and criticality"""
    
    EQUIPMENT_CONFIG = {
        "fire_extinguisher": {
            "criticality": Priority.CRITICAL,
            "max_response_time": 30,  # seconds
            "required_quantity": 3,   # minimum per module
            "emergency_type": EmergencyType.FIRE,
            "description": "CO2/Halon fire suppression system"
        },
        "oxygen_tank": {
            "criticality": Priority.CRITICAL,
            "max_response_time": 10,  # seconds
            "required_quantity": 2,   # backup systems
            "emergency_type": EmergencyType.OXYGEN_CRITICAL,
            "description": "Life support oxygen supply"
        },
        "nitrogen_tank": {
            "criticality": Priority.HIGH,
            "max_response_time": 60,  # seconds
            "required_quantity": 1,
            "emergency_type": EmergencyType.NITROGEN_LEAK,
            "description": "Pressurization and fire suppression"
        },
        "first_aid_box": {
            "criticality": Priority.HIGH,
            "max_response_time": 120,  # seconds
            "required_quantity": 2,
            "emergency_type": EmergencyType.MEDICAL_EMERGENCY,
            "description": "Medical emergency supplies"
        },
        "fire_alarm": {
            "criticality": Priority.CRITICAL,
            "max_response_time": 5,   # seconds
            "required_quantity": 4,   # redundancy critical
            "emergency_type": EmergencyType.FIRE,
            "description": "Fire detection and alert system"
        },
        "safety_switch_panel": {
            "criticality": Priority.CRITICAL,
            "max_response_time": 15,  # seconds
            "required_quantity": 2,
            "emergency_type": EmergencyType.SAFETY_SYSTEM_FAILURE,
            "description": "Emergency shutdown controls"
        },
        "emergency_phone": {
            "criticality": Priority.HIGH,
            "max_response_time": 45,  # seconds
            "required_quantity": 3,
            "emergency_type": EmergencyType.COMMUNICATION_FAILURE,
            "description": "Ground communication system"
        }
    }

class MissionLog:
    """NASA-grade mission logging system"""
    
    @staticmethod
    def create_mission_entry(
        detection_data: Dict,
        crew_member: Optional[str] = None,
        station_module: str = "UNKNOWN",
        mission_time: Optional[str] = None
    ) -> Dict:
        """Create standardized mission log entry"""
        
        mission_time = mission_time or f"GMT {datetime.utcnow().strftime('%j:%H:%M:%S')}"
        
        return {
            "mission_time": mission_time,
            "timestamp_utc": datetime.utcnow().isoformat(),
            "station_module": station_module,
            "crew_member": crew_member,
            "system": "AI_VISION_EMERGENCY_DETECTION",
            "event_type": "EQUIPMENT_DETECTION",
            "detection_data": detection_data,
            "criticality_assessment": assess_detection_criticality(detection_data),
            "required_actions": generate_response_protocol(detection_data),
            "log_id": f"EVA_{datetime.utcnow().strftime('%Y%j_%H%M%S')}"
        }

class CrewSafetyProtocol:
    """Automated crew safety and response protocols"""
    
    @staticmethod
    def generate_emergency_checklist(emergency_type: EmergencyType) -> List[str]:
        """Generate emergency response checklist"""
        
        checklists = {
            EmergencyType.FIRE: [
                "1. ACTIVATE fire alarm system",
                "2. LOCATE nearest CO2 fire extinguisher", 
                "3. NOTIFY ground control immediately",
                "4. EVACUATE affected module if necessary",
                "5. ISOLATE oxygen supply to affected area",
                "6. MONITOR atmospheric conditions"
            ],
            EmergencyType.OXYGEN_CRITICAL: [
                "1. CHECK oxygen tank status immediately",
                "2. ACTIVATE backup oxygen supply",
                "3. NOTIFY ground control - PRIORITY 1",
                "4. LOCATE emergency oxygen masks",
                "5. PREPARE for potential evacuation",
                "6. MONITOR crew vital signs"
            ],
            EmergencyType.MEDICAL_EMERGENCY: [
                "1. SECURE medical supplies immediately",
                "2. ASSESS crew member condition",
                "3. CONTACT medical officer on ground",
                "4. PREPARE medical equipment",
                "5. DOCUMENT all vital signs",
                "6. STANDBY for medical guidance"
            ],
            EmergencyType.NITROGEN_LEAK: [
                "1. ISOLATE nitrogen supply lines",
                "2. CHECK for system pressure drops",
                "3. ACTIVATE atmospheric monitoring",
                "4. NOTIFY ground control",
                "5. PREPARE backup pressurization",
                "6. MONITOR for fire suppression impact"
            ],
            EmergencyType.SAFETY_SYSTEM_FAILURE: [
                "1. ACTIVATE manual safety controls",
                "2. VERIFY backup systems operational", 
                "3. IMMEDIATE ground control contact",
                "4. ISOLATE affected systems",
                "5. PREPARE emergency shutdown",
                "6. DOCUMENT system status"
            ]
        }
        
        return checklists.get(emergency_type, [
            "1. SECURE area immediately",
            "2. CONTACT ground control",
            "3. FOLLOW standard emergency procedures"
        ])

def assess_detection_criticality(detection_data: Dict) -> Dict:
    """Assess criticality of detected equipment"""
    
    detections = detection_data.get('detections', [])
    assessment = {
        "overall_status": "NOMINAL",
        "critical_items": [],
        "missing_equipment": [],
        "low_confidence_detections": [],
        "recommendations": []
    }
    
    detected_equipment = {d['label'].lower().replace(' ', '_') for d in detections}
    
    for equipment, config in SpaceStationEquipment.EQUIPMENT_CONFIG.items():
        if equipment not in detected_equipment:
            assessment["missing_equipment"].append({
                "equipment": equipment,
                "criticality": config["criticality"].value,
                "description": config["description"],
                "emergency_type": config["emergency_type"].value
            })
            
            if config["criticality"] == Priority.CRITICAL:
                assessment["overall_status"] = "CRITICAL"
                assessment["critical_items"].append(equipment)
    
    # Check confidence levels
    for detection in detections:
        if detection['confidence'] < 0.7:  # Space missions require high confidence
            assessment["low_confidence_detections"].append({
                "equipment": detection['label'],
                "confidence": detection['confidence'],
                "status": "REQUIRES_VISUAL_CONFIRMATION"
            })
    
    # Generate recommendations
    if assessment["critical_items"]:
        assessment["recommendations"].append("IMMEDIATE: Locate and verify critical safety equipment")
    if assessment["missing_equipment"]:
        assessment["recommendations"].append("PRIORITY: Conduct equipment inventory check")
    if assessment["low_confidence_detections"]:
        assessment["recommendations"].append("ACTION: Visual confirmation required for flagged items")
    
    return assessment

def generate_response_protocol(detection_data: Dict) -> List[Dict]:
    """Generate automated response protocols"""
    
    protocols = []
    assessment = assess_detection_criticality(detection_data)
    
    if assessment["overall_status"] == "CRITICAL":
        protocols.append({
            "priority": "IMMEDIATE",
            "action": "EMERGENCY_RESPONSE_ACTIVATION",
            "description": "Critical safety equipment not detected - activate emergency protocols",
            "max_response_time": "30 seconds",
            "crew_action_required": True
        })
    
    for missing_item in assessment["missing_equipment"]:
        equipment = missing_item["equipment"]
        config = SpaceStationEquipment.EQUIPMENT_CONFIG.get(equipment, {})
        
        protocols.append({
            "priority": missing_item["criticality"],
            "action": f"LOCATE_{equipment.upper()}",
            "description": f"Locate and verify {config.get('description', equipment)}",
            "max_response_time": f"{config.get('max_response_time', 60)} seconds",
            "emergency_checklist": CrewSafetyProtocol.generate_emergency_checklist(
                EmergencyType(missing_item["emergency_type"])
            )
        })
    
    return protocols

class SpaceStationAlertSystem:
    """Mission-critical alert system for space station operations"""
    
    @staticmethod
    def create_nasa_alert(
        detection_result: Dict,
        station_module: str = "UNKNOWN",
        crew_member: Optional[str] = None
    ) -> Dict:
        """Create NASA-standard emergency alert"""
        
        assessment = assess_detection_criticality(detection_result)
        mission_time = f"GMT {datetime.utcnow().strftime('%j:%H:%M:%S')}"
        
        alert = {
            "alert_type": "EQUIPMENT_STATUS_ALERT",
            "mission_time": mission_time,
            "timestamp_utc": datetime.utcnow().isoformat(),
            "station_module": station_module,
            "crew_member": crew_member,
            "criticality": assessment["overall_status"],
            "alert_id": f"ESA_{datetime.utcnow().strftime('%Y%j_%H%M%S')}",
            "detection_summary": {
                "total_detections": len(detection_result.get('detections', [])),
                "detected_equipment": [d['label'] for d in detection_result.get('detections', [])],
                "missing_critical": assessment["critical_items"],
                "confidence_issues": len(assessment["low_confidence_detections"])
            },
            "required_actions": generate_response_protocol(detection_result),
            "ground_control_notification": assessment["overall_status"] in ["CRITICAL", "HIGH"],
            "crew_acknowledgment_required": True if assessment["critical_items"] else False
        }
        
        return alert

def generate_crew_safety_report(detections_history: List[Dict]) -> Dict:
    """Generate comprehensive crew safety status report"""
    
    report = {
        "report_id": f"CSR_{datetime.utcnow().strftime('%Y%j_%H%M')}",
        "generation_time": datetime.utcnow().isoformat(),
        "mission_day": datetime.utcnow().strftime('%j'),
        "equipment_status": {},
        "trend_analysis": {},
        "recommendations": [],
        "overall_safety_score": 100
    }
    
    # Analyze equipment availability trends
    for equipment, config in SpaceStationEquipment.EQUIPMENT_CONFIG.items():
        recent_detections = [
            d for d in detections_history[-50:]  # Last 50 detections
            if any(det['label'].lower().replace(' ', '_') == equipment 
                  for det in d.get('detections', []))
        ]
        
        detection_rate = len(recent_detections) / min(50, len(detections_history)) if detections_history else 0
        
        status = {
            "equipment": equipment,
            "detection_rate": detection_rate,
            "criticality": config["criticality"].value,
            "last_detected": recent_detections[-1]['timestamp'] if recent_detections else None,
            "status": "AVAILABLE" if detection_rate > 0.8 else "CONCERNING" if detection_rate > 0.5 else "CRITICAL"
        }
        
        if status["status"] == "CRITICAL":
            report["overall_safety_score"] -= 20
        elif status["status"] == "CONCERNING":
            report["overall_safety_score"] -= 10
            
        report["equipment_status"][equipment] = status
    
    # Generate recommendations based on analysis
    critical_equipment = [eq for eq, status in report["equipment_status"].items() 
                         if status["status"] == "CRITICAL"]
    
    if critical_equipment:
        report["recommendations"].append({
            "priority": "IMMEDIATE",
            "action": f"Locate and verify: {', '.join(critical_equipment)}",
            "rationale": "Critical safety equipment not consistently detected"
        })
    
    report["recommendations"].append({
        "priority": "ROUTINE",
        "action": "Conduct daily equipment inventory using AI detection system", 
        "rationale": "Maintain continuous safety equipment awareness"
    })
    
    return report

# Export functions for integration with main app
__all__ = [
    'SpaceStationEquipment',
    'MissionLog', 
    'CrewSafetyProtocol',
    'SpaceStationAlertSystem',
    'assess_detection_criticality',
    'generate_response_protocol',
    'generate_crew_safety_report',
    'EmergencyType',
    'Priority'
]