import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Modal from '../components/Modal';
import Alerta from '../components/Alerta';

function ListaClientes() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editando, setEditando] = useState(null);
    const [alerta, setAlerta] = useState(null);
    const [filtros, setFiltros] = useState({
        tipo: '',
        search: ''
    });
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        direccion: '',
        tipo_cliente: 'regular'
    });

    useEffect(() => {
        cargarClientes();
    }, [filtros]);

    const cargarClientes = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtros.tipo) params.append('tipo', filtros.tipo);
            if (filtros.search) params.append('search', filtros.search);
            
            const response = await api.get(`/clientes?${params}`);
            setClientes(response.data);
        } catch (error) {
            mostrarAlerta('error', 'Error al cargar clientes');
        } finally {
            setLoading(false);
        }
    };

    const mostrarAlerta = (tipo, mensaje) => {
        setAlerta({ tipo, mensaje });
        setTimeout(() => setAlerta(null), 5000);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const abrirModal = (cliente = null) => {
        if (cliente) {
            setEditando(cliente.id);
            setFormData({
                nombre: cliente.nombre,
                email: cliente.email,
                telefono: cliente.telefono || '',
                direccion: cliente.direccion || '',
                tipo_cliente: cliente.tipo_cliente
            });
        } else {
            setEditando(null);
            setFormData({
                nombre: '',
                email: '',
                telefono: '',
                direccion: '',
                tipo_cliente: 'regular'
            });
        }
        setModalOpen(true);
    };

    const guardarCliente = async (e) => {
        e.preventDefault();
        
        if (!formData.nombre || !formData.email) {
            mostrarAlerta('warning', 'Nombre y email son obligatorios');
            return;
        }
        
        try {
            if (editando) {
                await api.put(`/clientes/${editando}`, formData);
                mostrarAlerta('success', 'Cliente actualizado exitosamente');
            } else {
                await api.post('/clientes', formData);
                mostrarAlerta('success', 'Cliente creado exitosamente');
            }
            setModalOpen(false);
            cargarClientes();
        } catch (error) {
            mostrarAlerta('error', error.response?.data?.error || 'Error al guardar cliente');
        }
    };

    const eliminarCliente = async (id, nombre) => {
        if (window.confirm(`¿Estás seguro de eliminar a ${nombre}?`)) {
            try {
                await api.delete(`/clientes/${id}`);
                mostrarAlerta('success', 'Cliente eliminado exitosamente');
                cargarClientes();
            } catch (error) {
                mostrarAlerta('error', 'Error al eliminar cliente');
            }
        }
    };

    const getTipoClienteClass = (tipo) => {
        const classes = {
            premium: 'status-badge status-pagado',
            corporativo: 'status-badge status-enviado',
            regular: 'status-badge status-pendiente'
        };
        return classes[tipo] || 'status-badge';
    };

    if (loading) return (
        <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Cargando clientes...</p>
        </div>
    );

    return (
        <div>
            {alerta && <Alerta type={alerta.tipo} message={alerta.mensaje} />}
            
            <div className="card">
                <div className="card-header">
                    <h2>Gestión de Clientes</h2>
                    <button onClick={() => abrirModal()}>
                        + Nuevo Cliente
                    </button>
                </div>
                
                <div className="filters-bar">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={filtros.search}
                            onChange={(e) => setFiltros({...filtros, search: e.target.value})}
                        />
                        <span className="search-icon"></span>
                    </div>
                    <select
                        className="filter-select"
                        value={filtros.tipo}
                        onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                    >
                        <option value="">Todos los tipos</option>
                        <option value="regular">Regular</option>
                        <option value="premium">Premium</option>
                        <option value="corporativo">Corporativo</option>
                    </select>
                </div>
                
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Tipo</th>
                                <th>Pedidos</th>
                                <th>Total Compras</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map(cliente => (
                                <tr key={cliente.id}>
                                    <td>#{cliente.id}</td>
                                    <td>
                                        <strong>{cliente.nombre}</strong>
                                        <br />
                                        <small>{cliente.direccion?.substring(0, 30)}</small>
                                    </td>
                                    <td>{cliente.email}</td>
                                    <td>{cliente.telefono || '—'}</td>
                                    <td>
                                        <span className={getTipoClienteClass(cliente.tipo_cliente)}>
                                            {cliente.tipo_cliente === 'regular' ? 'Regular' : 
                                             cliente.tipo_cliente === 'premium' ? 'Premium' : 'Corporativo'}
                                        </span>
                                    </td>
                                    <td>{cliente.total_pedidos || 0}</td>
                                    <td>${(cliente.total_compras || 0).toLocaleString()}</td>
                                    <td>
                                        <button 
                                            className="btn-sm btn-outline"
                                            onClick={() => abrirModal(cliente)}
                                            style={{ marginRight: '0.5rem' }}
                                        >
                                            Editar
                                        </button>
                                        <button 
                                            className="btn-sm btn-danger"
                                            onClick={() => eliminarCliente(cliente.id, cliente.nombre)}
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <Modal 
                isOpen={modalOpen} 
                onClose={() => setModalOpen(false)}
                title={editando ? 'Editar Cliente' : 'Nuevo Cliente'}
            >
                <form onSubmit={guardarCliente}>
                    <div className="form-group">
                        <label>Nombre completo *</label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            required
                            placeholder="Ingrese el nombre completo"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Email *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="cliente@email.com"
                        />
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input
                                type="tel"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                placeholder="+56 9 1234 5678"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Tipo de cliente</label>
                            <select
                                name="tipo_cliente"
                                value={formData.tipo_cliente}
                                onChange={handleChange}
                            >
                                <option value="regular">Regular</option>
                                <option value="premium">Premium</option>
                                <option value="corporativo">Corporativo</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>Dirección</label>
                        <textarea
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Dirección completa del cliente"
                        />
                    </div>
                    
                    <div className="modal-footer">
                        <button type="button" className="btn-outline" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-success">
                            {editando ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default ListaClientes;