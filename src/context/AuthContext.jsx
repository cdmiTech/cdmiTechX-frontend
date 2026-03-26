import { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = JSON.parse(sessionStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
        }
        setLoading(false);

        // Do not auto-logout on refresh; sessionStorage preserves state across reloads.
        // User is logged out on tab/window close automatically by sessionStorage.
    }, []);

    const login = async (credentials) => {
        const { data } = await api.post('/auth/login', credentials);
        sessionStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const googleLogin = async (token, googleAccessToken) => {
        const { data } = await api.post('/auth/google', { token });
        
        if (data.status === 'requires_registration') {
             return data;
        }

        const userData = { ...data, googleAccessToken };
        sessionStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const googleRegister = async (registrationData, googleAccessToken) => {
        const { data } = await api.post('/auth/google/register', registrationData);
        const userData = { ...data, googleAccessToken };
        sessionStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const register = async (userData) => {
        const { data } = await api.post('/auth/register', userData);
        sessionStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const logout = () => {
        sessionStorage.removeItem('user');
        setUser(null);
    };

    const refreshUserStatus = async () => {
        try {
            const { data } = await api.get('/auth/profile');
            const updatedUser = { ...user, ...data };
            sessionStorage.setItem('user', JSON.stringify(updatedUser));
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
