const jwt = require('jsonwebtoken');

// Clave secreta para JWT (debería estar en .env)
const JWT_SECRET = process.env.JWT_SECRET || 'techlogistics_secret_key_2026';

// Middleware para verificar token
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    try {
        const verificado = jwt.verify(token, JWT_SECRET);
        req.usuario = verificado; // Guardar información del usuario en la request
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};

// Middleware para verificar si es administrador
const verificarAdmin = (req, res, next) => {
    if (req.usuario && req.usuario.rol === 'admin') {
        next();
    } else {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
};

module.exports = { verificarToken, verificarAdmin, JWT_SECRET };