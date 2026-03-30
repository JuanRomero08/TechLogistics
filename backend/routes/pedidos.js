const express = require('express');
const router = express.Router();
const pool = require('../db');

// ============================================
// OBTENER TODOS LOS PEDIDOS (con filtros)
// ============================================
router.get('/', async (req, res) => {
    const { estado, cliente_id, fecha_desde, fecha_hasta, search } = req.query;
    
    try {
        let query = `
            SELECT p.*, 
                   c.nombre as cliente_nombre, 
                   c.email as cliente_email,
                   c.telefono as cliente_telefono,
                   COUNT(dp.id) as total_productos,
                   e.estado_actual as estado_envio,
                   e.numero_guia
            FROM pedidos p
            JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN detalles_pedido dp ON p.id = dp.pedido_id
            LEFT JOIN envios e ON p.id = e.pedido_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;
        
        if (estado) {
            query += ` AND p.estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }
        
        if (cliente_id) {
            query += ` AND p.cliente_id = $${paramIndex}`;
            params.push(cliente_id);
            paramIndex++;
        }
        
        if (fecha_desde) {
            query += ` AND p.fecha_pedido >= $${paramIndex}`;
            params.push(fecha_desde);
            paramIndex++;
        }
        
        if (fecha_hasta) {
            query += ` AND p.fecha_pedido <= $${paramIndex}`;
            params.push(fecha_hasta);
            paramIndex++;
        }
        
        if (search) {
            query += ` AND (c.nombre ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex} OR p.id::text ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        
        query += ` GROUP BY p.id, c.nombre, c.email, c.telefono, e.estado_actual, e.numero_guia 
                   ORDER BY p.fecha_pedido DESC`;
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
});

// ============================================
// OBTENER PEDIDO POR ID (con detalles completos)
// ============================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Obtener el pedido con información del cliente
        const pedidoResult = await pool.query(`
            SELECT p.*, 
                   c.nombre as cliente_nombre, 
                   c.email as cliente_email,
                   c.telefono as cliente_telefono,
                   c.direccion as cliente_direccion,
                   e.estado_actual as estado_envio,
                   e.numero_guia,
                   e.ubicacion_actual,
                   e.fecha_salida,
                   e.fecha_entrega_estimada,
                   t.nombre as transportista_nombre
            FROM pedidos p
            JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN envios e ON p.id = e.pedido_id
            LEFT JOIN transportistas t ON e.transportista_id = t.id
            WHERE p.id = $1
        `, [id]);
        
        if (pedidoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        
        // Obtener los detalles del pedido
        const detallesResult = await pool.query(`
            SELECT dp.*, 
                   pr.nombre as producto_nombre,
                   pr.descripcion as producto_descripcion,
                   pr.imagen_url
            FROM detalles_pedido dp
            JOIN productos pr ON dp.producto_id = pr.id
            WHERE dp.pedido_id = $1
        `, [id]);
        
        // Obtener historial de estados
        const historialResult = await pool.query(`
            SELECT * FROM historial_estados_pedido
            WHERE pedido_id = $1
            ORDER BY fecha_cambio DESC
        `, [id]);
        
        const pedido = pedidoResult.rows[0];
        pedido.detalles = detallesResult.rows;
        pedido.historial = historialResult.rows;
        
        res.json(pedido);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener pedido' });
    }
});

// ============================================
// CREAR NUEVO PEDIDO
// ============================================
router.post('/', async (req, res) => {
    const { cliente_id, productos, tipo_pago, notas } = req.body;
    
    if (!cliente_id || !productos || productos.length === 0) {
        return res.status(400).json({ error: 'Cliente y productos son obligatorios' });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        let total = 0;
        const detalles = [];
        
        // Validar stock y calcular total
        for (const item of productos) {
            const productoResult = await client.query(
                'SELECT * FROM productos WHERE id = $1 AND activo = true FOR UPDATE',
                [item.producto_id]
            );
            
            if (productoResult.rows.length === 0) {
                throw new Error(`Producto ${item.producto_id} no existe o está inactivo`);
            }
            
            const producto = productoResult.rows[0];
            
            if (producto.stock < item.cantidad) {
                throw new Error(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`);
            }
            
            const subtotal = producto.precio * item.cantidad;
            total += subtotal;
            
            detalles.push({
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: producto.precio,
                descuento: item.descuento || 0
            });
            
            // Actualizar stock
            await client.query(
                'UPDATE productos SET stock = stock - $1 WHERE id = $2',
                [item.cantidad, item.producto_id]
            );
        }
        
        // Crear el pedido
        const pedidoResult = await client.query(
            `INSERT INTO pedidos (cliente_id, total, tipo_pago, notas) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [cliente_id, total, tipo_pago || null, notas || null]
        );
        
        const pedidoId = pedidoResult.rows[0].id;
        
        // Insertar detalles del pedido
        for (const detalle of detalles) {
            await client.query(
                `INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio_unitario, descuento)
                 VALUES ($1, $2, $3, $4, $5)`,
                [pedidoId, detalle.producto_id, detalle.cantidad, detalle.precio_unitario, detalle.descuento]
            );
        }
        
        await client.query('COMMIT');
        
        // Obtener el pedido completo
        const pedidoCompleto = await pool.query(`
            SELECT p.*, c.nombre as cliente_nombre, c.email as cliente_email
            FROM pedidos p
            JOIN clientes c ON p.cliente_id = c.id
            WHERE p.id = $1
        `, [pedidoId]);
        
        const detallesPedido = await pool.query(`
            SELECT dp.*, pr.nombre as producto_nombre
            FROM detalles_pedido dp
            JOIN productos pr ON dp.producto_id = pr.id
            WHERE dp.pedido_id = $1
        `, [pedidoId]);
        
        const response = pedidoCompleto.rows[0];
        response.detalles = detallesPedido.rows;
        
        res.status(201).json(response);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: error.message || 'Error al crear pedido' });
    } finally {
        client.release();
    }
});

// ============================================
// ACTUALIZAR PEDIDO
// ============================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { tipo_pago, notas } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE pedidos 
             SET tipo_pago = COALESCE($1, tipo_pago),
                 notas = COALESCE($2, notas)
             WHERE id = $3
             RETURNING *`,
            [tipo_pago, notas, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar pedido' });
    }
});

// ============================================
// ACTUALIZAR ESTADO DEL PEDIDO
// ============================================
router.patch('/:id/estado', async (req, res) => {
    const { id } = req.params;
    const { estado, observacion } = req.body;
    
    const estadosValidos = ['pendiente', 'pagado', 'en_preparacion', 'enviado', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ error: 'Estado no válido' });
    }
    
    try {
        const result = await pool.query(
            'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *',
            [estado, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        
        // Registrar observación en historial si se proporcionó
        if (observacion) {
            await pool.query(
                `INSERT INTO historial_estados_pedido (pedido_id, estado_anterior, estado_nuevo, observacion)
                 SELECT $1, estado, $2, $3 FROM pedidos WHERE id = $1`,
                [id, estado, observacion]
            );
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
});

// ============================================
// ELIMINAR PEDIDO (solo si está pendiente)
// ============================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Verificar estado del pedido
        const checkResult = await pool.query(
            'SELECT estado FROM pedidos WHERE id = $1',
            [id]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        
        const estado = checkResult.rows[0].estado;
        
        if (estado !== 'pendiente') {
            return res.status(400).json({ 
                error: 'Solo se pueden eliminar pedidos en estado pendiente',
                estado_actual: estado
            });
        }
        
        // Restaurar stock de productos
        const detalles = await pool.query(
            'SELECT producto_id, cantidad FROM detalles_pedido WHERE pedido_id = $1',
            [id]
        );
        
        for (const detalle of detalles.rows) {
            await pool.query(
                'UPDATE productos SET stock = stock + $1 WHERE id = $2',
                [detalle.cantidad, detalle.producto_id]
            );
        }
        
        // Eliminar el pedido (cascada eliminará detalles)
        const result = await pool.query('DELETE FROM pedidos WHERE id = $1 RETURNING *', [id]);
        
        res.json({ 
            message: 'Pedido eliminado exitosamente',
            pedido: result.rows[0],
            stock_restaurado: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar pedido' });
    }
});

// ============================================
// ESTADÍSTICAS DE PEDIDOS
// ============================================
router.get('/estadisticas/resumen', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_pedidos,
                COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
                COUNT(CASE WHEN estado = 'pagado' THEN 1 END) as pagados,
                COUNT(CASE WHEN estado = 'en_preparacion' THEN 1 END) as en_preparacion,
                COUNT(CASE WHEN estado = 'enviado' THEN 1 END) as enviados,
                COUNT(CASE WHEN estado = 'entregado' THEN 1 END) as entregados,
                COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as cancelados,
                COALESCE(SUM(total), 0) as total_ventas,
                COALESCE(AVG(total), 0) as promedio_venta,
                MAX(total) as venta_maxima,
                MIN(total) as venta_minima
            FROM pedidos
            WHERE estado != 'cancelado'
        `);
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// ============================================
// VENTAS POR DÍA (para gráficos)
// ============================================
router.get('/estadisticas/ventas-diarias', async (req, res) => {
    const { dias = 30 } = req.query;
    
    try {
        const result = await pool.query(`
            SELECT 
                DATE(fecha_pedido) as fecha,
                COUNT(*) as total_pedidos,
                COALESCE(SUM(total), 0) as total_ventas
            FROM pedidos
            WHERE fecha_pedido >= CURRENT_DATE - ($1 || ' days')::INTERVAL
            GROUP BY DATE(fecha_pedido)
            ORDER BY fecha DESC
        `, [dias]);
        
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener ventas diarias' });
    }
});

module.exports = router;