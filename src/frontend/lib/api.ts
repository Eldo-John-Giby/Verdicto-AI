import axios from 'axios';
import { ConvexReactClient } from "convex/react";

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Initialize Convex client
export const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth
export const authApi = {
  requestOTP: (email: string) => api.post('/auth/request-otp', { email }),
  verifyOTP: (email: string, code: string) => api.post('/auth/verify-otp', { email, code }),
  getMe: () => api.get('/auth/me'),
  signOut: () => api.post('/auth/signout'),
};

// Users
export const usersApi = {
  getCurrentUser: () => api.get('/users/me'),
};

// Cases
export const casesApi = {
  list: (category?: string) => api.get('/cases', { params: { category } }),
  search: (searchTerm: string) => api.get('/cases/search', { params: { search_term: searchTerm } }),
  get: (id: string) => api.get(`/cases/${id}`),
};

// Documents
export const documentsApi = {
  create: (data: { title: string; jurisdiction: string; file_id: string; metadata?: any }) =>
    api.post('/documents', data),
  list: (jurisdiction?: string) => api.get('/documents', { params: { jurisdiction } }),
};

// Queries
export const queriesApi = {
  create: (data: { query_text: string; uploaded_files?: string[]; language?: string; view_mode?: string; document_ids?: string[] }) =>
    api.post('/queries', data),
  list: () => api.get('/queries'),
};

// Predictions
export const predictionsApi = {
  create: (data: any) => api.post('/predictions', data),
  listByUser: () => api.get('/predictions/by-user'),
  getByQuery: (queryId: string) => api.get(`/predictions/by-query/${queryId}`),
};

// Seed
export const seedApi = {
  seed: () => api.post('/seed'),
};