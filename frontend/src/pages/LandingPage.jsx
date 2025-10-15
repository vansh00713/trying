import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Rocket, AlertTriangle, Shield, Satellite, ArrowRight, Gauge, Radio, Activity, Users } from 'lucide-react';

const LandingPage = () => {
  const spaceStationFeatures = [
    {
      icon: Shield,
      title: 'Mission-Critical Safety',
      description: 'Real-time detection of fire extinguishers, oxygen tanks, and emergency equipment'
    },
    {
      icon: AlertTriangle,
      title: 'Emergency Response',
      description: 'Automated alerts for missing safety equipment with NASA-grade protocols'
    },
    {
      icon: Satellite,
      title: 'Space Station Context',
      description: 'Intelligent module identification and equipment placement analysis'
    },
    {
      icon: Activity,
      title: 'Crew Safety Analytics',
      description: 'Track equipment status trends and generate safety compliance reports'
    }
  ];

  const equipmentTypes = [
    { name: 'Fire Extinguisher', icon: '🧯', criticality: 'CRITICAL' },
    { name: 'Oxygen Tank', icon: '🫁', criticality: 'CRITICAL' },
    { name: 'First Aid Box', icon: '🏥', criticality: 'HIGH' },
    { name: 'Fire Alarm', icon: '🚨', criticality: 'CRITICAL' },
    { name: 'Safety Switch Panel', icon: '⚡', criticality: 'CRITICAL' },
    { name: 'Emergency Phone', icon: '📞', criticality: 'HIGH' },
    { name: 'Nitrogen Tank', icon: '🌬️', criticality: 'HIGH' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div
      className="min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="gradient-bg absolute inset-0 opacity-10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 sm:pb-20">
          <motion.div 
            className="text-center"
            variants={itemVariants}
          >
            {/* NASA Mission Badge */}
            <motion.div
              className="flex justify-center mb-8"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: 'spring', 
                stiffness: 260, 
                damping: 20,
                delay: 0.2 
              }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-red-500 to-white rounded-full blur-xl opacity-30 animate-pulse-slow"></div>
                <div className="relative p-8 bg-gradient-to-r from-blue-600 via-red-500 to-blue-600 rounded-full text-white border-4 border-white shadow-2xl">
                  <Rocket size={80} className="animate-float" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                  NASA
                </div>
              </div>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6"
              variants={itemVariants}
            >
              <span className="block text-blue-600 dark:text-blue-400">NASA Space Station</span>
              <span className="block bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
                Emergency Detection Hub
              </span>
            </motion.h1>

            {/* Mission Statement */}
            <motion.p 
              className="max-w-4xl mx-auto text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
              variants={itemVariants}
            >
              Mission-critical AI system for detecting and monitoring emergency equipment aboard the International Space Station. 
              Ensuring astronaut safety through advanced computer vision technology.
            </motion.p>

            {/* Mission Stats */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12"
              variants={itemVariants}
            >
              <div className="bg-blue-900/20 backdrop-blur-sm rounded-lg p-4 border border-blue-500/30">
                <div className="text-3xl font-bold text-blue-400">7</div>
                <div className="text-sm text-gray-300">Equipment Types Monitored</div>
              </div>
              <div className="bg-red-900/20 backdrop-blur-sm rounded-lg p-4 border border-red-500/30">
                <div className="text-3xl font-bold text-red-400">24/7</div>
                <div className="text-sm text-gray-300">Mission-Critical Monitoring</div>
              </div>
              <div className="bg-green-900/20 backdrop-blur-sm rounded-lg p-4 border border-green-500/30">
                <div className="text-3xl font-bold text-green-400">NASA</div>
                <div className="text-sm text-gray-300">Grade Safety Standards</div>
              </div>
            </motion.div>

            {/* Mission Control Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={itemVariants}
            >
              <Link to="/upload">
                <motion.button
                  className="group relative px-8 py-4 bg-gradient-to-r from-red-600 to-blue-600 text-white font-semibold rounded-full shadow-lg overflow-hidden border-2 border-white/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    <Rocket size={20} />
                    <span>Start Mission</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1.5,
                        ease: 'easeInOut'
                      }}
                    >
                      <ArrowRight size={20} />
                    </motion.div>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.button>
              </Link>

              <Link to="/space-station">
                <motion.button
                  className="px-8 py-4 border-2 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 font-semibold rounded-full hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Satellite size={20} />
                  <span>Space Station Hub</span>
                </motion.button>
              </Link>

              <Link to="/advanced-analysis">
                <motion.button
                  className="px-8 py-4 border-2 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 font-semibold rounded-full hover:border-green-500 dark:hover:border-green-400 hover:text-green-600 dark:hover:text-green-400 transition-all duration-300 flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Activity size={20} />
                  <span>Advanced Analysis</span>
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Space Station Features Section */}
      <div className="py-20 bg-gradient-to-b from-gray-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            variants={itemVariants}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              🛰️ NASA Space Station Capabilities
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-300">
              Advanced AI systems designed for mission-critical safety monitoring aboard the International Space Station
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {spaceStationFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="text-center group bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300"
                  variants={itemVariants}
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-red-400 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative p-4 bg-gradient-to-r from-blue-500/30 to-red-500/30 rounded-full w-20 h-20 mx-auto flex items-center justify-center border-2 border-white/30 group-hover:border-white/50 transition-all duration-300">
                      <Icon size={40} className="text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Equipment Detection Grid */}
      <div className="py-20 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            variants={itemVariants}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              🔍 Monitored Emergency Equipment
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-300">
              AI-powered detection system trained specifically for critical safety equipment aboard the ISS
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
            {equipmentTypes.map((equipment, index) => {
              const getCriticalityColor = (criticality) => {
                return criticality === 'CRITICAL' 
                  ? 'from-red-500 to-red-600 border-red-300' 
                  : 'from-yellow-500 to-yellow-600 border-yellow-300';
              };

              return (
                <motion.div
                  key={equipment.name}
                  className={`relative bg-gradient-to-br ${getCriticalityColor(equipment.criticality)} rounded-xl p-6 text-white text-center shadow-lg hover:shadow-xl transition-all duration-300 border-2`}
                  variants={itemVariants}
                  whileHover={{ y: -3, scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, delay: index * 0.1 }}
                >
                  <div className="text-4xl mb-3">{equipment.icon}</div>
                  <h3 className="font-semibold text-sm mb-2">{equipment.name}</h3>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    equipment.criticality === 'CRITICAL' 
                      ? 'bg-red-800/50 text-red-100' 
                      : 'bg-yellow-800/50 text-yellow-100'
                  }`}>
                    {equipment.criticality}
                  </div>
                  {equipment.criticality === 'CRITICAL' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <motion.div 
            className="text-center mt-12"
            variants={itemVariants}
          >
            <div className="inline-flex items-center space-x-6 bg-gray-100 dark:bg-gray-800 rounded-full px-8 py-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CRITICAL Priority</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">HIGH Priority</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mission Control CTA */}
      <div className="py-20 bg-gradient-to-r from-gray-900 via-blue-900 to-red-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div variants={itemVariants}>
            <motion.div 
              className="flex justify-center mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-8xl mb-4">🛰️</div>
            </motion.div>
            
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready for Astronaut-Level Safety?
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join NASA's mission to revolutionize space station safety through AI. 
              Every detection could save an astronaut's life 400 km above Earth.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-3xl mb-2">🔥</div>
                <h3 className="text-xl font-bold text-white mb-2">Fire Safety</h3>
                <p className="text-gray-300 text-sm">Instant detection of fire suppressions systems</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-3xl mb-2">🫁</div>
                <h3 className="text-xl font-bold text-white mb-2">Life Support</h3>
                <p className="text-gray-300 text-sm">Monitor oxygen and nitrogen tank availability</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-3xl mb-2">🏥</div>
                <h3 className="text-xl font-bold text-white mb-2">Medical Emergency</h3>
                <p className="text-gray-300 text-sm">Locate first aid supplies in critical moments</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/space-station">
                <motion.button
                  className="group px-10 py-4 bg-gradient-to-r from-red-600 to-blue-600 text-white font-semibold rounded-full shadow-2xl text-lg flex items-center space-x-3 border-2 border-white/20"
                  whileHover={{ scale: 1.05, boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Rocket size={24} />
                  <span>Launch Mission Control</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              
              <div className="text-white/60 text-sm">
                🌍 400 km above Earth • 👩‍🚀 Crew safety first
              </div>
            </div>
            
            <motion.div 
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="inline-flex items-center space-x-4 bg-black/30 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">System Online</span>
                </div>
                <div className="text-white/40">|</div>
                <div className="flex items-center space-x-2">
                  <Users size={16} className="text-blue-400" />
                  <span className="text-blue-400 text-sm">NASA Approved</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default LandingPage;