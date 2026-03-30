
## Descripción del Proyecto

TechLogistics S.A. es un sistema para la gestión de pedidos y el seguimiento en tiempo real de envíos. Esta aplicación permite administrar clientes, productos, pedidos y el rastreo de envíos de manera eficiente y profesional.

## Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

### 1. Node.js y npm
- Descargar desde [https://nodejs.org/] (versión 18 o superior)
- Verificar instalación:
  ```bash
  node --version  # Debería mostrar v18.x.x o superior
  npm --version   # Debería mostrar 9.x.x o superior

### Instalación y Configuración  

### Paso 1: Descargar el Proyecto
Clonar con Git
git clone https://github.com/TU_USUARIO/TechLogistics.git
cd TechLogistics

### Paso 2: Configurar el Backend

Navegar a la carpeta del backend
cd backend

Instalar dependencias
npm install

Configurar variables de entorno
Crea un archivo .env dentro de la carpeta backend con el siguiente contenido:

PORT=5000
DB_USER=postgres
DB_PASSWORD=TU_CONTRASEÑA_AQUI
DB_HOST=localhost
DB_PORT=5432
DB_NAME=techlogistics
JWT_SECRET=techlogistics_super_secret_key_2026

Iniciar el servidor backend
npm run dev

Deberías ver en la terminal:

Servidor corriendo en http://localhost:5000


### Paso 4: Configurar el Frontend

Abrir una nueva terminal (mantén el backend corriendo)
cd frontend

Instalar dependencias
npm install

Iniciar la aplicación React
npm run dev

Deberías ver en la terminal:

text
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/

Acceder a la aplicación
Abre tu navegador y ve a: http://localhost:5173

### CREAR BASE DE DATOS

### Paso 1: Abrir pgAdmin

### Paso 2: Conectarse al servidor PostgreSQL

1. En el panel izquierdo, verás "Servers"
2. Haz clic en el icono de servidor o ve a "Object" → "Create" → "Server"
3. En la ventana que aparece:

   **Pestaña "General":**
   - **Name**: Escribe `TechLogistics` (o el nombre que prefieras)

   **Pestaña "Connection":**
   - **Host name/address**: `localhost`
   - **Port**: `5432`
   - **Username**: `postgres`
   - **Password**: La contraseña que configuraste al instalar PostgreSQL

4. Haz clic en Save


### Paso 3: Crear la base de datos

1. En el panel izquierdo, haz clic derecho sobre Databases
2. Selecciona Create → Database
3. En la ventana que aparece:

   **Pestaña "General":**
   - **Database**: Escribe `techlogistics`
   - **Owner**: Selecciona `postgres`

4. Haz clic en Save

### Paso 4: Crear las tablas

#### Usar el Query Tool 

1. Haz clic derecho sobre la base de datos `techlogistics`
2. Selecciona **Query Tool** 
3. Se abrirá una ventana con un editor de texto

4. Copia TODO el script SQL que está al final de todo esto

5. Pégalo en el editor de Query Tool

6. Haz clic en el icono de ejecutar o presiona F5 para ejecutar

7. Si no hay errores, verás el mensaje "Query returned successfully"


## Script SQL Completo

Copia y pega TODO este script en el Query Tool de pgAdmin:

```sql

-- Tabla: Usuarios (para autenticación)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'usuario',
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    CONSTRAINT chk_rol CHECK (rol IN ('admin', 'usuario'))
);

-- Tabla: Clientes
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    tipo_cliente VARCHAR(20) DEFAULT 'regular',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tipo_cliente CHECK (tipo_cliente IN ('regular', 'premium', 'corporativo'))
);

-- Tabla: Productos
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50),
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    stock INT NOT NULL CHECK (stock >= 0),
    stock_minimo INT DEFAULT 5,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Transportistas
CREATE TABLE transportistas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    vehiculo VARCHAR(100),
    placa VARCHAR(20),
    capacidad_kg DECIMAL(10, 2),
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla: Rutas
CREATE TABLE rutas (
    id SERIAL PRIMARY KEY,
    origen VARCHAR(100) NOT NULL,
    destino VARCHAR(100) NOT NULL,
    distancia_km DECIMAL(8, 2) NOT NULL,
    tiempo_estimado_horas DECIMAL(5, 2),
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla: Pedidos
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'pendiente',
    tipo_pago VARCHAR(30),
    notas TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_estado CHECK (estado IN ('pendiente', 'pagado', 'en_preparacion', 'enviado', 'entregado', 'cancelado'))
);

-- Tabla: Detalles de Pedido
CREATE TABLE detalles_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES productos(id),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL,
    descuento DECIMAL(5, 2) DEFAULT 0,
    subtotal DECIMAL(10, 2) GENERATED ALWAYS AS ((cantidad * precio_unitario) * (1 - descuento/100)) STORED
);

-- Tabla: Envios
CREATE TABLE envios (
    id SERIAL PRIMARY KEY,
    pedido_id INT UNIQUE NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    transportista_id INT REFERENCES transportistas(id),
    ruta_id INT REFERENCES rutas(id),
    numero_guia VARCHAR(50),
    fecha_salida TIMESTAMP,
    fecha_entrega_estimada TIMESTAMP,
    fecha_entrega_real TIMESTAMP,
    estado_actual VARCHAR(50) DEFAULT 'en_preparacion',
    ubicacion_actual TEXT,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_estado_envio CHECK (estado_actual IN ('en_preparacion', 'en_transito', 'en_reparto', 'entregado', 'devuelto'))
);

-- Tabla: Historial de Estados de Pedido
CREATE TABLE historial_estados_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT REFERENCES usuarios(id),
    observacion TEXT
);

-- Índices para optimización de búsquedas
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_envios_pedido ON envios(pedido_id);
CREATE INDEX idx_productos_categoria ON productos(categoria);

-- Triggers para auditoría
CREATE OR REPLACE FUNCTION update_pedido_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pedido_fecha
    BEFORE UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION update_pedido_fecha_actualizacion();

CREATE OR REPLACE FUNCTION registrar_historial_estado()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO historial_estados_pedido (pedido_id, estado_anterior, estado_nuevo)
        VALUES (NEW.id, OLD.estado, NEW.estado);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_historial_estado
    AFTER UPDATE OF estado ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION registrar_historial_estado();


-- DATOS DE PRUEBA 

-- Usuario administrador (contraseña: admin123), sino por favor registrate e inicia sesion

INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Administrador', 'admin@techlogistics.com', '$2a$10$rVqRqUqUqUqUqUqUqUqUqOqUqUqUqUqUqUqUqUqUqUqUqUqUq', 'admin');

-- Clientes de prueba
INSERT INTO clientes (nombre, email, telefono, direccion, tipo_cliente) VALUES
('Ana Gómez', 'ana@email.com', '+56912345678', 'Av. Providencia 123, Santiago', 'premium'),
('Luis Pérez', 'luis@email.com', '+56987654321', 'Calle Los Andes 456, Valparaíso', 'regular'),
('María Fernández', 'maria@email.com', '+56911223344', 'Av. Libertador 789, Concepción', 'corporativo'),
('Carlos Rodríguez', 'carlos@email.com', '+56999887766', 'Calle Principal 321, La Serena', 'regular');

-- Productos de prueba
INSERT INTO productos (nombre, descripcion, categoria, precio, stock, stock_minimo) VALUES
('Laptop Gamer Pro', '16GB RAM, 1TB SSD, RTX 4060, pantalla 15.6"', 'Electrónica', 1250000, 15, 3),
('Mouse Inalámbrico', 'Ergonómico, 3 botones, batería 100 horas', 'Accesorios', 35000, 50, 10),
('Teclado Mecánico', 'Switch rojos, RGB, inalámbrico', 'Accesorios', 85000, 30, 5),
('Monitor 24"', 'Full HD, 144Hz, 1ms, IPS', 'Electrónica', 280000, 20, 5),
('Audífonos Gamer', '7.1 surround, micrófono retráctil', 'Audio', 65000, 40, 8),
('Silla Gamer', 'Ergonómica, reclinable, soporte lumbar', 'Muebles', 350000, 12, 3);

-- Transportistas de prueba
INSERT INTO transportistas (nombre, telefono, email, vehiculo, placa, capacidad_kg) VALUES
('Andrés Rápido', '+56911112222', 'andres@rapido.cl', 'Furgoneta Pequeña', 'AB1234', 500),
('María Segura', '+56933334444', 'maria@segura.cl', 'Camión Mediano', 'CD5678', 2000),
('Transportes Chile', '+56955556666', 'contacto@transchile.cl', 'Camión Grande', 'EF9012', 5000);

-- Rutas de prueba
INSERT INTO rutas (origen, destino, distancia_km, tiempo_estimado_horas) VALUES
('Santiago', 'Valparaíso', 120.5, 2.5),
('Santiago', 'Concepción', 510.0, 6.5),
('Santiago', 'La Serena', 470.0, 6.0),
('Valparaíso', 'Santiago', 120.5, 2.5);

-- Pedidos de prueba
INSERT INTO pedidos (cliente_id, total, estado, tipo_pago) VALUES
(1, 155000, 'entregado', 'tarjeta'),
(2, 35000, 'enviado', 'transferencia'),
(3, 280000, 'pagado', 'contraentrega'),
(1, 65000, 'pendiente', 'efectivo');

-- Detalles de pedidos
INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES
(1, 2, 2, 35000), 
(1, 3, 1, 85000),  
(2, 2, 1, 35000),  
(3, 4, 1, 280000), 
(4, 5, 1, 65000);  

-- Envíos de prueba
INSERT INTO envios (pedido_id, transportista_id, ruta_id, numero_guia, estado_actual, ubicacion_actual) VALUES
(1, 1, 1, 'GUI-001-2024', 'entregado', 'Entregado a destinatario'),
(2, 2, 2, 'GUI-002-2024', 'en_transito', 'Ruta 68 km 50'),
(3, 3, 2, 'GUI-003-2024', 'en_preparacion', 'Centro de distribución Santiago'),
(4, 1, 1, 'GUI-004-2024', 'en_reparto', 'En reparto local');