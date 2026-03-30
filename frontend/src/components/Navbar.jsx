import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
    const { usuario, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <span className="brand-icon"></span>
                    <h1>TechLogistics</h1>
                </Link>
                
                <div className="nav-links">
                    {isAuthenticated ? (
                        <>
                            <Link to="/" className={isActive('/') ? 'active' : ''}>
                                Pedidos
                            </Link>
                            <Link to="/nuevo-pedido" className={isActive('/nuevo-pedido') ? 'active' : ''}>
                                Nuevo Pedido
                            </Link>
                            <Link to="/seguimiento" className={isActive('/seguimiento') ? 'active' : ''}>
                                Seguimiento
                            </Link>
                            <Link to="/clientes" className={isActive('/clientes') ? 'active' : ''}>
                                Clientes
                            </Link>
                            <Link to="/productos" className={isActive('/productos') ? 'active' : ''}>
                                Productos
                            </Link>
                            <div className="user-info">
                                <span>{usuario?.nombre}</span>
                                <button onClick={handleLogout} className="logout-btn">
                                    Cerrar Sesión
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className={isActive('/login') ? 'active' : ''}>
                                Iniciar Sesión
                            </Link>
                            <Link to="/registro" className={isActive('/registro') ? 'active' : ''}>
                                Registrarse
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;