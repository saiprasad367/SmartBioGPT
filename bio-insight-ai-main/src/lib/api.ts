import axios from 'axios';

const API_URL = 'http://localhost:5000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const auth = {
    login: (data: any) => api.post('/auth/login', data),
    register: (data: any) => api.post('/auth/register', data),
    verify: () => api.get('/auth/verify'),
};

export const bio = {
    search: (query: string) => api.post('/bio/search', { query }),
};

export const chat = {
    sendMessage: (data: any) => api.post('/chat/message', data),
    getHistory: () => api.get('/chat/history'),
};

export const user = {
    addFavorite: (proteinId: string) => api.post('/user/favorites', { proteinId }),
    getFavorites: () => api.get('/user/favorites'),
    removeFavorite: (proteinId: string) => api.delete(`/user/favorites/${proteinId}`),
};

export const structure = {
    get: (proteinId: string) => api.get(`/structure/${proteinId}`),
}

export default api;
