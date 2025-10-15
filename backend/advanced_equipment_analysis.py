# Advanced Equipment Analysis System for NASA Space Station
# Optimized for 75% accuracy detection model

from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple, Any
import json
import numpy as np
from pathlib import Path
from collections import defaultdict, deque
import math
import cv2
from dataclasses import dataclass, asdict
from enum import Enum

class ConfidenceLevel(Enum):
    HIGH = "HIGH"           # >80% - Trust the detection
    MEDIUM = "MEDIUM"       # 60-80% - Flag for review
    LOW = "LOW"             # <60% - Manual verification required
    UNCERTAIN = "UNCERTAIN" # <50% - Highly unreliable

class EquipmentStatus(Enum):
    AVAILABLE = "AVAILABLE"         # High confidence, good position
    NEEDS_REVIEW = "NEEDS_REVIEW"   # Medium confidence or issues detected
    MISSING = "MISSING"             # Not detected recently
    CRITICAL = "CRITICAL"           # Missing critical equipment

@dataclass
class DetectionHistory:
    """Track detection history for temporal analysis"""
    timestamp: str
    confidence: float
    bbox: List[float]
    image_path: str
    additional_data: Dict = None

@dataclass
class EquipmentAnalysis:
    """Comprehensive equipment analysis results"""
    equipment_type: str
    status: EquipmentStatus
    confidence_level: ConfidenceLevel
    accessibility_score: float
    condition_score: float
    last_seen: Optional[str]
    position_analysis: Dict
    recommendations: List[str]
    flags: List[str]

class SmartEquipmentPositioning:
    """Analyze equipment positioning and accessibility"""
    
    EQUIPMENT_REQUIREMENTS = {
        'fire_extinguisher': {
            'min_clearance': 0.5,  # meters
            'max_height': 1.8,     # meters from floor
            'required_access_angles': 270,  # degrees of access required
            'critical_distance': 3.0  # max distance from work areas
        },
        'oxygen_tank': {
            'min_clearance': 0.8,
            'max_height': 1.5,
            'required_access_angles': 180,
            'critical_distance': 5.0
        },
        'first_aid_box': {
            'min_clearance': 0.3,
            'max_height': 1.6,
            'required_access_angles': 180,
            'critical_distance': 4.0
        },
        'nitrogen_tank': {
            'min_clearance': 1.0,
            'max_height': 2.0,
            'required_access_angles': 180,
            'critical_distance': 10.0
        },
        'fire_alarm': {
            'min_clearance': 0.2,
            'max_height': 2.5,
            'required_access_angles': 360,
            'critical_distance': 8.0
        },
        'safety_switch_panel': {
            'min_clearance': 0.4,
            'max_height': 1.7,
            'required_access_angles': 180,
            'critical_distance': 2.0
        },
        'emergency_phone': {
            'min_clearance': 0.3,
            'max_height': 1.5,
            'required_access_angles': 180,
            'critical_distance': 6.0
        }
    }

    @staticmethod
    def analyze_position(detection: Dict, image_dimensions: Tuple[int, int]) -> Dict:
        """Analyze equipment position from detection data"""
        
        bbox = detection.get('bbox', [])
        confidence = detection.get('confidence', 0.0)
        equipment_type = detection.get('label', '').lower().replace(' ', '_')
        
        if len(bbox) != 4:
            return {'error': 'Invalid bounding box data'}
        
        # Calculate position metrics
        x, y, w, h = bbox
        img_width, img_height = image_dimensions
        
        # Normalize coordinates (0-1 range)
        center_x = (x + w/2) / img_width
        center_y = (y + h/2) / img_height
        bbox_area = (w * h) / (img_width * img_height)
        
        # Get equipment requirements
        requirements = SmartEquipmentPositioning.EQUIPMENT_REQUIREMENTS.get(
            equipment_type, SmartEquipmentPositioning.EQUIPMENT_REQUIREMENTS['fire_extinguisher']
        )
        
        # Analyze positioning
        analysis = {
            'equipment_type': equipment_type,
            'confidence': confidence,
            'position': {
                'center_x': center_x,
                'center_y': center_y,
                'relative_size': bbox_area
            },
            'accessibility': SmartEquipmentPositioning._analyze_accessibility(
                center_x, center_y, bbox_area, requirements
            ),
            'placement_score': SmartEquipmentPositioning._calculate_placement_score(
                center_x, center_y, bbox_area, confidence, requirements
            ),
            'recommendations': [],
            'flags': []
        }
        
        # Add confidence-based recommendations
        if confidence < 0.6:
            analysis['flags'].append('LOW_CONFIDENCE_DETECTION')
            analysis['recommendations'].append('Manual verification required - detection confidence below 60%')
        elif confidence < 0.8:
            analysis['flags'].append('MEDIUM_CONFIDENCE_DETECTION')
            analysis['recommendations'].append('Visual confirmation recommended - detection confidence below 80%')
        
        # Add positioning recommendations
        if analysis['placement_score'] < 0.7:
            analysis['recommendations'].extend(
                SmartEquipmentPositioning._generate_positioning_recommendations(analysis)
            )
        
        return analysis
    
    @staticmethod
    def _analyze_accessibility(center_x: float, center_y: float, size: float, requirements: Dict) -> Dict:
        """Analyze equipment accessibility"""
        
        # Simple accessibility heuristics
        edge_distance = min(center_x, 1 - center_x, center_y, 1 - center_y)
        height_score = 1.0 - abs(center_y - 0.6)  # Optimal height around 60% from top
        size_score = min(1.0, size * 5)  # Larger objects are more accessible
        
        accessibility_score = (edge_distance + height_score + size_score) / 3
        
        return {
            'score': accessibility_score,
            'edge_distance': edge_distance,
            'height_appropriateness': height_score,
            'size_visibility': size_score,
            'assessment': 'Good' if accessibility_score > 0.7 else 'Needs Improvement' if accessibility_score > 0.4 else 'Poor'
        }
    
    @staticmethod
    def _calculate_placement_score(center_x: float, center_y: float, size: float, 
                                 confidence: float, requirements: Dict) -> float:
        """Calculate overall placement score"""
        
        # Weighted scoring
        accessibility_weight = 0.3
        visibility_weight = 0.3
        confidence_weight = 0.4
        
        # Accessibility score (distance from edges)
        accessibility = min(center_x, 1 - center_x, center_y, 1 - center_y) * 2
        
        # Visibility score (size and position)
        visibility = min(1.0, size * 3) * (1 - abs(center_y - 0.5))
        
        # Confidence score
        confidence_score = confidence
        
        overall_score = (
            accessibility * accessibility_weight +
            visibility * visibility_weight +
            confidence_score * confidence_weight
        )
        
        return min(1.0, overall_score)
    
    @staticmethod
    def _generate_positioning_recommendations(analysis: Dict) -> List[str]:
        """Generate specific positioning recommendations"""
        recommendations = []
        
        position = analysis['position']
        accessibility = analysis['accessibility']
        
        if accessibility['height_appropriateness'] < 0.5:
            if position['center_y'] < 0.3:
                recommendations.append("Equipment positioned too high - consider lowering for better crew access")
            elif position['center_y'] > 0.8:
                recommendations.append("Equipment positioned too low - may be difficult to access in microgravity")
        
        if accessibility['edge_distance'] < 0.2:
            recommendations.append("Equipment too close to image edge - may indicate poor mounting location")
        
        if position['relative_size'] < 0.01:
            recommendations.append("Equipment appears small in frame - may be too far from camera or poorly positioned")
        
        if accessibility['score'] < 0.5:
            recommendations.append("Overall accessibility is poor - consider repositioning equipment")
        
        return recommendations

class EquipmentStatusDashboard:
    """Real-time equipment status tracking and dashboard"""
    
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.status_file = data_dir / "equipment_status.json"
        self.history_file = data_dir / "detection_history.json"
        self.max_history_per_equipment = 100
        
        # Initialize data structures
        self.equipment_status = self._load_equipment_status()
        self.detection_history = self._load_detection_history()
    
    def _load_equipment_status(self) -> Dict:
        """Load equipment status data"""
        if self.status_file.exists():
            try:
                with open(self.status_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        return {}
    
    def _save_equipment_status(self):
        """Save equipment status data"""
        with open(self.status_file, 'w') as f:
            json.dump(self.equipment_status, f, indent=2)
    
    def _load_detection_history(self) -> Dict:
        """Load detection history data"""
        if self.history_file.exists():
            try:
                with open(self.history_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        return defaultdict(list)
    
    def _save_detection_history(self):
        """Save detection history data"""
        with open(self.history_file, 'w') as f:
            json.dump(dict(self.detection_history), f, indent=2)
    
    def update_equipment_detection(self, equipment_type: str, detection_data: Dict, 
                                 image_path: str, analysis: Dict):
        """Update equipment detection and status"""
        
        timestamp = datetime.now().isoformat()
        confidence = detection_data.get('confidence', 0.0)
        
        # Determine confidence level
        if confidence >= 0.8:
            confidence_level = ConfidenceLevel.HIGH
        elif confidence >= 0.6:
            confidence_level = ConfidenceLevel.MEDIUM
        elif confidence >= 0.5:
            confidence_level = ConfidenceLevel.LOW
        else:
            confidence_level = ConfidenceLevel.UNCERTAIN
        
        # Determine equipment status
        placement_score = analysis.get('placement_score', 0.5)
        
        if confidence_level == ConfidenceLevel.HIGH and placement_score > 0.7:
            status = EquipmentStatus.AVAILABLE
        elif confidence_level in [ConfidenceLevel.MEDIUM, ConfidenceLevel.LOW] or placement_score <= 0.7:
            status = EquipmentStatus.NEEDS_REVIEW
        else:
            status = EquipmentStatus.CRITICAL
        
        # Update status
        self.equipment_status[equipment_type] = {
            'status': status.value,
            'confidence_level': confidence_level.value,
            'confidence': confidence,
            'last_seen': timestamp,
            'last_image': image_path,
            'placement_score': placement_score,
            'analysis': analysis,
            'detection_count': self.equipment_status.get(equipment_type, {}).get('detection_count', 0) + 1
        }
        
        # Update history
        history_entry = {
            'timestamp': timestamp,
            'confidence': confidence,
            'bbox': detection_data.get('bbox', []),
            'image_path': image_path,
            'analysis': analysis
        }
        
        self.detection_history[equipment_type].append(history_entry)
        
        # Limit history size
        if len(self.detection_history[equipment_type]) > self.max_history_per_equipment:
            self.detection_history[equipment_type] = self.detection_history[equipment_type][-self.max_history_per_equipment:]
        
        # Save data
        self._save_equipment_status()
        self._save_detection_history()
    
    def get_equipment_status_summary(self) -> Dict:
        """Get comprehensive equipment status summary"""
        
        now = datetime.now()
        summary = {
            'overall_status': 'NOMINAL',
            'total_equipment_types': len(SmartEquipmentPositioning.EQUIPMENT_REQUIREMENTS),
            'detected_equipment_types': len(self.equipment_status),
            'high_confidence_detections': 0,
            'needs_review': 0,
            'missing_equipment': [],
            'critical_alerts': [],
            'equipment_details': {},
            'last_updated': now.isoformat()
        }
        
        # Analyze each equipment type
        for equipment_type in SmartEquipmentPositioning.EQUIPMENT_REQUIREMENTS:
            if equipment_type in self.equipment_status:
                status_data = self.equipment_status[equipment_type]
                
                # Count by confidence level
                if status_data['confidence_level'] == ConfidenceLevel.HIGH.value:
                    summary['high_confidence_detections'] += 1
                elif status_data['status'] == EquipmentStatus.NEEDS_REVIEW.value:
                    summary['needs_review'] += 1
                
                # Check for critical alerts
                if status_data['confidence'] < 0.6:
                    summary['critical_alerts'].append({
                        'equipment': equipment_type,
                        'issue': 'Low detection confidence',
                        'confidence': status_data['confidence'],
                        'last_seen': status_data['last_seen']
                    })
                
                # Check if equipment hasn't been seen recently (24 hours)
                last_seen = datetime.fromisoformat(status_data['last_seen'])
                if (now - last_seen).total_seconds() > 86400:  # 24 hours
                    summary['missing_equipment'].append({
                        'equipment': equipment_type,
                        'last_seen': status_data['last_seen'],
                        'hours_ago': round((now - last_seen).total_seconds() / 3600, 1)
                    })
                
                summary['equipment_details'][equipment_type] = {
                    'status': status_data['status'],
                    'confidence': status_data['confidence'],
                    'confidence_level': status_data['confidence_level'],
                    'placement_score': status_data['placement_score'],
                    'last_seen': status_data['last_seen'],
                    'detection_count': status_data['detection_count'],
                    'recommendations': status_data['analysis'].get('recommendations', []),
                    'flags': status_data['analysis'].get('flags', [])
                }
            else:
                # Equipment never detected
                summary['missing_equipment'].append({
                    'equipment': equipment_type,
                    'last_seen': 'Never detected',
                    'hours_ago': 'N/A'
                })
        
        # Determine overall status
        if summary['critical_alerts'] or len(summary['missing_equipment']) > 2:
            summary['overall_status'] = 'CRITICAL'
        elif summary['needs_review'] > 0 or len(summary['missing_equipment']) > 0:
            summary['overall_status'] = 'NEEDS_ATTENTION'
        else:
            summary['overall_status'] = 'NOMINAL'
        
        return summary
    
    def get_equipment_trends(self, equipment_type: str, days: int = 7) -> Dict:
        """Get equipment detection trends over time"""
        
        if equipment_type not in self.detection_history:
            return {'error': f'No history found for {equipment_type}'}
        
        history = self.detection_history[equipment_type]
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Filter recent history
        recent_history = [
            entry for entry in history
            if datetime.fromisoformat(entry['timestamp']) >= cutoff_date
        ]
        
        if not recent_history:
            return {'error': f'No recent history for {equipment_type}'}
        
        # Calculate trends
        confidences = [entry['confidence'] for entry in recent_history]
        placement_scores = [entry['analysis'].get('placement_score', 0.5) for entry in recent_history]
        
        trends = {
            'equipment_type': equipment_type,
            'period_days': days,
            'total_detections': len(recent_history),
            'average_confidence': sum(confidences) / len(confidences),
            'confidence_trend': 'improving' if confidences[-1] > confidences[0] else 'declining',
            'average_placement_score': sum(placement_scores) / len(placement_scores),
            'high_confidence_detections': len([c for c in confidences if c >= 0.8]),
            'low_confidence_detections': len([c for c in confidences if c < 0.6]),
            'detection_frequency': len(recent_history) / days,
            'latest_detection': recent_history[-1]['timestamp'],
            'consistency_score': 1.0 - (max(confidences) - min(confidences))  # Higher is more consistent
        }
        
        return trends

class EquipmentConditionAssessment:
    """Visual condition assessment with confidence-based flagging"""
    
    @staticmethod
    def assess_condition(detection_data: Dict, analysis: Dict, 
                        historical_data: List[Dict] = None) -> Dict:
        """Assess equipment condition from detection data"""
        
        confidence = detection_data.get('confidence', 0.0)
        equipment_type = detection_data.get('label', '').lower().replace(' ', '_')
        
        # Base condition assessment
        condition_assessment = {
            'equipment_type': equipment_type,
            'confidence': confidence,
            'condition_score': EquipmentConditionAssessment._calculate_base_condition_score(detection_data),
            'reliability_flags': [],
            'condition_indicators': {},
            'recommendations': [],
            'requires_inspection': False
        }
        
        # Confidence-based flagging
        if confidence < 0.5:
            condition_assessment['reliability_flags'].append('VERY_LOW_CONFIDENCE')
            condition_assessment['recommendations'].append('Immediate manual inspection required - AI confidence extremely low')
            condition_assessment['requires_inspection'] = True
        elif confidence < 0.6:
            condition_assessment['reliability_flags'].append('LOW_CONFIDENCE')
            condition_assessment['recommendations'].append('Manual verification recommended - AI confidence low')
            condition_assessment['requires_inspection'] = True
        elif confidence < 0.8:
            condition_assessment['reliability_flags'].append('MEDIUM_CONFIDENCE')
            condition_assessment['recommendations'].append('Visual confirmation suggested - moderate AI confidence')
        
        # Historical trend analysis
        if historical_data and len(historical_data) > 3:
            trend_analysis = EquipmentConditionAssessment._analyze_trends(historical_data)
            condition_assessment.update(trend_analysis)
        
        # Equipment-specific condition indicators
        condition_assessment['condition_indicators'] = EquipmentConditionAssessment._get_equipment_specific_indicators(
            equipment_type, detection_data, analysis
        )
        
        return condition_assessment
    
    @staticmethod
    def _calculate_base_condition_score(detection_data: Dict) -> float:
        """Calculate base condition score from detection data"""
        
        confidence = detection_data.get('confidence', 0.0)
        bbox = detection_data.get('bbox', [])
        
        # Base score from confidence
        score = confidence
        
        # Adjust based on bounding box characteristics
        if len(bbox) == 4:
            w, h = bbox[2], bbox[3]
            aspect_ratio = w / h if h > 0 else 1.0
            
            # Penalize extreme aspect ratios (may indicate partial occlusion)
            if aspect_ratio < 0.3 or aspect_ratio > 3.0:
                score *= 0.9
        
        return min(1.0, score)
    
    @staticmethod
    def _analyze_trends(historical_data: List[Dict]) -> Dict:
        """Analyze condition trends from historical data"""
        
        confidences = [entry.get('confidence', 0.0) for entry in historical_data]
        timestamps = [entry.get('timestamp', '') for entry in historical_data]
        
        trend_analysis = {
            'trend_analysis': {
                'confidence_trend': 'stable',
                'average_confidence': sum(confidences) / len(confidences),
                'confidence_variance': np.var(confidences) if len(confidences) > 1 else 0.0,
                'detection_consistency': len([c for c in confidences if c > 0.6]) / len(confidences),
                'recent_performance': confidences[-3:] if len(confidences) >= 3 else confidences
            }
        }
        
        # Determine trend
        if len(confidences) >= 5:
            recent_avg = sum(confidences[-3:]) / 3
            older_avg = sum(confidences[-6:-3]) / 3 if len(confidences) >= 6 else sum(confidences[:-3]) / max(1, len(confidences) - 3)
            
            if recent_avg > older_avg + 0.1:
                trend_analysis['trend_analysis']['confidence_trend'] = 'improving'
            elif recent_avg < older_avg - 0.1:
                trend_analysis['trend_analysis']['confidence_trend'] = 'declining'
        
        return trend_analysis
    
    @staticmethod
    def _get_equipment_specific_indicators(equipment_type: str, detection_data: Dict, 
                                         analysis: Dict) -> Dict:
        """Get equipment-specific condition indicators"""
        
        indicators = {
            'visibility': 'Good' if detection_data.get('confidence', 0) > 0.7 else 'Poor',
            'positioning': 'Acceptable' if analysis.get('placement_score', 0) > 0.6 else 'Needs Attention',
            'accessibility': analysis.get('accessibility', {}).get('assessment', 'Unknown')
        }
        
        # Equipment-specific indicators
        equipment_indicators = {
            'fire_extinguisher': {
                'pressure_gauge_visible': detection_data.get('confidence', 0) > 0.8,
                'mounting_secure': analysis.get('accessibility', {}).get('score', 0) > 0.7,
                'unobstructed_access': analysis.get('placement_score', 0) > 0.8
            },
            'oxygen_tank': {
                'tank_integrity_visible': detection_data.get('confidence', 0) > 0.8,
                'connection_accessible': analysis.get('accessibility', {}).get('score', 0) > 0.7,
                'proper_positioning': analysis.get('placement_score', 0) > 0.7
            },
            'first_aid_box': {
                'seal_integrity': detection_data.get('confidence', 0) > 0.8,
                'easily_accessible': analysis.get('accessibility', {}).get('score', 0) > 0.8,
                'content_level_checkable': detection_data.get('confidence', 0) > 0.7
            }
        }
        
        indicators.update(equipment_indicators.get(equipment_type, {}))
        return indicators

class IntelligentAutoLabeling:
    """Smart labeling system for improving training data"""
    
    @staticmethod
    def generate_labeling_suggestions(detection_results: List[Dict], 
                                    image_path: str, confidence_threshold: float = 0.6) -> Dict:
        """Generate intelligent labeling suggestions"""
        
        suggestions = {
            'image_path': image_path,
            'total_detections': len(detection_results),
            'high_confidence_count': 0,
            'needs_review_count': 0,
            'auto_label_suggestions': [],
            'manual_review_required': [],
            'quality_flags': [],
            'labeling_priority': 'LOW'
        }
        
        for i, detection in enumerate(detection_results):
            confidence = detection.get('confidence', 0.0)
            label = detection.get('label', 'unknown')
            bbox = detection.get('bbox', [])
            
            suggestion = {
                'detection_id': i,
                'label': label,
                'confidence': confidence,
                'bbox': bbox,
                'suggested_action': '',
                'reasons': []
            }
            
            if confidence >= 0.8:
                suggestions['high_confidence_count'] += 1
                suggestion['suggested_action'] = 'AUTO_ACCEPT'
                suggestion['reasons'].append('High confidence detection')
                suggestions['auto_label_suggestions'].append(suggestion)
                
            elif confidence >= confidence_threshold:
                suggestions['needs_review_count'] += 1
                suggestion['suggested_action'] = 'REVIEW_SUGGESTED'
                suggestion['reasons'].append('Medium confidence - manual verification recommended')
                suggestions['manual_review_required'].append(suggestion)
                
            else:
                suggestion['suggested_action'] = 'MANUAL_REQUIRED'
                suggestion['reasons'].append('Low confidence - manual labeling required')
                suggestions['manual_review_required'].append(suggestion)
            
            # Additional quality checks
            if len(bbox) == 4:
                w, h = bbox[2], bbox[3]
                area = w * h
                
                if area < 100:  # Very small detection
                    suggestion['reasons'].append('Very small detection area - may be false positive')
                    suggestions['quality_flags'].append(f'Small detection area for {label}')
                
                aspect_ratio = w / h if h > 0 else 1
                if aspect_ratio < 0.2 or aspect_ratio > 5.0:
                    suggestion['reasons'].append('Unusual aspect ratio - verify bounding box accuracy')
                    suggestions['quality_flags'].append(f'Unusual aspect ratio for {label}')
        
        # Determine labeling priority
        if suggestions['needs_review_count'] > 3:
            suggestions['labeling_priority'] = 'HIGH'
        elif suggestions['needs_review_count'] > 1:
            suggestions['labeling_priority'] = 'MEDIUM'
        
        return suggestions
    
    @staticmethod
    def suggest_bbox_improvements(detection: Dict, image_dimensions: Tuple[int, int]) -> Dict:
        """Suggest bounding box improvements"""
        
        bbox = detection.get('bbox', [])
        confidence = detection.get('confidence', 0.0)
        
        if len(bbox) != 4:
            return {'error': 'Invalid bounding box'}
        
        x, y, w, h = bbox
        img_width, img_height = image_dimensions
        
        suggestions = {
            'original_bbox': bbox,
            'confidence': confidence,
            'improvements': [],
            'quality_score': IntelligentAutoLabeling._calculate_bbox_quality(bbox, img_width, img_height)
        }
        
        # Check if bbox is too small
        area_ratio = (w * h) / (img_width * img_height)
        if area_ratio < 0.01:
            suggestions['improvements'].append({
                'issue': 'Bounding box too small',
                'suggestion': 'Consider expanding bounding box to include more of the object',
                'severity': 'medium'
            })
        
        # Check if bbox is at image edges
        edge_threshold = 5  # pixels
        if x < edge_threshold or y < edge_threshold:
            suggestions['improvements'].append({
                'issue': 'Bounding box at image edge',
                'suggestion': 'Object may be partially cut off - verify complete object is visible',
                'severity': 'low'
            })
        
        if (x + w) > (img_width - edge_threshold) or (y + h) > (img_height - edge_threshold):
            suggestions['improvements'].append({
                'issue': 'Bounding box extends to image edge',
                'suggestion': 'Object may be partially cut off - verify complete object is visible',
                'severity': 'low'
            })
        
        # Check aspect ratio reasonableness
        aspect_ratio = w / h if h > 0 else 1
        if aspect_ratio < 0.1 or aspect_ratio > 10:
            suggestions['improvements'].append({
                'issue': f'Unusual aspect ratio: {aspect_ratio:.2f}',
                'suggestion': 'Verify bounding box accurately encompasses the object',
                'severity': 'high'
            })
        
        return suggestions
    
    @staticmethod
    def _calculate_bbox_quality(bbox: List[float], img_width: int, img_height: int) -> float:
        """Calculate bounding box quality score"""
        
        x, y, w, h = bbox
        
        # Size quality (not too small or too large)
        area_ratio = (w * h) / (img_width * img_height)
        size_quality = 1.0 if 0.01 <= area_ratio <= 0.5 else max(0.0, 1.0 - abs(area_ratio - 0.1))
        
        # Position quality (not too close to edges)
        edge_distance = min(x, y, img_width - (x + w), img_height - (y + h))
        position_quality = min(1.0, edge_distance / 20.0)  # Good if >20 pixels from edge
        
        # Aspect ratio quality
        aspect_ratio = w / h if h > 0 else 1
        aspect_quality = 1.0 if 0.2 <= aspect_ratio <= 5.0 else max(0.0, 1.0 - abs(math.log10(aspect_ratio)))
        
        # Combined quality score
        quality_score = (size_quality + position_quality + aspect_quality) / 3
        return min(1.0, quality_score)

class SpaceStationContextRecognition:
    """Recognize space station context from images"""
    
    STATION_MODULES = {
        'harmony': ['node', 'connecting', 'crew quarters', 'white walls'],
        'destiny': ['laboratory', 'experiment racks', 'blue panels'],
        'columbus': ['european lab', 'experiment facilities', 'gray panels'],
        'kibo': ['japanese module', 'robotic arm', 'airlock'],
        'unity': ['node', 'connecting hub', 'first component'],
        'tranquility': ['life support', 'exercise', 'waste management'],
        'cupola': ['observation', 'windows', 'earth view'],
        'quest': ['airlock', 'eva preparation', 'spacesuits']
    }
    
    @staticmethod
    def analyze_context(detection_results: List[Dict], image_path: str, 
                       confidence_threshold: float = 0.6) -> Dict:
        """Analyze space station context from detection results"""
        
        context_analysis = {
            'image_path': image_path,
            'timestamp': datetime.now().isoformat(),
            'equipment_context': SpaceStationContextRecognition._analyze_equipment_context(detection_results),
            'module_prediction': SpaceStationContextRecognition._predict_module(detection_results),
            'safety_assessment': SpaceStationContextRecognition._assess_safety_context(detection_results),
            'confidence_assessment': SpaceStationContextRecognition._assess_overall_confidence(detection_results),
            'contextual_recommendations': []
        }
        
        # Generate contextual recommendations based on analysis
        context_analysis['contextual_recommendations'] = SpaceStationContextRecognition._generate_contextual_recommendations(
            context_analysis, confidence_threshold
        )
        
        return context_analysis
    
    @staticmethod
    def _analyze_equipment_context(detection_results: List[Dict]) -> Dict:
        """Analyze equipment distribution and context"""
        
        equipment_count = defaultdict(int)
        high_confidence_equipment = defaultdict(int)
        total_confidence = 0
        
        for detection in detection_results:
            label = detection.get('label', '').lower().replace(' ', '_')
            confidence = detection.get('confidence', 0.0)
            
            equipment_count[label] += 1
            total_confidence += confidence
            
            if confidence >= 0.8:
                high_confidence_equipment[label] += 1
        
        return {
            'total_equipment_detected': len(detection_results),
            'equipment_types': len(equipment_count),
            'equipment_distribution': dict(equipment_count),
            'high_confidence_equipment': dict(high_confidence_equipment),
            'average_confidence': total_confidence / len(detection_results) if detection_results else 0,
            'equipment_density': 'High' if len(detection_results) > 5 else 'Medium' if len(detection_results) > 2 else 'Low'
        }
    
    @staticmethod
    def _predict_module(detection_results: List[Dict]) -> Dict:
        """Predict which ISS module based on equipment context"""
        
        equipment_types = [detection.get('label', '').lower().replace(' ', '_') for detection in detection_results]
        
        # Simple heuristic-based module prediction
        module_scores = {}
        
        # Laboratory modules likely to have more diverse equipment
        if len(set(equipment_types)) >= 4:
            module_scores['destiny'] = 0.7
            module_scores['columbus'] = 0.6
            module_scores['kibo'] = 0.5
        
        # Safety equipment concentration suggests crew areas
        safety_equipment = ['fire_extinguisher', 'fire_alarm', 'emergency_phone']
        safety_count = sum(1 for eq in equipment_types if eq in safety_equipment)
        
        if safety_count >= 2:
            module_scores['harmony'] = 0.8
            module_scores['unity'] = 0.6
            module_scores['tranquility'] = 0.5
        
        # Life support equipment suggests specific modules
        if 'oxygen_tank' in equipment_types or 'nitrogen_tank' in equipment_types:
            module_scores['tranquility'] = module_scores.get('tranquility', 0) + 0.3
        
        if not module_scores:
            return {'prediction': 'unknown', 'confidence': 0.0, 'reasoning': 'Insufficient context for module prediction'}
        
        best_module = max(module_scores, key=module_scores.get)
        return {
            'prediction': best_module,
            'confidence': module_scores[best_module],
            'all_scores': module_scores,
            'reasoning': f'Based on equipment distribution and safety equipment presence'
        }
    
    @staticmethod
    def _assess_safety_context(detection_results: List[Dict]) -> Dict:
        """Assess safety context from detected equipment"""
        
        critical_equipment = ['fire_extinguisher', 'oxygen_tank', 'fire_alarm', 'first_aid_box']
        safety_equipment_detected = []
        safety_confidence_levels = []
        
        for detection in detection_results:
            label = detection.get('label', '').lower().replace(' ', '_')
            confidence = detection.get('confidence', 0.0)
            
            if label in critical_equipment:
                safety_equipment_detected.append(label)
                safety_confidence_levels.append(confidence)
        
        safety_coverage = len(set(safety_equipment_detected)) / len(critical_equipment)
        avg_safety_confidence = sum(safety_confidence_levels) / len(safety_confidence_levels) if safety_confidence_levels else 0
        
        safety_status = 'GOOD' if safety_coverage >= 0.75 and avg_safety_confidence >= 0.7 else 'ADEQUATE' if safety_coverage >= 0.5 else 'CONCERNING'
        
        return {
            'safety_equipment_detected': safety_equipment_detected,
            'safety_coverage': safety_coverage,
            'average_safety_confidence': avg_safety_confidence,
            'safety_status': safety_status,
            'missing_critical_equipment': [eq for eq in critical_equipment if eq not in safety_equipment_detected],
            'recommendations': SpaceStationContextRecognition._get_safety_recommendations(safety_status, safety_coverage)
        }
    
    @staticmethod
    def _assess_overall_confidence(detection_results: List[Dict]) -> Dict:
        """Assess overall confidence in the detection results"""
        
        if not detection_results:
            return {'level': 'NO_DETECTIONS', 'score': 0.0, 'reliability': 'Cannot assess'}
        
        confidences = [detection.get('confidence', 0.0) for detection in detection_results]
        avg_confidence = sum(confidences) / len(confidences)
        min_confidence = min(confidences)
        max_confidence = max(confidences)
        
        high_conf_count = len([c for c in confidences if c >= 0.8])
        medium_conf_count = len([c for c in confidences if 0.6 <= c < 0.8])
        low_conf_count = len([c for c in confidences if c < 0.6])
        
        if avg_confidence >= 0.8 and min_confidence >= 0.6:
            level = 'HIGH'
            reliability = 'Reliable detections - high confidence in results'
        elif avg_confidence >= 0.6 and low_conf_count <= 1:
            level = 'MEDIUM'
            reliability = 'Moderately reliable - some detections may need verification'
        else:
            level = 'LOW'
            reliability = 'Low reliability - manual verification strongly recommended'
        
        return {
            'level': level,
            'score': avg_confidence,
            'reliability': reliability,
            'confidence_distribution': {
                'high': high_conf_count,
                'medium': medium_conf_count,
                'low': low_conf_count
            },
            'confidence_range': {'min': min_confidence, 'max': max_confidence}
        }
    
    @staticmethod
    def _generate_contextual_recommendations(context_analysis: Dict, 
                                           confidence_threshold: float) -> List[str]:
        """Generate contextual recommendations based on analysis"""
        
        recommendations = []
        
        # Confidence-based recommendations
        confidence_level = context_analysis['confidence_assessment']['level']
        if confidence_level == 'LOW':
            recommendations.append('Overall detection confidence is low - conduct manual equipment verification')
        elif confidence_level == 'MEDIUM':
            recommendations.append('Some detections have medium confidence - verify critical equipment visually')
        
        # Safety-based recommendations
        safety_status = context_analysis['safety_assessment']['safety_status']
        if safety_status == 'CONCERNING':
            recommendations.append('Critical safety equipment missing or undetected - immediate inspection required')
        elif safety_status == 'ADEQUATE':
            recommendations.append('Safety equipment coverage is adequate but could be improved')
        
        # Module-specific recommendations
        module_prediction = context_analysis['module_prediction']['prediction']
        if module_prediction != 'unknown':
            recommendations.append(f'Equipment configuration suggests {module_prediction.upper()} module - verify module-specific safety protocols')
        
        # Equipment density recommendations
        equipment_context = context_analysis['equipment_context']
        if equipment_context['equipment_density'] == 'Low':
            recommendations.append('Low equipment density detected - ensure all required equipment is present in this area')
        
        return recommendations
    
    @staticmethod
    def _get_safety_recommendations(safety_status: str, safety_coverage: float) -> List[str]:
        """Get safety-specific recommendations"""
        
        recommendations = []
        
        if safety_status == 'CONCERNING':
            recommendations.append('PRIORITY: Locate and verify missing critical safety equipment')
            recommendations.append('Conduct immediate safety equipment inventory check')
        elif safety_status == 'ADEQUATE':
            recommendations.append('Consider additional safety equipment placement for redundancy')
        else:
            recommendations.append('Safety equipment coverage is good - maintain current configuration')
        
        if safety_coverage < 1.0:
            recommendations.append('Some critical safety equipment types not detected - verify presence and accessibility')
        
        return recommendations

# Export all classes and functions
__all__ = [
    'SmartEquipmentPositioning',
    'EquipmentStatusDashboard', 
    'EquipmentConditionAssessment',
    'IntelligentAutoLabeling',
    'SpaceStationContextRecognition',
    'ConfidenceLevel',
    'EquipmentStatus',
    'DetectionHistory',
    'EquipmentAnalysis'
]