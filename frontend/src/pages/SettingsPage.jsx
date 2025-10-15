import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Tag, Bell, Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { getCustomLabels, setCustomLabels, getAlerts, createAlert, deleteAlert } from '../utils/api';

const SettingsPage = () => {
  const [customLabels, setCustomLabelsState] = useState({});
  const [alerts, setAlertsState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newLabelMapping, setNewLabelMapping] = useState({ original: '', custom: '' });
  const [newAlert, setNewAlert] = useState({
    name: '',
    label: '',
    min_confidence: 0.5,
    active: true
  });
  const [activeTab, setActiveTab] = useState('labels');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [labelsResponse, alertsResponse] = await Promise.all([
        getCustomLabels(),
        getAlerts()
      ]);
      
      setCustomLabelsState(labelsResponse.mappings || {});
      setAlertsState(alertsResponse.alerts || []);
    } catch (err) {
      setError('Failed to load settings');
      console.error('Settings load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveLabels = async () => {
    try {
      await setCustomLabels(customLabels);
      alert('Custom labels saved successfully!');
    } catch (err) {
      console.error('Save labels error:', err);
      alert('Failed to save custom labels');
    }
  };

  const handleAddLabelMapping = () => {
    if (newLabelMapping.original && newLabelMapping.custom) {
      setCustomLabelsState(prev => ({
        ...prev,
        [newLabelMapping.original]: newLabelMapping.custom
      }));
      setNewLabelMapping({ original: '', custom: '' });
    }
  };

  const handleRemoveLabelMapping = (originalLabel) => {
    setCustomLabelsState(prev => {
      const updated = { ...prev };
      delete updated[originalLabel];
      return updated;
    });
  };

  const handleCreateAlert = async () => {
    if (!newAlert.name || !newAlert.label) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createAlert(newAlert);
      setNewAlert({
        name: '',
        label: '',
        min_confidence: 0.5,
        active: true
      });
      loadData(); // Refresh alerts
    } catch (err) {
      console.error('Create alert error:', err);
      alert('Failed to create alert');
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await deleteAlert(alertId);
        loadData(); // Refresh alerts
      } catch (err) {
        console.error('Delete alert error:', err);
        alert('Failed to delete alert');
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen pt-8 pb-16"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div className="mb-8" variants={itemVariants}>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Settings
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Customize your AI Vision Hub experience
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('labels')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-300 ${
                activeTab === 'labels'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <Tag size={16} />
              <span>Custom Labels</span>
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-300 ${
                activeTab === 'alerts'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <Bell size={16} />
              <span>Detection Alerts</span>
            </button>
          </div>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants} className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </motion.div>
        )}

        {/* Custom Labels Tab */}
        {activeTab === 'labels' && (
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Custom Label Mappings
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Customize how detection labels appear in your results. Map original YOLO labels to your preferred terms.
              </p>

              {/* Add New Mapping */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Add New Mapping</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Original label (e.g., 'car')"
                    value={newLabelMapping.original}
                    onChange={(e) => setNewLabelMapping(prev => ({ ...prev, original: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <span className="self-center text-gray-500">→</span>
                  <input
                    type="text"
                    placeholder="Custom label (e.g., 'Vehicle')"
                    value={newLabelMapping.custom}
                    onChange={(e) => setNewLabelMapping(prev => ({ ...prev, custom: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <motion.button
                    onClick={handleAddLabelMapping}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus size={16} />
                    <span>Add</span>
                  </motion.button>
                </div>
              </div>

              {/* Current Mappings */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Current Mappings</h4>
                {Object.keys(customLabels).length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No custom label mappings configured.</p>
                ) : (
                  Object.entries(customLabels).map(([original, custom]) => (
                    <div key={original} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded">
                          {original}
                        </span>
                        <span>→</span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded">
                          {custom}
                        </span>
                      </div>
                      <motion.button
                        onClick={() => handleRemoveLabelMapping(original)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  ))
                )}
              </div>

              {/* Save Button */}
              <div className="mt-6 flex justify-end">
                <motion.button
                  onClick={handleSaveLabels}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Save size={16} />
                  <span>Save Changes</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Detection Alerts
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Set up alerts to be notified when specific objects are detected with sufficient confidence.
              </p>

              {/* Create New Alert */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Create New Alert</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Alert name"
                    value={newAlert.name}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Target label (e.g., 'person')"
                    value={newAlert.label}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, label: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Min Confidence:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={newAlert.min_confidence}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, min_confidence: parseFloat(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                      {(newAlert.min_confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <motion.button
                    onClick={handleCreateAlert}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus size={16} />
                    <span>Create Alert</span>
                  </motion.button>
                </div>
              </div>

              {/* Current Alerts */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Active Alerts</h4>
                {alerts.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No alerts configured.</p>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white">{alert.name}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Trigger when "{alert.label}" detected with ≥{(alert.min_confidence * 100).toFixed(0)}% confidence
                          </p>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default SettingsPage;