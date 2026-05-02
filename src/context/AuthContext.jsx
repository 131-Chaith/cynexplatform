import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        if (user && typeof user === 'object') {
                            setCurrentUser(user);
                            setIsAdmin(user.role === 'admin' || user.role === 'super_admin');
                            setIsSuperAdmin(user.role === 'super_admin');
                        }
                    }
                } catch (error) {
                    console.error("Auth init error:", error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            console.log("Login successful:", response.data);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            setCurrentUser(user);
            setIsAdmin(user.role === 'admin' || user.role === 'super_admin');
            setIsSuperAdmin(user.role === 'super_admin');
            return { success: true };
        } catch (error) {
            console.error("Login failed (detailed):", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            return { 
                success: false, 
                message: error.response?.data?.message || 'Login failed',
                details: error.response?.data?.details,
                stack: error.response?.data?.stack
            };
        }
    };

    const register = async (name, email, password, role = 'student') => {
        try {
            await api.post('/auth/register', { name, email, password, role });
            return { success: true };
        } catch (error) {
            console.error("Registration failed:", error);
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCurrentUser(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
    };

    const updateCurrentUser = (userData) => {
        const updatedUser = { ...currentUser, ...userData };
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ currentUser, isAdmin, isSuperAdmin, login, register, logout, updateCurrentUser, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
