import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Modal from '../components/Modal';
import Alerta from '../components/Alerta';

function ListaProductos() {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editando, setEditando] = useState(null);
    const [alerta, setAlerta] = useState(null);
    const [filtros, setFiltros] = useState({
        categoria: '',
        search: '',
        stock_bajo: false
    });
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        categoria: '',
        precio: '',
        stock: '',
        stock_minimo: '5',
        imagen_url: ''
    });

    useEffect(() => {
        cargarProductos();
        cargarCategorias();
    }, [filtros]);

    const cargarProductos = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtros.categoria) params.append('categoria', filtros.categoria);
            if (filtros.search) params.append('search', filtros.search);
            if (filtros.stock_bajo) params.append('stock_bajo', 'true');
            
            const response = await api.get(`/productos?${params}`);
            setProductos(response.data);
        } catch (error) {
            mostrarAlerta('error', 'Error al cargar productos');
        } finally {
            setLoading(false);
        }
    };

    const cargarCategorias = async () => {
        try {
            const response = await api.get('/productos/categorias/lista');
            setCategorias(response.data || []);
        } catch (error) {
            console.error('Error cargando categorías:', error);
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

    const abrirModal = (producto = null) => {
        if (producto) {
            setEditando(producto.id);
            setFormData({
                nombre: producto.nombre,
                descripcion: producto.descripcion || '',
                categoria: producto.categoria || '',
                precio: producto.precio,
                stock: producto.stock,
                stock_minimo: producto.stock_minimo,
                imagen_url: producto.imagen_url || ''
            });
        } else {
            setEditando(null);
            setFormData({
                nombre: '',
                descripcion: '',
                categoria: '',
                precio: '',
                stock: '',
                stock_minimo: '5',
                imagen_url: ''
            });
        }
        setModalOpen(true);
    };

    const guardarProducto = async (e) => {
        e.preventDefault();
        
        if (!formData.nombre || !formData.precio || !formData.stock) {
            mostrarAlerta('warning', 'Nombre, precio y stock son obligatorios');
            return;
        }
        
        try {
            if (editando) {
                await api.put(`/productos/${editando}`, formData);
                mostrarAlerta('success', 'Producto actualizado exitosamente');
            } else {
                await api.post('/productos', formData);
                mostrarAlerta('success', 'Producto creado exitosamente');
            }
            setModalOpen(false);
            cargarProductos();
        } catch (error) {
            mostrarAlerta('error', error.response?.data?.error || 'Error al guardar producto');
        }
    };

    const eliminarProducto = async (id, nombre) => {
        if (window.confirm(`¿Estás seguro de eliminar ${nombre}?`)) {
            try {
                const response = await api.delete(`/productos/${id}`);
                mostrarAlerta('success', response.data.message);
                cargarProductos();
            } catch (error) {
                mostrarAlerta('error', 'Error al eliminar producto');
            }
        }
    };

    const actualizarStock = async (id, operacion) => {
        try {
            await api.patch(`/productos/${id}/stock`, {
                stock: 1,
                operacion: operacion
            });
            cargarProductos();
            mostrarAlerta('success', 'Stock actualizado');
        } catch (error) {
            mostrarAlerta('error', 'Error al actualizar stock');
        }
    };

    if (loading) return (
        <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Cargando productos...</p>
        </div>
    );

    return (
        <div>
            {alerta && <Alerta type={alerta.tipo} message={alerta.mensaje} />}
            
            <div className="card">
                <div className="card-header">
                    <h2>Catálogo de Productos</h2>
                    <button onClick={() => abrirModal()}>
                        + Nuevo Producto
                    </button>
                </div>
                
                <div className="filters-bar">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={filtros.search}
                            onChange={(e) => setFiltros({...filtros, search: e.target.value})}
                        />
                        <span className="search-icon"></span>
                    </div>
                    <select
                        className="filter-select"
                        value={filtros.categoria}
                        onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
                    >
                        <option value="">Todas las categorías</option>
                        {categorias.map(cat => (
                            <option key={cat.categoria} value={cat.categoria}>
                                {cat.categoria} ({cat.total})
                            </option>
                        ))}
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <input
                            type="checkbox"
                            checked={filtros.stock_bajo}
                            onChange={(e) => setFiltros({...filtros, stock_bajo: e.target.checked})}
                        />
                        Mostrar solo stock bajo
                    </label>
                </div>
                
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th>Estado</th>
                                <th>Vendidos</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productos.map(producto => (
                                <tr key={producto.id} style={{
                                    background: producto.stock <= producto.stock_minimo ? '#fff8e7' : 'white'
                                }}>
                                    <td>#{producto.id}</td>
                                    <td>
                                        <strong>{producto.nombre}</strong>
                                        <br />
                                        <small style={{ color: '#6c757d' }}>{producto.descripcion?.substring(0, 50)}</small>
                                    </td>
                                    <td>{producto.categoria || '—'}</td>
                                    <td><strong>${producto.precio.toLocaleString()}</strong></td>
                                    <td>
                                        <span style={{
                                            color: producto.stock <= producto.stock_minimo ? '#d93025' : '#0f9d58',
                                            fontWeight: '500'
                                        }}>
                                            {producto.stock} unidades
                                        </span>
                                        {producto.stock <= producto.stock_minimo && (
                                            <span className="status-badge status-cancelado" style={{ marginLeft: '0.5rem' }}>
                                                Stock bajo
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${producto.activo ? 'status-entregado' : 'status-cancelado'}`}>
                                            {producto.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>{producto.total_vendido || 0}</td>
                                    <td>
                                        <button 
                                            className="btn-sm btn-outline"
                                            onClick={() => abrirModal(producto)}
                                            style={{ marginRight: '0.5rem' }}
                                        >
                                            Editar
                                        </button>
                                        <button 
                                            className="btn-sm btn-success"
                                            onClick={() => actualizarStock(producto.id, 'add')}
                                            style={{ marginRight: '0.5rem' }}
                                        >
                                            + Stock
                                        </button>
                                        <button 
                                            className="btn-sm btn-danger"
                                            onClick={() => eliminarProducto(producto.id, producto.nombre)}
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
                title={editando ? 'Editar Producto' : 'Nuevo Producto'}
                size="lg"
            >
                <form onSubmit={guardarProducto}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Nombre del producto *</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                required
                                placeholder="Ej: Laptop Gamer Pro"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Categoría</label>
                            <input
                                type="text"
                                name="categoria"
                                value={formData.categoria}
                                onChange={handleChange}
                                placeholder="Ej: Electrónica, Accesorios..."
                                list="categorias-list"
                            />
                            <datalist id="categorias-list">
                                {categorias.map(cat => (
                                    <option key={cat.categoria} value={cat.categoria} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Descripción detallada del producto"
                        />
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>Precio * ($)</label>
                            <input
                                type="number"
                                name="precio"
                                value={formData.precio}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                placeholder="0"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Stock *</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                required
                                min="0"
                                placeholder="0"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Stock mínimo</label>
                            <input
                                type="number"
                                name="stock_minimo"
                                value={formData.stock_minimo}
                                onChange={handleChange}
                                min="0"
                                placeholder="5"
                            />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>URL de imagen (opcional)</label>
                        <input
                            type="url"
                            name="imagen_url"
                            value={formData.imagen_url}
                            onChange={handleChange}
                            placeholder="https://ejemplo.com/imagen.jpg"
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

export default ListaProductos;