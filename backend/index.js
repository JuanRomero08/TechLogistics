// backend/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Importar rutas
const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const productosRoutes = require('./routes/productos');
const pedidosRoutes = require('./routes/pedidos');
const enviosRoutes = require('./routes/envios');

// Middleware de autenticación
const { verificarToken } = require('./middleware/auth');

// Rutas públicas
app.use('/api/auth', authRoutes);

// Rutas protegidas (requieren autenticación)
app.use('/api/clientes', verificarToken, clientesRoutes);
app.use('/api/productos', verificarToken, productosRoutes);
app.use('/api/pedidos', verificarToken, pedidosRoutes);
app.use('/api/envios', verificarToken, enviosRoutes);

// Ruta de prueba pública
app.get('/', (req, res) => {
    res.send('API de TechLogistics funcionando 🚀');
});

// Ruta protegida de prueba
app.get('/api/perfil', verificarToken, (req, res) => {
    res.json({ 
        mensaje: 'Acceso autorizado', 
        usuario: req.usuario 
    });
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});