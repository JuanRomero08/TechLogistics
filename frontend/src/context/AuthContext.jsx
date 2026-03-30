import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Verificar si hay token guardado al cargar la app
        const token = localStorage.getItem('token');
        if (token) {
            verificarSesion(token);
        } else {
            setLoading(false);
        }
    }, []);

    const verificarSesion = async (token) => {
        try {
            const response = await api.get('/auth/verificar', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.valido) {
                setUsuario(response.data.usuario);
                // Configurar token en axios para futuras peticiones
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
                localStorage.removeItem('token');
            }
        } catch (error) {
            console.error('Error verificando sesión:', error);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const registrar = async (datos) => {
        setError(null);
        try {
            const response = await api.post('/auth/registro', datos);
            const { token, usuario } = response.data;
            localStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUsuario(usuario);
            return { success: true };
        } catch (error) {
            const mensaje = error.response?.data?.error || 'Error al registrar usuario';
            setError(mensaje);
            return { success: false, error: mensaje };
        }
    };

    const login = async (email, password) => {
        setError(null);
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, usuario } = response.data;
            localStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUsuario(usuario);
            return { success: true };
        } catch (error) {
            const mensaje = error.response?.data?.error || 'Error al iniciar sesión';
            setError(mensaje);
            return { success: false, error: mensaje };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUsuario(null);
    };

    const value = {
        usuario,
        loading,
        error,
        registrar,
        login,
        logout,
        isAuthenticated: !!usuario
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};