import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const AdvancedAnalysisDashboard = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [equipmentStatus, setEquipmentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('positioning');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.6);

  useEffect(() => {
    fetchEquipmentStatus();
    const interval = setInterval(fetchEquipmentStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchEquipmentStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/advanced-analysis/equipment-status');
      const data = await response.json();
      setEquipmentStatus(data.status_summary);
    } catch (error) {
      console.error('Error fetching equipment status:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setAnalysisResults(null);
    }
  };

  const runAnalysis = async (analysisType) => {
    if (!selectedFile) {
      alert('Please select an image first');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    if (analysisType === 'auto-labeling') {
      formData.append('confidence_threshold', confidenceThreshold);
    }

    try {
      const endpoint = `http://localhost:8000/advanced-analysis/${analysisType}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setAnalysisResults({ type: analysisType, data });
      setActiveTab(analysisType);
    } catch (error) {
      console.error(`Error running ${analysisType}:`, error);
      alert(`Analysis failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 0.8) return 'bg-green-500 text-white';
    if (confidence >= 0.6) return 'bg-yellow-500 text-black';
    if (confidence >= 0.5) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.8) return 'HIGH';
    if (confidence >= 0.6) return 'MEDIUM';
    if (confidence >= 0.5) return 'LOW';
    return 'UNCERTAIN';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'text-green-400';
      case 'NEEDS_REVIEW': return 'text-yellow-400';
      case 'MISSING': return 'text-orange-400';
      case 'CRITICAL': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const renderPositioningAnalysis = () => {
    if (!analysisResults || analysisResults.type !== 'equipment-positioning') return null;

    const data = analysisResults.data;

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white mb-4">📐 Equipment Positioning Analysis</h3>
        
        {data.positioning_analysis.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-700 rounded-lg p-6 border-l-4 border-blue-500"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-white capitalize">
                  {item.detection.label.replace('_', ' ')}
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getConfidenceBadge(item.detection.confidence)}`}>
                    {getConfidenceText(item.detection.confidence)}
                  </span>
                  <span className="text-gray-300 text-sm">
                    {(item.detection.confidence * 100).toFixed(1)}% confidence
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-300">Placement Score</div>
                <div className={`text-2xl font-bold ${
                  item.analysis.placement_score > 0.8 ? 'text-green-400' :
                  item.analysis.placement_score > 0.6 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {(item.analysis.placement_score * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Accessibility Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-600 p-3 rounded">
                <div className="text-xs text-gray-300">Edge Distance</div>
                <div className="text-lg font-bold text-white">
                  {(item.analysis.accessibility.edge_distance * 100).toFixed(0)}%
                </div>
              </div>
              <div className="bg-gray-600 p-3 rounded">
                <div className="text-xs text-gray-300">Height Score</div>
                <div className="text-lg font-bold text-white">
                  {(item.analysis.accessibility.height_appropriateness * 100).toFixed(0)}%
                </div>
              </div>
              <div className="bg-gray-600 p-3 rounded">
                <div className="text-xs text-gray-300">Accessibility</div>
                <div className={`text-sm font-bold ${
                  item.analysis.accessibility.assessment === 'Good' ? 'text-green-400' :
                  item.analysis.accessibility.assessment === 'Needs Improvement' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {item.analysis.accessibility.assessment}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {item.analysis.recommendations && item.analysis.recommendations.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-semibold text-gray-300 mb-2">Recommendations:</h5>
                <ul className="space-y-1">
                  {item.analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-yellow-200 flex items-start">
                      <span className="text-yellow-400 mr-2">⚠️</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Flags */}
            {item.analysis.flags && item.analysis.flags.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  {item.analysis.flags.map((flag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                      {flag.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderConditionAssessment = () => {
    if (!analysisResults || analysisResults.type !== 'condition-assessment') return null;

    const data = analysisResults.data;

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white mb-4">🔍 Equipment Condition Assessment</h3>
        
        {data.requires_inspection && (
          <div className="bg-red-900 border-2 border-red-500 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-bold text-red-200 mb-2">🚨 Manual Inspection Required</h4>
            <p className="text-red-200">
              One or more equipment items require manual inspection due to low detection confidence.
            </p>
          </div>
        )}

        {data.condition_assessments.map((assessment, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-700 rounded-lg p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-lg font-semibold text-white capitalize">
                {assessment.equipment_type.replace('_', ' ')}
              </h4>
              <div className="text-right">
                <div className="text-sm text-gray-300">Condition Score</div>
                <div className={`text-xl font-bold ${
                  assessment.assessment.condition_score > 0.8 ? 'text-green-400' :
                  assessment.assessment.condition_score > 0.6 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {(assessment.assessment.condition_score * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Reliability Flags */}
            {assessment.assessment.reliability_flags && assessment.assessment.reliability_flags.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-gray-300 mb-2">Reliability Flags:</h5>
                <div className="flex flex-wrap gap-2">
                  {assessment.assessment.reliability_flags.map((flag, idx) => (
                    <span key={idx} className={`px-2 py-1 text-xs rounded ${
                      flag === 'VERY_LOW_CONFIDENCE' ? 'bg-red-600 text-white' :
                      flag === 'LOW_CONFIDENCE' ? 'bg-orange-600 text-white' :
                      flag === 'MEDIUM_CONFIDENCE' ? 'bg-yellow-600 text-black' :
                      'bg-gray-600 text-white'
                    }`}>
                      {flag.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Condition Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {Object.entries(assessment.assessment.condition_indicators).map(([key, value]) => (
                <div key={key} className="bg-gray-600 p-3 rounded">
                  <div className="text-xs text-gray-300 capitalize">{key.replace('_', ' ')}</div>
                  <div className={`text-sm font-bold ${
                    typeof value === 'boolean' ? 
                      (value ? 'text-green-400' : 'text-red-400') :
                      value === 'Good' || value === 'Acceptable' ? 'text-green-400' :
                      value === 'Poor' || value === 'Needs Attention' ? 'text-red-400' :
                      'text-gray-400'
                  }`}>
                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {assessment.assessment.recommendations && assessment.assessment.recommendations.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-semibold text-gray-300 mb-2">Recommendations:</h5>
                <ul className="space-y-1">
                  {assessment.assessment.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-blue-200 flex items-start">
                      <span className="text-blue-400 mr-2">💡</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const renderAutoLabeling = () => {
    if (!analysisResults || analysisResults.type !== 'auto-labeling') return null;

    const data = analysisResults.data;

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white mb-4">🏷️ Intelligent Auto-Labeling</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-800 rounded-lg p-4">
            <h4 className="text-lg font-bold text-green-200">Auto-Accept</h4>
            <p className="text-2xl font-bold text-white">
              {data.labeling_suggestions.high_confidence_count}
            </p>
            <p className="text-sm text-green-200">High confidence detections</p>
          </div>
          <div className="bg-yellow-800 rounded-lg p-4">
            <h4 className="text-lg font-bold text-yellow-200">Needs Review</h4>
            <p className="text-2xl font-bold text-white">
              {data.labeling_suggestions.needs_review_count}
            </p>
            <p className="text-sm text-yellow-200">Manual verification needed</p>
          </div>
          <div className="bg-blue-800 rounded-lg p-4">
            <h4 className="text-lg font-bold text-blue-200">Priority Level</h4>
            <p className="text-xl font-bold text-white">
              {data.labeling_suggestions.labeling_priority}
            </p>
            <p className="text-sm text-blue-200">Labeling priority</p>
          </div>
        </div>

        {/* Auto-Accept Suggestions */}
        {data.labeling_suggestions.auto_label_suggestions.length > 0 && (
          <div className="bg-gray-700 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-bold text-green-400 mb-4">✅ Auto-Accept Suggestions</h4>
            <div className="space-y-3">
              {data.labeling_suggestions.auto_label_suggestions.map((suggestion, index) => (
                <div key={index} className="bg-green-900 rounded p-3 border-l-4 border-green-500">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">{suggestion.label}</span>
                    <span className="text-green-300">
                      {(suggestion.confidence * 100).toFixed(1)}% confidence
                    </span>
                  </div>
                  <div className="text-sm text-green-200 mt-1">
                    {suggestion.reasons.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Review Required */}
        {data.labeling_suggestions.manual_review_required.length > 0 && (
          <div className="bg-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-yellow-400 mb-4">⚠️ Manual Review Required</h4>
            <div className="space-y-3">
              {data.labeling_suggestions.manual_review_required.map((suggestion, index) => (
                <div key={index} className="bg-yellow-900 rounded p-3 border-l-4 border-yellow-500">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">{suggestion.label}</span>
                    <span className="text-yellow-300">
                      {(suggestion.confidence * 100).toFixed(1)}% confidence
                    </span>
                  </div>
                  <div className="text-sm text-yellow-200 mt-1">
                    {suggestion.reasons.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quality Flags */}
        {data.labeling_suggestions.quality_flags.length > 0 && (
          <div className="bg-red-900 rounded-lg p-4">
            <h4 className="text-lg font-bold text-red-200 mb-2">🚩 Quality Issues Detected</h4>
            <ul className="space-y-1">
              {data.labeling_suggestions.quality_flags.map((flag, index) => (
                <li key={index} className="text-red-200 text-sm">• {flag}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderSpaceContext = () => {
    if (!analysisResults || analysisResults.type !== 'space-context') return null;

    const data = analysisResults.data;

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white mb-4">🌌 Space Station Context Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Module Prediction */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-blue-400 mb-4">🏗️ Module Prediction</h4>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-white uppercase">
                {data.module_prediction.prediction}
              </div>
              <div className="text-sm text-gray-300">
                {(data.module_prediction.confidence * 100).toFixed(0)}% confidence
              </div>
            </div>
            <p className="text-sm text-gray-300 text-center">
              {data.module_prediction.reasoning}
            </p>
          </div>

          {/* Safety Assessment */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-green-400 mb-4">🛡️ Safety Assessment</h4>
            <div className="text-center mb-4">
              <div className={`text-2xl font-bold ${
                data.safety_assessment.safety_status === 'GOOD' ? 'text-green-400' :
                data.safety_assessment.safety_status === 'ADEQUATE' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {data.safety_assessment.safety_status}
              </div>
              <div className="text-sm text-gray-300 mt-2">
                Coverage: {(data.safety_assessment.safety_coverage * 100).toFixed(0)}%
              </div>
            </div>
            
            {data.safety_assessment.missing_critical_equipment.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-semibold text-red-300 mb-2">Missing Equipment:</h5>
                <div className="flex flex-wrap gap-2">
                  {data.safety_assessment.missing_critical_equipment.map((equipment, index) => (
                    <span key={index} className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                      {equipment.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Equipment Context */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-bold text-purple-400 mb-4">📊 Equipment Context</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {data.context_analysis.equipment_context.total_equipment_detected}
              </div>
              <div className="text-sm text-gray-300">Total Detected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {data.context_analysis.equipment_context.equipment_types}
              </div>
              <div className="text-sm text-gray-300">Equipment Types</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {(data.context_analysis.equipment_context.average_confidence * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-300">Avg Confidence</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                data.context_analysis.equipment_context.equipment_density === 'High' ? 'text-green-400' :
                data.context_analysis.equipment_context.equipment_density === 'Medium' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {data.context_analysis.equipment_context.equipment_density}
              </div>
              <div className="text-sm text-gray-300">Density</div>
            </div>
          </div>
        </div>

        {/* Confidence Assessment */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-bold text-orange-400 mb-4">📈 Confidence Assessment</h4>
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className={`text-xl font-bold ${
                data.confidence_assessment.level === 'HIGH' ? 'text-green-400' :
                data.confidence_assessment.level === 'MEDIUM' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {data.confidence_assessment.level} RELIABILITY
              </div>
              <div className="text-sm text-gray-300 mt-1">
                {data.confidence_assessment.reliability}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {(data.confidence_assessment.score * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-300">Overall Score</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-800 rounded p-3 text-center">
              <div className="text-lg font-bold text-white">
                {data.confidence_assessment.confidence_distribution.high}
              </div>
              <div className="text-xs text-green-200">High Confidence</div>
            </div>
            <div className="bg-yellow-800 rounded p-3 text-center">
              <div className="text-lg font-bold text-white">
                {data.confidence_assessment.confidence_distribution.medium}
              </div>
              <div className="text-xs text-yellow-200">Medium Confidence</div>
            </div>
            <div className="bg-red-800 rounded p-3 text-center">
              <div className="text-lg font-bold text-white">
                {data.confidence_assessment.confidence_distribution.low}
              </div>
              <div className="text-xs text-red-200">Low Confidence</div>
            </div>
          </div>
        </div>

        {/* Contextual Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="bg-blue-900 rounded-lg p-6">
            <h4 className="text-lg font-bold text-blue-200 mb-4">💡 Contextual Recommendations</h4>
            <ul className="space-y-2">
              {data.recommendations.map((rec, index) => (
                <li key={index} className="text-blue-200 flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">
          🚀 Advanced Equipment Analysis Dashboard
        </h1>
        <p className="text-gray-300">
          NASA-grade intelligent analysis for space station equipment detection
        </p>
      </motion.header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Control Panel */}
        <div className="xl:col-span-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-lg p-6 mb-6"
          >
            <h2 className="text-xl font-bold mb-4">🎛️ Analysis Controls</h2>
            
            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer focus:outline-none"
              />
              {selectedFile && (
                <div className="mt-2 text-sm text-green-400">
                  ✓ {selectedFile.name}
                </div>
              )}
            </div>

            {/* Confidence Threshold for Auto-Labeling */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Auto-Labeling Threshold: {confidenceThreshold}
              </label>
              <input
                type="range"
                min="0.3"
                max="0.9"
                step="0.1"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Analysis Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => runAnalysis('equipment-positioning')}
                disabled={loading || !selectedFile}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                📐 Positioning Analysis
              </button>
              
              <button
                onClick={() => runAnalysis('condition-assessment')}
                disabled={loading || !selectedFile}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                🔍 Condition Assessment
              </button>
              
              <button
                onClick={() => runAnalysis('auto-labeling')}
                disabled={loading || !selectedFile}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                🏷️ Auto-Labeling
              </button>
              
              <button
                onClick={() => runAnalysis('space-context')}
                disabled={loading || !selectedFile}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                🌌 Space Context
              </button>
            </div>

            {loading && (
              <div className="mt-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-blue-400">Analyzing...</span>
              </div>
            )}
          </motion.div>

          {/* Equipment Status Summary */}
          {equipmentStatus && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800 rounded-lg p-6"
            >
              <h2 className="text-xl font-bold mb-4">📊 Live Equipment Status</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Overall Status</span>
                  <span className={`font-bold ${
                    equipmentStatus.overall_status === 'NOMINAL' ? 'text-green-400' :
                    equipmentStatus.overall_status === 'NEEDS_ATTENTION' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {equipmentStatus.overall_status}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Detected Types</span>
                  <span className="text-white">
                    {equipmentStatus.detected_equipment_types}/{equipmentStatus.total_equipment_types}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">High Confidence</span>
                  <span className="text-green-400">{equipmentStatus.high_confidence_detections}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Needs Review</span>
                  <span className="text-yellow-400">{equipmentStatus.needs_review}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Missing Equipment</span>
                  <span className="text-red-400">{equipmentStatus.missing_equipment.length}</span>
                </div>
              </div>

              {equipmentStatus.critical_alerts.length > 0 && (
                <div className="mt-4 p-3 bg-red-900 rounded">
                  <h3 className="text-red-200 font-bold mb-2">🚨 Critical Alerts</h3>
                  <div className="space-y-1">
                    {equipmentStatus.critical_alerts.map((alert, index) => (
                      <div key={index} className="text-red-200 text-sm">
                        • {alert.equipment}: {alert.issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Analysis Results */}
        <div className="xl:col-span-3">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-lg p-6 min-h-96"
          >
            {!analysisResults ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-xl">Select an image and run analysis to see results</p>
                  <p className="text-sm mt-2">Advanced AI-powered equipment analysis for NASA space station operations</p>
                </div>
              </div>
            ) : (
              <div>
                {analysisResults.type === 'equipment-positioning' && renderPositioningAnalysis()}
                {analysisResults.type === 'condition-assessment' && renderConditionAssessment()}
                {analysisResults.type === 'auto-labeling' && renderAutoLabeling()}
                {analysisResults.type === 'space-context' && renderSpaceContext()}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalysisDashboard;