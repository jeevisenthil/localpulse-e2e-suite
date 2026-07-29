// API Configuration — connects to the SAME backend as the web app
// Change this IP to your computer's local IP when testing on a physical device
// For Android emulator, use 10.0.2.2 instead of localhost

import { Platform } from 'react-native';

const getBaseUrl = () => {
  // Using your computer's local IP so your physical device can connect to the backend
  return 'http://10.52.250.99:3005/api';
};

export const API_BASE = getBaseUrl();

// Supabase configuration (same as web app)
export const SUPABASE_URL = 'https://rlwxxxcerycukwyuezpv.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsd3h4eGNlcnljdWt3eXVlenB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTAwNDQsImV4cCI6MjA5NTM4NjA0NH0.bsnmtjXgGGoIkFp6RVl84rh8HO3ang_OqXcLDwly0w4';
