import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Modal from '../components/Modal';
import Alerta from '../components/Alerta';

function ListaPedidos() {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
    const [alerta, setAlerta] = useState(null);
    const [estadisticas, setEstadisticas] = useState(null);
    const [filtros, setFiltros] = useState({
        estado: '',
        search: '',
        fecha_desde: '',
        fecha_hasta: ''
    });

    useEffect(() => {
        cargarPedidos();
        cargarEstadisticas();
    }, [filtros]);

    const cargarPedidos = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtros.estado) params.append('estado', filtros.estado);
            if (filtros.search) params.append('search', filtros.search);
            if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
            if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
            
            const response = await api.get(`/pedidos?${params}`);
            setPedidos(response.data);
        } catch (error) {
            mostrarAlerta('error', 'Error al cargar pedidos');
        } finally {
            setLoading(false);
        }
    };

    const cargarEstadisticas = async () => {
        try {
            const response = await api.get('/pedidos/estadisticas/resumen');
            setEstadisticas(response.data);
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    };

    const mostrarAlerta = (tipo, mensaje) => {
        setAlerta({ tipo, mensaje });
        setTimeout(() => setAlerta(null), 5000);
    };

    const cambiarEstado = async (id, nuevoEstado) => {
        try {
            await api.patch(`/pedidos/${id}/estado`, { estado: nuevoEstado });
            mostrarAlerta('success', `Estado actualizado a ${getStatusLabel(nuevoEstado)}`);
            cargarPedidos();
            cargarEstadisticas();
        } catch (error) {
            mostrarAlerta('error', 'Error al cambiar estado');
        }
    };

    const eliminarPedido = async (id, numero) => {
        if (window.confirm(`¿Estás seguro de eliminar el pedido #${numero}? Esta acción restaurará el stock.`)) {
            try {
                await api.delete(`/pedidos/${id}`);
                mostrarAlerta('success', 'Pedido eliminado exitosamente');
                cargarPedidos();
                cargarEstadisticas();
            } catch (error) {
                mostrarAlerta('error', error.response?.data?.error || 'Error al eliminar pedido');
            }
        }
    };

    const verDetalles = async (id) => {
        try {
            const response = await api.get(`/pedidos/${id}`);
            setPedidoSeleccionado(response.data);
            setModalOpen(true);
        } catch (error) {
            mostrarAlerta('error', 'Error al cargar detalles');
        }
    };

    const getStatusClass = (estado) => {
        return `status-badge status-${estado}`;
    };

    const getStatusLabel = (estado) => {
        const labels = {
            pendiente: 'Pendiente',
            pagado: 'Pagado',
            en_preparacion: 'En Preparación',
            enviado: 'Enviado',
            entregado: 'Entregado',
            cancelado: 'Cancelado'
        };
        return labels[estado] || estado;
    };

    if (loading) return (
        <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Cargando pedidos...</p>
        </div>
    );

    return (
        <div>
            {alerta && <Alerta type={alerta.tipo} message={alerta.mensaje} />}
            
            {/* Estadísticas */}
            {estadisticas && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Pedidos</h3>
                        <div className="stat-number">{estadisticas.total_pedidos}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Total Ventas</h3>
                        <div className="stat-number">${estadisticas.total_ventas?.toLocaleString()}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Pendientes</h3>
                        <div className="stat-number">{estadisticas.pendientes}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Entregados</h3>
                        <div className="stat-number">{estadisticas.entregados}</div>
                    </div>
                </div>
            )}
            
            <div className="card">
                <div className="card-header">
                    <h2>Gestión de Pedidos</h2>
                </div>
                
                <div className="filters-bar">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Buscar por ID, cliente o email..."
                            value={filtros.search}
                            onChange={(e) => setFiltros({...filtros, search: e.target.value})}
                        />
                        <span className="search-icon"></span>
                    </div>
                    <select
                        className="filter-select"
                        value={filtros.estado}
                        onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                    >
                        <option value="">Todos los estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="pagado">Pagado</option>
                        <option value="en_preparacion">En Preparación</option>
                        <option value="enviado">Enviado</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                    <input
                        type="date"
                        className="filter-select"
                        value={filtros.fecha_desde}
                        onChange={(e) => setFiltros({...filtros, fecha_desde: e.target.value})}
                        placeholder="Desde"
                    />
                    <input
                        type="date"
                        className="filter-select"
                        value={filtros.fecha_hasta}
                        onChange={(e) => setFiltros({...filtros, fecha_hasta: e.target.value})}
                        placeholder="Hasta"
                    />
                </div>
                
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Fecha</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Envío</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pedidos.map(pedido => (
                                <tr key={pedido.id}>
                                    <td>#{pedido.id}</td>
                                    <td>
                                        <strong>{pedido.cliente_nombre}</strong>
                                        <br />
                                        <small style={{ color: '#6c757d' }}>{pedido.cliente_email}</small>
                                    </td>
                                    <td>{new Date(pedido.fecha_pedido).toLocaleString()}</td>
                                    <td><strong>${pedido.total.toLocaleString()}</strong></td>
                                    <td>
                                        <span className={getStatusClass(pedido.estado)}>
                                            {getStatusLabel(pedido.estado)}
                                        </span>
                                    </td>
                                    <td>
                                        {pedido.numero_guia ? (
                                            <span style={{ fontSize: '0.8rem' }}>Guía: {pedido.numero_guia}</span>
                                        ) : (
                                            <span className="status-badge status-pendiente">Sin asignar</span>
                                        )}
                                    </td>
                                    <td>
                                        <button 
                                            className="btn-sm btn-outline"
                                            onClick={() => verDetalles(pedido.id)}
                                            style={{ marginRight: '0.5rem' }}
                                        >
                                            Ver
                                        </button>
                                        <select
                                            className="btn-sm"
                                            value={pedido.estado}
                                            onChange={(e) => cambiarEstado(pedido.id, e.target.value)}
                                            style={{ marginRight: '0.5rem', width: 'auto', minWidth: '110px' }}
                                        >
                                            <option value="pendiente">Pendiente</option>
                                            <option value="pagado">Pagado</option>
                                            <option value="en_preparacion">En Preparación</option>
                                            <option value="enviado">Enviado</option>
                                            <option value="entregado">Entregado</option>
                                            <option value="cancelado">Cancelado</option>
                                        </select>
                                        {pedido.estado === 'pendiente' && (
                                            <button 
                                                className="btn-sm btn-danger"
                                                onClick={() => eliminarPedido(pedido.id, pedido.id)}
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Modal de detalles del pedido */}
            <Modal 
                isOpen={modalOpen} 
                onClose={() => setModalOpen(false)}
                title={`Detalles del Pedido #${pedidoSeleccionado?.id}`}
                size="lg"
            >
                {pedidoSeleccionado && (
                    <div>
                        <div className="card" style={{ marginBottom: '1rem', border: '1px solid #e9ecef' }}>
                            <div className="card-header">
                                <h3>Información del Cliente</h3>
                            </div>
                            <div className="card-body">
                                <p><strong>Nombre:</strong> {pedidoSeleccionado.cliente_nombre}</p>
                                <p><strong>Email:</strong> {pedidoSeleccionado.cliente_email}</p>
                                <p><strong>Teléfono:</strong> {pedidoSeleccionado.cliente_telefono || '—'}</p>
                                <p><strong>Dirección:</strong> {pedidoSeleccionado.cliente_direccion || '—'}</p>
                            </div>
                        </div>
                        
                        <div className="card" style={{ marginBottom: '1rem', border: '1px solid #e9ecef' }}>
                            <div className="card-header">
                                <h3>Productos</h3>
                            </div>
                            <div className="card-body">
                                <table style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cantidad</th>
                                            <th>Precio Unitario</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pedidoSeleccionado.detalles?.map(detalle => (
                                            <tr key={detalle.id}>
                                                <td>{detalle.producto_nombre}</td>
                                                <td>{detalle.cantidad}</td>
                                                <td>${detalle.precio_unitario.toLocaleString()}</td>
                                                <td>${detalle.subtotal.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        <tr style={{ fontWeight: 'bold', background: '#f8f9fa' }}>
                                            <td colSpan="3" style={{ textAlign: 'right' }}>Total</td>
                                            <td>${pedidoSeleccionado.total.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        {pedidoSeleccionado.historial?.length > 0 && (
                            <div className="card" style={{ border: '1px solid #e9ecef' }}>
                                <div className="card-header">
                                    <h3>Historial de Cambios</h3>
                                </div>
                                <div className="card-body">
                                    <table style={{ width: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Estado Anterior</th>
                                                <th>Estado Nuevo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pedidoSeleccionado.historial.map(hist => (
                                                <tr key={hist.id}>
                                                    <td>{new Date(hist.fecha_cambio).toLocaleString()}</td>
                                                    <td>{getStatusLabel(hist.estado_anterior)}</td>
                                                    <td>{getStatusLabel(hist.estado_nuevo)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        
                        <div className="modal-footer">
                            <button onClick={() => setModalOpen(false)} className="btn-outline">
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default ListaPedidos;