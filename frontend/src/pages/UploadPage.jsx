import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, Loader2, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { uploadImage, uploadImageWithConfidence, uploadBatch } from '../utils/api';
import BoundingBoxVisualizer from '../components/BoundingBoxVisualizer';

const UploadPage = () => {
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, success, error
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState(0.5);
  const [isBatchMode, setIsBatchMode] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;

    setUploadState('uploading');
    setError(null);

    try {
      if (isBatchMode || acceptedFiles.length > 1) {
        // Batch processing
        setUploadedFiles(acceptedFiles);
        setIsBatchMode(true);
        const result = await uploadBatch(acceptedFiles, confidence);
        setBatchResults(result);
        setUploadState('success');
      } else {
        // Single file processing
        const file = acceptedFiles[0];
        setUploadedFile(file);
        const result = await uploadImageWithConfidence(file, confidence);
        setPredictions(result);
        setUploadState('success');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.detail || 'Failed to process image(s)');
      setUploadState('error');
    }
  }, [confidence, isBatchMode]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: isBatchMode ? 20 : 1,
    multiple: isBatchMode,
    disabled: uploadState === 'uploading'
  });

  const resetUpload = () => {
    setUploadState('idle');
    setUploadedFile(null);
    setUploadedFiles([]);
    setPredictions(null);
    setBatchResults(null);
    setError(null);
    setIsBatchMode(false);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
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

  return (
    <motion.div
      className="min-h-screen pt-8 pb-16"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Vision Analysis
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Upload an image to see what our AI can detect. Get instant object detection 
            with confidence scores and bounding boxes.
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Batch Mode Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <motion.button
              onClick={() => setIsBatchMode(!isBatchMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isBatchMode
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isBatchMode ? 'Single Mode' : 'Batch Mode'}
            </motion.button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isBatchMode ? 'Upload multiple images (max 20)' : 'Upload single image'}
            </span>
          </div>

          {/* Confidence Threshold Slider */}
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confidence Threshold: {(confidence * 100).toFixed(0)}%
            </label>
            <div className="relative">
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={uploadState === 'uploading'}
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Less Strict (10%)</span>
                <span>More Strict (100%)</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Higher values show only high-confidence detections
            </p>
          </div>
        </motion.div>

        <div className="space-y-8">
          {/* Upload Area */}
          <motion.div variants={itemVariants}>
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragActive && !isDragReject
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : isDragReject
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                  : uploadState === 'uploading'
                  ? 'border-gray-300 bg-gray-50 dark:bg-gray-800'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
              }`}
            >
              <input {...getInputProps()} />
              
              <AnimatePresence mode="wait">
                {uploadState === 'uploading' ? (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center space-y-4"
                  >
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                    <div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        Processing your image...
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Our AI is analyzing the contents
                      </p>
                    </div>
                  </motion.div>
                ) : uploadState === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center space-y-4"
                  >
                    <CheckCircle className="w-12 h-12 text-green-600" />
                    <div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        Analysis Complete!
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isBatchMode
                          ? `${batchResults?.successful || 0}/${batchResults?.total_files || 0} files processed, ${batchResults?.total_detections || 0} objects detected`
                          : `${predictions?.total_detections || 0} objects detected`
                        }
                      </p>
                    </div>
                    <button
                      onClick={resetUpload}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Upload Another Image
                    </button>
                  </motion.div>
                ) : uploadState === 'error' ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center space-y-4"
                  >
                    <AlertCircle className="w-12 h-12 text-red-600" />
                    <div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        Upload Failed
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    </div>
                    <button
                      onClick={resetUpload}
                      className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center space-y-4"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ 
                          scale: isDragActive ? 1.1 : 1,
                          rotate: isDragActive ? 5 : 0 
                        }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <Upload className="w-12 h-12 text-gray-400" />
                      </motion.div>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {isDragActive ? 'Drop your image here' : 'Drag & drop an image'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        or click to select • PNG, JPG, JPEG, WebP
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Results */}
          <AnimatePresence>
            {predictions && uploadedFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Image with Bounding Boxes */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Eye className="w-6 h-6 mr-2" />
                      Detection Results
                    </h2>
                    <BoundingBoxVisualizer
                      imageFile={uploadedFile}
                      detections={predictions.detections}
                    />
                  </div>
                </div>

                {/* Detection Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Detection Summary
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {predictions.total_detections}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Total Objects
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {predictions.top_label || 'None'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Top Detection
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {predictions.detections.length > 0 
                          ? Math.max(...predictions.detections.map(d => d.confidence)).toFixed(2)
                          : '0.00'
                        }
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Max Confidence
                      </div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {new Set(predictions.detections.map(d => d.label)).size}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Unique Labels
                      </div>
                    </div>
                  </div>

                  {/* Detection List */}
                  {predictions.detections.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Detected Objects:
                      </h4>
                      <div className="space-y-2">
                        {predictions.detections
                          .sort((a, b) => b.confidence - a.confidence)
                          .map((detection, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {detection.label}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {(detection.confidence * 100).toFixed(1)}%
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default UploadPage;