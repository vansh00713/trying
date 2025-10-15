import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const BoundingBoxVisualizer = ({ imageFile, detections }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Color palette for different detections
  const colors = [
    '#3B82F6', // blue
    '#EF4444', // red  
    '#10B981', // green
    '#F59E0B', // yellow
    '#8B5CF6', // purple
    '#06B6D4', // cyan
    '#F97316', // orange
    '#84CC16', // lime
    '#EC4899', // pink
    '#6B7280'  // gray
  ];

  useEffect(() => {
    if (!imageFile || !detections) return;

    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const loadImage = () => {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          setIsImageLoaded(true);
          drawBoundingBoxes();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    };

    const drawBoundingBoxes = () => {
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Calculate scale factors
      const scaleX = canvas.width / img.naturalWidth;
      const scaleY = canvas.height / img.naturalHeight;
      
      // Draw bounding boxes
      detections.forEach((detection, index) => {
        const [x1, y1, x2, y2] = detection.bbox;
        
        // Scale coordinates to canvas size
        const scaledX1 = x1 * scaleX;
        const scaledY1 = y1 * scaleY;
        const scaledX2 = x2 * scaleX;
        const scaledY2 = y2 * scaleY;
        
        const width = scaledX2 - scaledX1;
        const height = scaledY2 - scaledY1;
        
        // Use color from palette
        const color = colors[index % colors.length];
        
        // Draw bounding box
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(scaledX1, scaledY1, width, height);
        
        // Draw label background
        const label = `${detection.label} (${(detection.confidence * 100).toFixed(1)}%)`;
        ctx.font = '14px Inter, system-ui, sans-serif';
        const textMetrics = ctx.measureText(label);
        const textWidth = textMetrics.width;
        const textHeight = 20;
        
        // Position label above the box, or below if not enough space
        const labelY = scaledY1 > textHeight + 5 ? scaledY1 - 5 : scaledY2 + textHeight;
        
        // Draw label background
        ctx.fillStyle = color;
        ctx.fillRect(scaledX1, labelY - textHeight, textWidth + 10, textHeight);
        
        // Draw label text
        ctx.fillStyle = 'white';
        ctx.fillText(label, scaledX1 + 5, labelY - 6);
      });
    };

    loadImage();
  }, [imageFile, detections]);

  const handleImageLoad = () => {
    setIsImageLoaded(true);
    const img = imageRef.current;
    if (img) {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    }
  };

  return (
    <motion.div 
      className="relative w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Loading placeholder */}
      {!isImageLoaded && (
        <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Loading image...</div>
        </div>
      )}

      {/* Canvas for image with bounding boxes */}
      <div className="relative w-full">
        <img
          ref={imageRef}
          className="hidden"
          alt="Detection source"
          onLoad={handleImageLoad}
        />
        <canvas
          ref={canvasRef}
          className={`w-full h-auto rounded-lg shadow-lg transition-opacity duration-300 ${
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        {/* Detection count overlay */}
        {isImageLoaded && detections.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg"
          >
            {detections.length} detection{detections.length !== 1 ? 's' : ''}
          </motion.div>
        )}
      </div>

      {/* Legend */}
      {detections.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Detection Legend
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {detections.map((detection, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                  {detection.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No detections message */}
      {detections.length === 0 && isImageLoaded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg"
        >
          <div className="text-white text-center">
            <div className="text-lg font-semibold mb-1">No Objects Detected</div>
            <div className="text-sm opacity-80">
              Try an image with more recognizable objects
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BoundingBoxVisualizer;