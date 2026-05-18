import axios from 'axios';

// In dev: leave baseURL empty, vite proxy forwards /api → backend.
// In prod (Vercel): set VITE_API_URL to the Render backend URL.
const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL });

export const apiUrl = (path) => `${baseURL}${path}`;
export default api;
