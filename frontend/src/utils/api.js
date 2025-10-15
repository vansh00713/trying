import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for large image uploads
});

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const getLogs = async () => {
  try {
    const response = await api.get('/logs');
    return response.data;
  } catch (error) {
    console.error('Get logs error:', error);
    throw error;
  }
};

export const clearLogs = async () => {
  try {
    const response = await api.delete('/logs');
    return response.data;
  } catch (error) {
    console.error('Clear logs error:', error);
    throw error;
  }
};

export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
};

// Enhanced API functions for new features

export const uploadImageWithConfidence = async (file, confidence = 0.5) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post(`/predict?confidence=${confidence}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const uploadBatch = async (files, confidence = 0.5) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  try {
    const response = await api.post(`/predict/batch?confidence=${confidence}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Batch upload error:', error);
    throw error;
  }
};

export const getGallery = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.label) params.append('label_filter', filters.label);
    if (filters.minConfidence) params.append('min_confidence', filters.minConfidence);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`/gallery?${params}`);
    return response.data;
  } catch (error) {
    console.error('Gallery error:', error);
    throw error;
  }
};

export const exportData = async (format, startDate = null, endDate = null) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get(`/export/${format}?${params}`, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

export const getPerformanceAnalytics = async () => {
  try {
    const response = await api.get('/performance');
    return response.data;
  } catch (error) {
    console.error('Performance analytics error:', error);
    throw error;
  }
};

export const getCustomLabels = async () => {
  try {
    const response = await api.get('/labels/custom');
    return response.data;
  } catch (error) {
    console.error('Get custom labels error:', error);
    throw error;
  }
};

export const setCustomLabels = async (labelMappings) => {
  try {
    const response = await api.post('/labels/custom', labelMappings);
    return response.data;
  } catch (error) {
    console.error('Set custom labels error:', error);
    throw error;
  }
};

export const getAlerts = async () => {
  try {
    const response = await api.get('/alerts');
    return response.data;
  } catch (error) {
    console.error('Get alerts error:', error);
    throw error;
  }
};

export const createAlert = async (alertData) => {
  try {
    const response = await api.post('/alerts', alertData);
    return response.data;
  } catch (error) {
    console.error('Create alert error:', error);
    throw error;
  }
};

export const deleteAlert = async (alertId) => {
  try {
    const response = await api.delete(`/alerts/${alertId}`);
    return response.data;
  } catch (error) {
    console.error('Delete alert error:', error);
    throw error;
  }
};

export const getTimeline = async (days = 30) => {
  try {
    const response = await api.get(`/timeline?days=${days}`);
    return response.data;
  } catch (error) {
    console.error('Timeline error:', error);
    throw error;
  }
};

export default api;
