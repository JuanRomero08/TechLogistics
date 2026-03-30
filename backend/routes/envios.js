const express = require('express');
const router = express.Router();
const pool = require('../db');

// Obtener todos los envíos
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT e.*, 
             p.id as pedido_id, p.total as pedido_total,
             c.nombre as cliente_nombre,
             t.nombre as transportista_nombre,
             r.origen, r.destino
      FROM envios e
      JOIN pedidos p ON e.pedido_id = p.id
      JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN transportistas t ON e.transportista_id = t.id
      LEFT JOIN rutas r ON e.ruta_id = r.id
      ORDER BY e.ultima_actualizacion DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener envíos' });
  }
});

// Obtener seguimiento de un envío por ID de pedido
router.get('/pedido/:pedidoId', async (req, res) => {
  const { pedidoId } = req.params;
  try {
    const result = await pool.query(`
      SELECT e.*, 
             t.nombre as transportista_nombre, t.telefono as transportista_telefono,
             r.origen, r.destino, r.distancia_km
      FROM envios e
      LEFT JOIN transportistas t ON e.transportista_id = t.id
      LEFT JOIN rutas r ON e.ruta_id = r.id
      WHERE e.pedido_id = $1
    `, [pedidoId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Envío no encontrado para este pedido' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener seguimiento' });
  }
});

// Crear o actualizar un envío
router.post('/', async (req, res) => {
  const { pedido_id, transportista_id, ruta_id, fecha_salida, fecha_entrega_estimada, estado_actual } = req.body;
  
  try {
    // Verificar si ya existe un envío para este pedido
    const existing = await pool.query('SELECT * FROM envios WHERE pedido_id = $1', [pedido_id]);
    
    let result;
    if (existing.rows.length > 0) {
      // Actualizar
      result = await pool.query(`
        UPDATE envios 
        SET transportista_id = $1, ruta_id = $2, fecha_salida = $3, 
            fecha_entrega_estimada = $4, estado_actual = $5, ultima_actualizacion = CURRENT_TIMESTAMP
        WHERE pedido_id = $6
        RETURNING *
      `, [transportista_id, ruta_id, fecha_salida, fecha_entrega_estimada, estado_actual, pedido_id]);
    } else {
      // Crear nuevo
      result = await pool.query(`
        INSERT INTO envios (pedido_id, transportista_id, ruta_id, fecha_salida, fecha_entrega_estimada, estado_actual)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [pedido_id, transportista_id, ruta_id, fecha_salida, fecha_entrega_estimada, estado_actual]);
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar el envío' });
  }
});

// Actualizar ubicación/estado de un envío (seguimiento en tiempo real simulado)
router.patch('/:id/ubicacion', async (req, res) => {
  const { id } = req.params;
  const { ubicacion_actual, estado_actual } = req.body;
  
  try {
    const result = await pool.query(`
      UPDATE envios 
      SET ubicacion_actual = COALESCE($1, ubicacion_actual),
          estado_actual = COALESCE($2, estado_actual),
          ultima_actualizacion = CURRENT_TIMESTAMP,
          fecha_entrega_real = CASE WHEN $2 = 'entregado' THEN CURRENT_TIMESTAMP ELSE fecha_entrega_real END
      WHERE id = $3
      RETURNING *
    `, [ubicacion_actual, estado_actual, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Envío no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar ubicación' });
  }
});

module.exports = router;