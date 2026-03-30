const express = require('express');
const router = express.Router();
const pool = require('../db');

// ============================================
// OBTENER TODOS LOS CLIENTES (con filtros)
// ============================================
router.get('/', async (req, res) => {
    const { tipo, search } = req.query;
    
    try {
        let query = `
            SELECT c.*, COUNT(p.id) as total_pedidos,
                   COALESCE(SUM(p.total), 0) as total_compras
            FROM clientes c
            LEFT JOIN pedidos p ON c.id = p.cliente_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;
        
        if (tipo) {
            query += ` AND c.tipo_cliente = $${paramIndex}`;
            params.push(tipo);
            paramIndex++;
        }
        
        if (search) {
            query += ` AND (c.nombre ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        
        query += ` GROUP BY c.id ORDER BY c.fecha_registro DESC`;
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// ============================================
// OBTENER CLIENTE POR ID (con detalles)
// ============================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT c.*, 
                   COUNT(p.id) as total_pedidos,
                   COALESCE(SUM(p.total), 0) as total_compras,
                   json_agg(DISTINCT jsonb_build_object(
                       'id', p.id,
                       'fecha', p.fecha_pedido,
                       'total', p.total,
                       'estado', p.estado
                   )) FILTER (WHERE p.id IS NOT NULL) as pedidos_recientes
            FROM clientes c
            LEFT JOIN pedidos p ON c.id = p.cliente_id
            WHERE c.id = $1
            GROUP BY c.id
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener cliente' });
    }
});

// ============================================
// CREAR CLIENTE
// ============================================
router.post('/', async (req, res) => {
    const { nombre, email, telefono, direccion, tipo_cliente } = req.body;
    
    if (!nombre || !email) {
        return res.status(400).json({ error: 'Nombre y email son obligatorios' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO clientes (nombre, email, telefono, direccion, tipo_cliente) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [nombre, email, telefono || null, direccion || null, tipo_cliente || 'regular']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        console.error(error);
        res.status(500).json({ error: 'Error al crear cliente' });
    }
});

// ============================================
// ACTUALIZAR CLIENTE
// ============================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email, telefono, direccion, tipo_cliente } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE clientes 
             SET nombre = COALESCE($1, nombre),
                 email = COALESCE($2, email),
                 telefono = COALESCE($3, telefono),
                 direccion = COALESCE($4, direccion),
                 tipo_cliente = COALESCE($5, tipo_cliente)
             WHERE id = $6
             RETURNING *`,
            [nombre, email, telefono, direccion, tipo_cliente, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'El email ya está en uso' });
        }
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
});

// ============================================
// ELIMINAR CLIENTE (soft delete - opcional)
// ============================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { hard } = req.query; // hard=true para eliminación física
    
    try {
        if (hard === 'true') {
            // Eliminación física
            const result = await pool.query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }
            res.json({ message: 'Cliente eliminado permanentemente', cliente: result.rows[0] });
        } else {
            // Soft delete: desactivar cliente (agregar campo activo)
            const result = await pool.query(
                'UPDATE clientes SET activo = false WHERE id = $1 RETURNING *',
                [id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }
            res.json({ message: 'Cliente desactivado', cliente: result.rows[0] });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
});

// ============================================
// ESTADÍSTICAS DE CLIENTES
// ============================================
router.get('/estadisticas/resumen', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_clientes,
                COUNT(CASE WHEN tipo_cliente = 'premium' THEN 1 END) as clientes_premium,
                COUNT(CASE WHEN tipo_cliente = 'corporativo' THEN 1 END) as clientes_corporativos,
                COUNT(CASE WHEN tipo_cliente = 'regular' THEN 1 END) as clientes_regular,
                COUNT(DISTINCT p.id) as pedidos_totales,
                COALESCE(SUM(p.total), 0) as ventas_totales
            FROM clientes c
            LEFT JOIN pedidos p ON c.id = p.cliente_id
        `);
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

module.exports = router;