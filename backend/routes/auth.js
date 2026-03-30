const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

// ============================================
// REGISTRO DE NUEVO USUARIO
// ============================================
router.post('/registro', async (req, res) => {
    const { nombre, email, password, rol = 'usuario' } = req.body;

    // Validar campos obligatorios
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    try {
        // Verificar si el email ya está registrado
        const usuarioExistente = await pool.query(
            'SELECT id FROM usuarios WHERE email = $1',
            [email.toLowerCase()]
        );

        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insertar nuevo usuario
        const result = await pool.query(
            `INSERT INTO usuarios (nombre, email, password_hash, rol) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, nombre, email, rol, fecha_registro`,
            [nombre, email.toLowerCase(), passwordHash, rol]
        );

        const nuevoUsuario = result.rows[0];

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: nuevoUsuario.id, 
                nombre: nuevoUsuario.nombre, 
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            usuario: {
                id: nuevoUsuario.id,
                nombre: nuevoUsuario.nombre,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol
            },
            token
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// ============================================
// INICIO DE SESIÓN
// ============================================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    try {
        // Buscar usuario por email
        const result = await pool.query(
            `SELECT id, nombre, email, password_hash, rol, activo 
             FROM usuarios 
             WHERE email = $1`,
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const usuario = result.rows[0];

        // Verificar si el usuario está activo
        if (!usuario.activo) {
            return res.status(401).json({ error: 'Cuenta desactivada. Contacte al administrador.' });
        }

        // Verificar contraseña
        const passwordValido = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValido) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Actualizar último acceso
        await pool.query(
            'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
            [usuario.id]
        );

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: usuario.id, 
                nombre: usuario.nombre, 
                email: usuario.email,
                rol: usuario.rol 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            mensaje: 'Inicio de sesión exitoso',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            },
            token
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// ============================================
// VERIFICAR TOKEN (para mantener sesión)
// ============================================
router.get('/verificar', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No hay token' });
    }

    try {
        const verificado = jwt.verify(token, JWT_SECRET);
        
        // Verificar que el usuario aún existe y está activo
        const result = await pool.query(
            'SELECT id, nombre, email, rol FROM usuarios WHERE id = $1 AND activo = true',
            [verificado.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no válido' });
        }

        res.json({
            valido: true,
            usuario: result.rows[0]
        });
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

module.exports = router;