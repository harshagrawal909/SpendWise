import axios from 'axios';
import { Platform } from 'react-native';

import { getAuthToken } from '@/utils/authToken';

function getApiBaseUrl() {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env;

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
}

const API = axios.create({
  baseURL: getApiBaseUrl(),
});

API.interceptors.request.use(async (req) => {
  const token = await getAuthToken();
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
