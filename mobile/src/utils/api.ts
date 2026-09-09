import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: 'https://hyperlocalfoodexcessexchange.onrender.com/api',
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
