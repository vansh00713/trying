import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SpaceStationDashboard = () => {
  const [equipmentStatus, setEquipmentStatus] = useState(null);
  const [safetyReport, setSafetyReport] = useState(null);
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [stationModules, setStationModules] = useState([]);
  const [emergencyChecklist, setEmergencyChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertLevel, setAlertLevel] = useState('NOMINAL');

  useEffect(() => {
    fetchSpaceStationData();
    const interval = setInterval(fetchSpaceStationData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSpaceStationData = async () => {
    try {
      const [equipmentRes, safetyRes, modulesRes] = await Promise.all([
        fetch('http://localhost:8000/space-station/equipment-status'),
        fetch('http://localhost:8000/space-station/crew-safety-report'),
        fetch('http://localhost:8000/space-station/station-modules')
      ]);

      const equipment = await equipmentRes.json();
      const safety = await safetyRes.json();
      const modules = await modulesRes.json();

      setEquipmentStatus(equipment);
      setSafetyReport(safety);
      setStationModules(modules.modules || []);
      
      // Determine alert level
      if (equipment.current_assessment?.overall_status === 'CRITICAL') {
        setAlertLevel('CRITICAL');
      } else if (safety.safety_report?.overall_safety_score < 80) {
        setAlertLevel('HIGH');
      } else if (safety.safety_report?.overall_safety_score < 90) {
        setAlertLevel('MEDIUM');
      } else {
        setAlertLevel('NOMINAL');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching space station data:', error);
      setLoading(false);
    }
  };

  const fetchEmergencyChecklist = async (emergencyType) => {
    try {
      const response = await fetch(`http://localhost:8000/space-station/emergency-checklist/${emergencyType}`);
      const data = await response.json();
      setEmergencyChecklist(data);
    } catch (error) {
      console.error('Error fetching emergency checklist:', error);
    }
  };

  const getAlertColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-600 text-white border-red-700';
      case 'HIGH': return 'bg-orange-500 text-white border-orange-600';
      case 'MEDIUM': return 'bg-yellow-500 text-black border-yellow-600';
      case 'NOMINAL': return 'bg-green-600 text-white border-green-700';
      default: return 'bg-gray-500 text-white border-gray-600';
    }
  };

  const getEquipmentStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'text-green-400';
      case 'CONCERNING': return 'text-yellow-400';
      case 'CRITICAL': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getCriticalityColor = (criticality) => {
    switch (criticality) {
      case 'CRITICAL': return 'text-red-400 font-bold';
      case 'HIGH': return 'text-orange-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'LOW': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
        <span className="ml-4 text-white text-xl">Loading Space Station Data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center">
              🚀 NASA ISS Emergency Equipment Monitor
            </h1>
            <p className="text-gray-300 mt-2">Mission Time: GMT {new Date().toISOString().substr(5, 14)}</p>
          </div>
          <div className={`px-6 py-3 rounded-lg border-2 ${getAlertColor(alertLevel)}`}>
            <div className="text-xl font-bold">STATION STATUS</div>
            <div className="text-2xl">{alertLevel}</div>
          </div>
        </div>
      </motion.header>

      {/* Critical Alerts */}
      {equipmentStatus?.current_assessment?.overall_status === 'CRITICAL' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-900 border-2 border-red-500 rounded-lg p-6 mb-8 relative overflow-hidden"
        >
          <motion.div 
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 bg-red-500 opacity-10"
          />
          <h2 className="text-2xl font-bold text-red-200 mb-4">🚨 CRITICAL ALERT</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {equipmentStatus.current_assessment.missing_equipment
              .filter(eq => eq.criticality === 'CRITICAL')
              .map((equipment, index) => (
                <div key={index} className="bg-red-800 p-4 rounded-lg">
                  <h3 className="font-bold text-lg">{equipment.equipment.replace('_', ' ').toUpperCase()}</h3>
                  <p className="text-red-200">{equipment.description}</p>
                  <p className="text-sm mt-2">Emergency Type: {equipment.emergency_type}</p>
                  <button 
                    onClick={() => fetchEmergencyChecklist(equipment.emergency_type)}
                    className="mt-3 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg transition-colors"
                  >
                    Emergency Protocol
                  </button>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Equipment Status Grid */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-gray-800 rounded-lg p-6"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            🛡️ Emergency Equipment Status
          </h2>
          
          {equipmentStatus?.equipment_config && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(equipmentStatus.equipment_config).map(([equipment, config]) => {
                const status = safetyReport?.safety_report?.equipment_status?.[equipment];
                return (
                  <motion.div
                    key={equipment}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg capitalize">
                        {equipment.replace('_', ' ')}
                      </h3>
                      <span className={`text-sm font-bold ${getCriticalityColor(config.criticality)}`}>
                        {config.criticality}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{config.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs text-gray-400">Status</div>
                        <div className={`font-bold ${getEquipmentStatusColor(status?.status || 'UNKNOWN')}`}>
                          {status?.status || 'UNKNOWN'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Detection Rate</div>
                        <div className="font-bold">
                          {status ? `${(status.detection_rate * 100).toFixed(1)}%` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Required: {config.required_quantity}</span>
                        <span>Response: {config.max_response_time}s</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Safety Score */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            📊 Safety Score
          </h2>
          
          {safetyReport?.safety_report && (
            <>
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className={`text-6xl font-bold ${
                    safetyReport.safety_report.overall_safety_score >= 90 ? 'text-green-400' :
                    safetyReport.safety_report.overall_safety_score >= 80 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}
                >
                  {safetyReport.safety_report.overall_safety_score}
                </motion.div>
                <div className="text-gray-400">Overall Safety Score</div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Mission Day</h3>
                  <p className="text-2xl font-bold text-blue-400">
                    {safetyReport.safety_report.mission_day}
                  </p>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Critical Items</h3>
                  <p className={`text-2xl font-bold ${
                    safetyReport.report_summary.critical_items === 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {safetyReport.report_summary.critical_items}
                  </p>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Recommendations</h3>
                  <p className="text-2xl font-bold text-yellow-400">
                    {safetyReport.report_summary.total_recommendations}
                  </p>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Station Modules */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            🏗️ Station Modules
          </h2>
          
          <select 
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full bg-gray-700 rounded-lg p-3 mb-4 border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Modules</option>
            {stationModules.map(module => (
              <option key={module.code} value={module.code}>
                {module.name}
              </option>
            ))}
          </select>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {stationModules
              .filter(module => selectedModule === 'ALL' || module.code === selectedModule)
              .map(module => (
                <motion.div
                  key={module.code}
                  whileHover={{ backgroundColor: "rgba(75, 85, 99, 0.8)" }}
                  className="bg-gray-700 p-3 rounded-lg cursor-pointer transition-colors"
                >
                  <h3 className="font-semibold text-blue-400">{module.name}</h3>
                  <p className="text-sm text-gray-300">{module.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Code: {module.code}</p>
                </motion.div>
              ))}
          </div>
        </motion.div>

        {/* Response Protocols */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-gray-800 rounded-lg p-6"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            📋 Active Response Protocols
          </h2>
          
          {equipmentStatus?.response_protocols?.length > 0 ? (
            <div className="space-y-4">
              {equipmentStatus.response_protocols.map((protocol, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-l-4 ${
                    protocol.priority === 'IMMEDIATE' ? 'bg-red-900 border-red-500' :
                    protocol.priority === 'CRITICAL' ? 'bg-orange-900 border-orange-500' :
                    protocol.priority === 'HIGH' ? 'bg-yellow-900 border-yellow-500' :
                    'bg-blue-900 border-blue-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg">{protocol.action.replace('_', ' ')}</h3>
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                      protocol.priority === 'IMMEDIATE' ? 'bg-red-600' :
                      protocol.priority === 'CRITICAL' ? 'bg-orange-600' :
                      protocol.priority === 'HIGH' ? 'bg-yellow-600' :
                      'bg-blue-600'
                    }`}>
                      {protocol.priority}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-2">{protocol.description}</p>
                  <p className="text-sm text-gray-400">
                    Max Response Time: {protocol.max_response_time}
                  </p>
                  
                  {protocol.emergency_checklist && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                        Emergency Checklist
                      </summary>
                      <div className="mt-2 pl-4 border-l-2 border-gray-600">
                        {protocol.emergency_checklist.map((item, itemIndex) => (
                          <p key={itemIndex} className="text-sm text-gray-300 py-1">
                            {item}
                          </p>
                        ))}
                      </div>
                    </details>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p className="text-lg">✅ No active protocols - All systems nominal</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Emergency Checklist Modal */}
      {emergencyChecklist && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setEmergencyChecklist(null)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-red-400">
              🚨 Emergency Protocol: {emergencyChecklist.emergency_type.toUpperCase()}
            </h2>
            <div className="space-y-2">
              {emergencyChecklist.checklist.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className="text-red-400 font-bold min-w-0">{index + 1}.</span>
                  <span className="text-gray-200">{item.substring(2)}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setEmergencyChecklist(null)}
              className="mt-6 bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default SpaceStationDashboard;