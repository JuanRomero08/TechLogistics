import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Alerta from '../components/Alerta';

function NuevoPedido() {
    const navigate = useNavigate();
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [clienteId, setClienteId] = useState('');
    const [items, setItems] = useState([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [tipoPago, setTipoPago] = useState('');
    const [notas, setNotas] = useState('');
    const [loading, setLoading] = useState(false);
    const [alerta, setAlerta] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [clientesRes, productosRes] = await Promise.all([
                api.get('/clientes'),
                api.get('/productos')
            ]);
            setClientes(clientesRes.data);
            setProductos(productosRes.data.filter(p => p.activo && p.stock > 0));
        } catch (error) {
            mostrarAlerta('error', 'Error al cargar datos');
        }
    };

    const mostrarAlerta = (tipo, mensaje) => {
        setAlerta({ tipo, mensaje });
        setTimeout(() => setAlerta(null), 5000);
    };

    const agregarProducto = () => {
        if (!productoSeleccionado || cantidad < 1) {
            mostrarAlerta('warning', 'Seleccione un producto y una cantidad válida');
            return;
        }
        
        const producto = productos.find(p => p.id === parseInt(productoSeleccionado));
        if (!producto) return;
        
        if (cantidad > producto.stock) {
            mostrarAlerta('warning', `Stock insuficiente. Disponible: ${producto.stock}`);
            return;
        }
        
        const itemExistente = items.find(item => item.producto_id === producto.id);
        if (itemExistente) {
            const nuevaCantidad = itemExistente.cantidad + cantidad;
            if (nuevaCantidad > producto.stock) {
                mostrarAlerta('warning', `Stock insuficiente. Disponible: ${producto.stock}`);
                return;
            }
            setItems(items.map(item =>
                item.producto_id === producto.id
                    ? { ...item, cantidad: nuevaCantidad }
                    : item
            ));
        } else {
            setItems([...items, {
                producto_id: producto.id,
                nombre: producto.nombre,
                cantidad: cantidad,
                precio: producto.precio,
                stock: producto.stock
            }]);
        }
        
        setProductoSeleccionado('');
        setCantidad(1);
        mostrarAlerta('success', 'Producto agregado al pedido');
    };

    const eliminarProducto = (productoId) => {
        setItems(items.filter(item => item.producto_id !== productoId));
        mostrarAlerta('success', 'Producto eliminado del pedido');
    };

    const calcularTotal = () => {
        return items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    };

    const enviarPedido = async () => {
        if (!clienteId) {
            mostrarAlerta('warning', 'Seleccione un cliente');
            return;
        }
        
        if (items.length === 0) {
            mostrarAlerta('warning', 'Agregue al menos un producto');
            return;
        }
        
        setLoading(true);
        try {
            const pedidoData = {
                cliente_id: parseInt(clienteId),
                productos: items.map(item => ({
                    producto_id: item.producto_id,
                    cantidad: item.cantidad
                })),
                tipo_pago: tipoPago || null,
                notas: notas || null
            };
            
            await api.post('/pedidos', pedidoData);
            mostrarAlerta('success', 'Pedido creado exitosamente');
            setTimeout(() => navigate('/'), 1500);
        } catch (error) {
            mostrarAlerta('error', error.response?.data?.error || 'Error al crear pedido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {alerta && <Alerta type={alerta.tipo} message={alerta.mensaje} />}
            
            <div className="card">
                <div className="card-header">
                    <h2>Nuevo Pedido</h2>
                </div>
                <div className="card-body">
                    <div className="form-group">
                        <label>Cliente *</label>
                        <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                            <option value="">Seleccionar cliente</option>
                            {clientes.map(cliente => (
                                <option key={cliente.id} value={cliente.id}>
                                    {cliente.nombre} - {cliente.email}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e9ecef' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Agregar Productos</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Producto</label>
                                <select 
                                    value={productoSeleccionado} 
                                    onChange={(e) => setProductoSeleccionado(e.target.value)}
                                >
                                    <option value="">Seleccionar producto</option>
                                    {productos.map(producto => (
                                        <option key={producto.id} value={producto.id}>
                                            {producto.nombre} - ${producto.precio.toLocaleString()} (Stock: {producto.stock})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Cantidad</label>
                                <input
                                    type="number"
                                    placeholder="Cantidad"
                                    value={cantidad}
                                    onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                                    min="1"
                                />
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button onClick={agregarProducto} style={{ width: '100%' }}>
                                    Agregar Producto
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {items.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Resumen del Pedido</h3>
                            <div className="table-container" style={{ padding: 0 }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cantidad</th>
                                            <th>Precio Unitario</th>
                                            <th>Subtotal</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item) => (
                                            <tr key={item.producto_id}>
                                                <td>{item.nombre}</td>
                                                <td>{item.cantidad}</td>
                                                <td>${item.precio.toLocaleString()}</td>
                                                <td>${(item.precio * item.cantidad).toLocaleString()}</td>
                                                <td>
                                                    <button 
                                                        className="btn-sm btn-danger"
                                                        onClick={() => eliminarProducto(item.producto_id)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr style={{ fontWeight: 'bold', background: '#f8f9fa' }}>
                                            <td colSpan="3" style={{ textAlign: 'right' }}>Total</td>
                                            <td>${calcularTotal().toLocaleString()}</td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    <div className="form-row" style={{ marginTop: '1.5rem' }}>
                        <div className="form-group">
                            <label>Tipo de Pago</label>
                            <select value={tipoPago} onChange={(e) => setTipoPago(e.target.value)}>
                                <option value="">Seleccionar</option>
                                <option value="efectivo">Efectivo</option>
                                <option value="tarjeta">Tarjeta</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="contraentrega">Contra entrega</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Notas adicionales</label>
                            <textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                rows="2"
                                placeholder="Observaciones del pedido..."
                            />
                        </div>
                    </div>
                    
                    <div className="modal-footer" style={{ padding: '1rem 0 0 0' }}>
                        <button 
                            type="button" 
                            className="btn-outline" 
                            onClick={() => navigate('/')}
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={enviarPedido} 
                            disabled={loading}
                            className="btn-success"
                        >
                            {loading ? 'Creando Pedido...' : 'Confirmar Pedido'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NuevoPedido;