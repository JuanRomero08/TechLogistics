const express = require('express');
const router = express.Router();
const pool = require('../db');

// ============================================
// OBTENER TODOS LOS PRODUCTOS (con filtros)
// ============================================
router.get('/', async (req, res) => {
    const { categoria, search, stock_bajo, activo } = req.query;
    
    try {
        let query = `
            SELECT p.*,
                   COALESCE(SUM(dp.cantidad), 0) as total_vendido
            FROM productos p
            LEFT JOIN detalles_pedido dp ON p.id = dp.producto_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;
        
        if (categoria) {
            query += ` AND p.categoria = $${paramIndex}`;
            params.push(categoria);
            paramIndex++;
        }
        
        if (search) {
            query += ` AND (p.nombre ILIKE $${paramIndex} OR p.descripcion ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        
        if (stock_bajo === 'true') {
            query += ` AND p.stock <= p.stock_minimo`;
        }
        
        if (activo === 'true') {
            query += ` AND p.activo = true`;
        }
        
        query += ` GROUP BY p.id ORDER BY p.nombre`;
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// ============================================
// OBTENER PRODUCTO POR ID
// ============================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT p.*,
                   COALESCE(SUM(dp.cantidad), 0) as total_vendido,
                   json_agg(DISTINCT jsonb_build_object(
                       'pedido_id', dp.pedido_id,
                       'cantidad', dp.cantidad,
                       'fecha', pe.fecha_pedido
                   )) FILTER (WHERE dp.id IS NOT NULL) as ventas
            FROM productos p
            LEFT JOIN detalles_pedido dp ON p.id = dp.producto_id
            LEFT JOIN pedidos pe ON dp.pedido_id = pe.id
            WHERE p.id = $1
            GROUP BY p.id
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
});

// ============================================
// CREAR PRODUCTO
// ============================================
router.post('/', async (req, res) => {
    const { nombre, descripcion, categoria, precio, stock, stock_minimo, imagen_url } = req.body;
    
    if (!nombre || !precio || stock === undefined) {
        return res.status(400).json({ error: 'Nombre, precio y stock son obligatorios' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO productos (nombre, descripcion, categoria, precio, stock, stock_minimo, imagen_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [nombre, descripcion || null, categoria || null, precio, stock, stock_minimo || 5, imagen_url || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

// ============================================
// ACTUALIZAR PRODUCTO
// ============================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, categoria, precio, stock, stock_minimo, imagen_url, activo } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE productos 
             SET nombre = COALESCE($1, nombre),
                 descripcion = COALESCE($2, descripcion),
                 categoria = COALESCE($3, categoria),
                 precio = COALESCE($4, precio),
                 stock = COALESCE($5, stock),
                 stock_minimo = COALESCE($6, stock_minimo),
                 imagen_url = COALESCE($7, imagen_url),
                 activo = COALESCE($8, activo)
             WHERE id = $9
             RETURNING *`,
            [nombre, descripcion, categoria, precio, stock, stock_minimo, imagen_url, activo, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

// ============================================
// ELIMINAR PRODUCTO
// ============================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Verificar si el producto tiene pedidos asociados
        const checkResult = await pool.query(
            'SELECT COUNT(*) FROM detalles_pedido WHERE producto_id = $1',
            [id]
        );
        
        if (parseInt(checkResult.rows[0].count) > 0) {
            // Soft delete: solo desactivar
            const result = await pool.query(
                'UPDATE productos SET activo = false WHERE id = $1 RETURNING *',
                [id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json({ 
                message: 'Producto desactivado (tiene pedidos asociados)', 
                producto: result.rows[0] 
            });
        } else {
            // Eliminación física
            const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json({ message: 'Producto eliminado permanentemente', producto: result.rows[0] });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

// ============================================
// ACTUALIZAR STOCK (para reposición)
// ============================================
router.patch('/:id/stock', async (req, res) => {
    const { id } = req.params;
    const { stock, operacion } = req.body; // operacion: 'set', 'add', 'subtract'
    
    try {
        let query;
        let params;
        
        switch(operacion) {
            case 'add':
                query = 'UPDATE productos SET stock = stock + $1 WHERE id = $2 RETURNING *';
                params = [stock, id];
                break;
            case 'subtract':
                query = 'UPDATE productos SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING *';
                params = [stock, id];
                break;
            default:
                query = 'UPDATE productos SET stock = $1 WHERE id = $2 RETURNING *';
                params = [stock, id];
        }
        
        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado o stock insuficiente' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar stock' });
    }
});

// ============================================
// OBTENER CATEGORÍAS
// ============================================
router.get('/categorias/lista', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT categoria, COUNT(*) as total
            FROM productos
            WHERE categoria IS NOT NULL
            GROUP BY categoria
            ORDER BY categoria
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

module.exports = router;