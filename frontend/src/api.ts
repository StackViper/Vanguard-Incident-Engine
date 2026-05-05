import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'X-API-Key': 'secret_key_123',
  },
});

export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/incidents';
