import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  // Use your computer's local IP address so physical devices and emulators can reach the backend
  baseURL: 'http://10.59.162.203:8000/api',
});

api.interceptors.request.use(async (config) => {
  // Bypass localtunnel interstitial warning
  config.headers['Bypass-Tunnel-Reminder'] = 'true';

  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
