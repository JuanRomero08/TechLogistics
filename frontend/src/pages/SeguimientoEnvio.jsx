import { useState } from 'react';
import api from '../api/axiosConfig';
import Alerta from '../components/Alerta';

function SeguimientoEnvio() {
    const [pedidoId, setPedidoId] = useState('');
    const [envio, setEnvio] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [alerta, setAlerta] = useState(null);

    const buscarEnvio = async () => {
        if (!pedidoId) {
            setError('Ingrese un número de pedido');
            return;
        }
        
        setLoading(true);
        setError('');
        setEnvio(null);
        
        try {
            const response = await api.get(`/envios/pedido/${pedidoId}`);
            setEnvio(response.data);
            setAlerta({ tipo: 'success', mensaje: 'Información de envío encontrada' });
            setTimeout(() => setAlerta(null), 3000);
        } catch (err) {
            setError('No se encontró información de envío para este pedido');
        } finally {
            setLoading(false);
        }
    };

    const getStatusMessage = (estado) => {
        const estados = {
            en_preparacion: 'En preparación - El pedido está siendo preparado',
            en_transito: 'En tránsito - El paquete está en camino',
            en_reparto: 'En reparto local - El paquete está en la última milla',
            entregado: 'Entregado - El paquete ha sido entregado',
            devuelto: 'Devuelto - El paquete fue devuelto'
        };
        return estados[estado] || estado;
    };

    const getStatusIcon = (estado) => {
        const icons = {
            en_preparacion: '📦',
            en_transito: '🚚',
            en_reparto: '🚛',
            entregado: '✅',
            devuelto: '↩️'
        };
        return icons[estado] || '📍';
    };

    return (
        <div>
            {alerta && <Alerta type={alerta.tipo} message={alerta.mensaje} />}
            
            <div className="card">
                <div className="card-header">
                    <h2>Seguimiento de Envíos</h2>
                </div>
                <div className="card-body">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Número de Pedido</label>
                            <input
                                type="number"
                                placeholder="Ingrese el número de pedido"
                                value={pedidoId}
                                onChange={(e) => setPedidoId(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && buscarEnvio()}
                            />
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button onClick={buscarEnvio} disabled={loading} style={{ width: '100%' }}>
                                {loading ? 'Buscando...' : 'Buscar Envío'}
                            </button>
                        </div>
                    </div>
                    
                    {error && (
                        <div className="alert alert-error" style={{ marginTop: '1rem' }}>
                            {error}
                        </div>
                    )}
                    
                    {envio && (
                        <div style={{ marginTop: '2rem' }}>
                            <div className="card" style={{ border: '1px solid #e9ecef', marginTop: '1rem' }}>
                                <div className="card-header">
                                    <h3>Información del Envío</h3>
                                    <span className="status-badge" style={{ background: '#e8f0fe', color: '#1a73e8' }}>
                                        Pedido #{envio.pedido_id}
                                    </span>
                                </div>
                                <div className="card-body">
                                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>{getStatusIcon(envio.estado_actual)}</span>
                                            <strong>Estado actual:</strong>
                                            <span>{getStatusMessage(envio.estado_actual)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Transportista</label>
                                            <p><strong>{envio.transportista_nombre || 'No asignado'}</strong></p>
                                            <small>{envio.transportista_telefono || ''}</small>
                                        </div>
                                        <div className="form-group">
                                            <label>Número de Guía</label>
                                            <p><strong>{envio.numero_guia || 'No disponible'}</strong></p>
                                        </div>
                                    </div>
                                    
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Ruta</label>
                                            <p>{envio.origen} → {envio.destino}</p>
                                            <small>Distancia: {envio.distancia_km} km</small>
                                        </div>
                                        <div className="form-group">
                                            <label>Fechas</label>
                                            <p><strong>Salida:</strong> {envio.fecha_salida ? new Date(envio.fecha_salida).toLocaleString() : 'Pendiente'}</p>
                                            <p><strong>Estimada:</strong> {envio.fecha_entrega_estimada ? new Date(envio.fecha_entrega_estimada).toLocaleString() : 'No disponible'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Ubicación Actual</label>
                                        <div style={{ padding: '0.75rem', background: '#e8f0fe', borderRadius: '8px' }}>
                                            📍 {envio.ubicacion_actual || 'Sin información'}
                                        </div>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Última Actualización</label>
                                        <p><small>{new Date(envio.ultima_actualizacion).toLocaleString()}</small></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SeguimientoEnvio;