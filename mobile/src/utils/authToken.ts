import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'spendwise_auth_token';

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function setAuthToken(token: string) {
  await setItem(TOKEN_KEY, token);
}

export async function getAuthToken() {
  return getItem(TOKEN_KEY);
}

export async function clearAuthToken() {
  await removeItem(TOKEN_KEY);
}

export function decodeJwtEmail(token: string) {
  try {
    const parts = String(token).split('.');
    if (parts.length < 2) return '';
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.email ?? '';
  } catch {
    return '';
  }
}
