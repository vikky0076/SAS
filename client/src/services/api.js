import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT and device ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Automatically append deviceId to POST/PUT requests
    const deviceId = localStorage.getItem('trustedDeviceToken');
    if (deviceId && (config.method === 'post' || config.method === 'put')) {
      if (config.data instanceof FormData) {
        config.data.append('deviceId', deviceId);
      } else {
        if (!config.data) config.data = {};
        if (typeof config.data === 'object' && !config.data.deviceId) {
          config.data.deviceId = deviceId;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
