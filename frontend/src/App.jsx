import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import RutaProtegida from './components/RutaProtegida';
import ListaPedidos from './pages/ListaPedidos';
import NuevoPedido from './pages/NuevoPedido';
import SeguimientoEnvio from './pages/SeguimientoEnvio';
import ListaClientes from './pages/ListaClientes';
import ListaProductos from './pages/ListaProductos';
import Login from './pages/Login';
import Registro from './pages/Registro';
import './App.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Navbar />
                <main className="container">
                    <Routes>
                        {/* Rutas públicas */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/registro" element={<Registro />} />
                        
                        {/* Rutas protegidas */}
                        <Route path="/" element={
                            <RutaProtegida>
                                <ListaPedidos />
                            </RutaProtegida>
                        } />
                        <Route path="/nuevo-pedido" element={
                            <RutaProtegida>
                                <NuevoPedido />
                            </RutaProtegida>
                        } />
                        <Route path="/seguimiento" element={
                            <RutaProtegida>
                                <SeguimientoEnvio />
                            </RutaProtegida>
                        } />
                        <Route path="/clientes" element={
                            <RutaProtegida>
                                <ListaClientes />
                            </RutaProtegida>
                        } />
                        <Route path="/productos" element={
                            <RutaProtegida>
                                <ListaProductos />
                            </RutaProtegida>
                        } />
                    </Routes>
                </main>
            </Router>
        </AuthProvider>
    );
}

export default App;