import { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
        }
        setLoading(false);

        const handleAutoLogout = () => {
            localStorage.removeItem('user');
            setUser(null);
        };

        // When user closes tab/window, auto logout to avoid stale OAuth on reopen
        window.addEventListener('beforeunload', handleAutoLogout);
        window.addEventListener('pagehide', handleAutoLogout);

        return () => {
            window.removeEventListener('beforeunload', handleAutoLogout);
            window.removeEventListener('pagehide', handleAutoLogout);
        };
    }, []);

    const login = async (credentials) => {
        const { data } = await api.post('/auth/login', credentials);
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const googleLogin = async (token, googleAccessToken) => {
        const { data } = await api.post('/auth/google', { token });
        
        if (data.status === 'requires_registration') {
             return data;
        }

        const userData = { ...data, googleAccessToken };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const googleRegister = async (registrationData, googleAccessToken) => {
        const { data } = await api.post('/auth/google/register', registrationData);
        const userData = { ...data, googleAccessToken };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const register = async (userData) => {
        const { data } = await api.post('/auth/register', userData);
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    const refreshUserStatus = async () => {
        try {
            const { data } = await api.get('/auth/profile');
            const updatedUser = { ...user, ...data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            return data;
        } catch (error) {
            console.error('Error refreshing status:', error);
            return null;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, googleLogin, googleRegister, refreshUserStatus }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
