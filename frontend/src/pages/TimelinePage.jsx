import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Activity, Clock, Target, Image as ImageIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getTimeline } from '../utils/api';

const TimelinePage = () => {
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDays, setSelectedDays] = useState(30);

  const loadTimeline = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getTimeline(selectedDays);
      setTimelineData(response.timeline || []);
    } catch (err) {
      setError('Failed to load timeline');
      console.error('Timeline load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [selectedDays]);

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

  const formatChartData = () => {
    return timelineData.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      detections: item.detections,
      files: item.files_processed,
      labels: item.unique_labels
    }));
  };

  const getTimelineStats = () => {
    const totalDetections = timelineData.reduce((sum, day) => sum + day.detections, 0);
    const totalFiles = timelineData.reduce((sum, day) => sum + day.files_processed, 0);
    const totalUniqueLabels = new Set(
      timelineData.flatMap(day => day.labels || [])
    ).size;
    const avgDetectionsPerDay = timelineData.length > 0 ? totalDetections / timelineData.length : 0;

    return {
      totalDetections,
      totalFiles,
      totalUniqueLabels,
      avgDetectionsPerDay: avgDetectionsPerDay.toFixed(1),
      activeDays: timelineData.filter(day => day.detections > 0).length
    };
  };

  const stats = getTimelineStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading timeline...</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div className="mb-8" variants={itemVariants}>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Detection Timeline
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Track your AI vision activity over time
          </p>
        </motion.div>

        {/* Time Range Selector */}
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex flex-wrap gap-2">
            {[7, 30, 90, 365].map(days => (
              <motion.button
                key={days}
                onClick={() => setSelectedDays(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  selectedDays === days
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {days === 7 ? 'Week' : days === 30 ? 'Month' : days === 90 ? '3 Months' : 'Year'}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8" variants={itemVariants}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Detections</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDetections}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Files Processed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalFiles}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ImageIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Unique Labels</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUniqueLabels}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg/Day</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgDetectionsPerDay}</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Days</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeDays}</p>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {error ? (
          <motion.div variants={itemVariants} className="text-center text-red-600 dark:text-red-400">
            {error}
          </motion.div>
        ) : timelineData.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center text-gray-500 dark:text-gray-400">
            No timeline data available for the selected period.
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Detection Trend Chart */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Detection Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatChartData()}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgb(31, 41, 55)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="detections" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Detections"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Files Processed Chart */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Files Processed
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatChartData()}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgb(31, 41, 55)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Bar dataKey="files" fill="#10B981" radius={[4, 4, 0, 0]} name="Files" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Daily Breakdown */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Daily Breakdown
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {timelineData.reverse().map((day, index) => (
                  <motion.div
                    key={day.date}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        {day.detections > 0 && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {day.labels?.slice(0, 5).map((label, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded"
                          >
                            {label}
                          </span>
                        ))}
                        {day.labels?.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded">
                            +{day.labels.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {day.detections}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {day.files_processed} files
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TimelinePage;