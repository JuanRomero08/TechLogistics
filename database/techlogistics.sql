--
-- PostgreSQL database dump
--

\restrict SC3XHk7qsbxsOkDrSyCCnG7fJLG9May2hUc6iSYzCVnlqAzjjw2UD4Cd2fiuOXX

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-03-29 23:12:25

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 238 (class 1255 OID 17408)
-- Name: registrar_historial_estado(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.registrar_historial_estado() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO historial_estados_pedido (pedido_id, estado_anterior, estado_nuevo)
        VALUES (NEW.id, OLD.estado, NEW.estado);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.registrar_historial_estado() OWNER TO postgres;

--
-- TOC entry 237 (class 1255 OID 17406)
-- Name: update_pedido_fecha_actualizacion(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_pedido_fecha_actualizacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_pedido_fecha_actualizacion() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 17244)
-- Name: clientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clientes (
    id integer NOT NULL,
    usuario_id integer,
    nombre character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    telefono character varying(20),
    direccion text,
    tipo_cliente character varying(20) DEFAULT 'regular'::character varying,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tipo_cliente CHECK (((tipo_cliente)::text = ANY ((ARRAY['regular'::character varying, 'premium'::character varying, 'corporativo'::character varying])::text[])))
);


ALTER TABLE public.clientes OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 17243)
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clientes_id_seq OWNER TO postgres;

--
-- TOC entry 5039 (class 0 OID 0)
-- Dependencies: 221
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- TOC entry 232 (class 1259 OID 17329)
-- Name: detalles_pedido; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalles_pedido (
    id integer NOT NULL,
    pedido_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    descuento numeric(5,2) DEFAULT 0,
    subtotal numeric(10,2) GENERATED ALWAYS AS ((((cantidad)::numeric * precio_unitario) * ((1)::numeric - (descuento / (100)::numeric)))) STORED,
    CONSTRAINT detalles_pedido_cantidad_check CHECK ((cantidad > 0))
);


ALTER TABLE public.detalles_pedido OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 17328)
-- Name: detalles_pedido_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalles_pedido_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalles_pedido_id_seq OWNER TO postgres;

--
-- TOC entry 5040 (class 0 OID 0)
-- Dependencies: 231
-- Name: detalles_pedido_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalles_pedido_id_seq OWNED BY public.detalles_pedido.id;


--
-- TOC entry 234 (class 1259 OID 17354)
-- Name: envios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.envios (
    id integer NOT NULL,
    pedido_id integer NOT NULL,
    transportista_id integer,
    ruta_id integer,
    numero_guia character varying(50),
    fecha_salida timestamp without time zone,
    fecha_entrega_estimada timestamp without time zone,
    fecha_entrega_real timestamp without time zone,
    estado_actual character varying(50) DEFAULT 'en_preparacion'::character varying,
    ubicacion_actual text,
    ultima_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    observaciones text,
    CONSTRAINT chk_estado_envio CHECK (((estado_actual)::text = ANY ((ARRAY['en_preparacion'::character varying, 'en_transito'::character varying, 'en_reparto'::character varying, 'entregado'::character varying, 'devuelto'::character varying])::text[])))
);


ALTER TABLE public.envios OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 17353)
-- Name: envios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.envios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.envios_id_seq OWNER TO postgres;

--
-- TOC entry 5041 (class 0 OID 0)
-- Dependencies: 233
-- Name: envios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.envios_id_seq OWNED BY public.envios.id;


--
-- TOC entry 236 (class 1259 OID 17385)
-- Name: historial_estados_pedido; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historial_estados_pedido (
    id integer NOT NULL,
    pedido_id integer NOT NULL,
    estado_anterior character varying(20),
    estado_nuevo character varying(20),
    fecha_cambio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    usuario_id integer,
    observacion text
);


ALTER TABLE public.historial_estados_pedido OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 17384)
-- Name: historial_estados_pedido_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.historial_estados_pedido_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historial_estados_pedido_id_seq OWNER TO postgres;

--
-- TOC entry 5042 (class 0 OID 0)
-- Dependencies: 235
-- Name: historial_estados_pedido_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.historial_estados_pedido_id_seq OWNED BY public.historial_estados_pedido.id;


--
-- TOC entry 230 (class 1259 OID 17306)
-- Name: pedidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedidos (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    fecha_pedido timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    tipo_pago character varying(30),
    notas text,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_estado CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'pagado'::character varying, 'en_preparacion'::character varying, 'enviado'::character varying, 'entregado'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT chk_tipo_pago CHECK (((tipo_pago)::text = ANY ((ARRAY['efectivo'::character varying, 'tarjeta'::character varying, 'transferencia'::character varying, 'contraentrega'::character varying])::text[])))
);


ALTER TABLE public.pedidos OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 17305)
-- Name: pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pedidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pedidos_id_seq OWNER TO postgres;

--
-- TOC entry 5043 (class 0 OID 0)
-- Dependencies: 229
-- Name: pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedidos_id_seq OWNED BY public.pedidos.id;


--
-- TOC entry 224 (class 1259 OID 17266)
-- Name: productos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    categoria character varying(50),
    precio numeric(10,2) NOT NULL,
    stock integer NOT NULL,
    stock_minimo integer DEFAULT 5,
    imagen_url text,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT productos_precio_check CHECK ((precio >= (0)::numeric)),
    CONSTRAINT productos_stock_check CHECK ((stock >= 0))
);


ALTER TABLE public.productos OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 17265)
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_id_seq OWNER TO postgres;

--
-- TOC entry 5044 (class 0 OID 0)
-- Dependencies: 223
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- TOC entry 228 (class 1259 OID 17294)
-- Name: rutas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rutas (
    id integer NOT NULL,
    origen character varying(100) NOT NULL,
    destino character varying(100) NOT NULL,
    distancia_km numeric(8,2) NOT NULL,
    tiempo_estimado_horas numeric(5,2),
    activo boolean DEFAULT true
);


ALTER TABLE public.rutas OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 17293)
-- Name: rutas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rutas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rutas_id_seq OWNER TO postgres;

--
-- TOC entry 5045 (class 0 OID 0)
-- Dependencies: 227
-- Name: rutas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rutas_id_seq OWNED BY public.rutas.id;


--
-- TOC entry 226 (class 1259 OID 17284)
-- Name: transportistas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transportistas (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    telefono character varying(20),
    email character varying(100),
    vehiculo character varying(100),
    placa character varying(20),
    capacidad_kg numeric(10,2),
    activo boolean DEFAULT true
);


ALTER TABLE public.transportistas OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 17283)
-- Name: transportistas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transportistas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transportistas_id_seq OWNER TO postgres;

--
-- TOC entry 5046 (class 0 OID 0)
-- Dependencies: 225
-- Name: transportistas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transportistas_id_seq OWNED BY public.transportistas.id;


--
-- TOC entry 220 (class 1259 OID 17226)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    rol character varying(20) DEFAULT 'usuario'::character varying,
    activo boolean DEFAULT true,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso timestamp without time zone,
    CONSTRAINT chk_rol CHECK (((rol)::text = ANY ((ARRAY['admin'::character varying, 'usuario'::character varying])::text[])))
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 17225)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 5047 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 4801 (class 2604 OID 17247)
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- TOC entry 4817 (class 2604 OID 17332)
-- Name: detalles_pedido id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_pedido ALTER COLUMN id SET DEFAULT nextval('public.detalles_pedido_id_seq'::regclass);


--
-- TOC entry 4820 (class 2604 OID 17357)
-- Name: envios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.envios ALTER COLUMN id SET DEFAULT nextval('public.envios_id_seq'::regclass);


--
-- TOC entry 4823 (class 2604 OID 17388)
-- Name: historial_estados_pedido id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_estados_pedido ALTER COLUMN id SET DEFAULT nextval('public.historial_estados_pedido_id_seq'::regclass);


--
-- TOC entry 4812 (class 2604 OID 17309)
-- Name: pedidos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos ALTER COLUMN id SET DEFAULT nextval('public.pedidos_id_seq'::regclass);


--
-- TOC entry 4804 (class 2604 OID 17269)
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- TOC entry 4810 (class 2604 OID 17297)
-- Name: rutas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rutas ALTER COLUMN id SET DEFAULT nextval('public.rutas_id_seq'::regclass);


--
-- TOC entry 4808 (class 2604 OID 17287)
-- Name: transportistas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transportistas ALTER COLUMN id SET DEFAULT nextval('public.transportistas_id_seq'::regclass);


--
-- TOC entry 4797 (class 2604 OID 17229)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 5019 (class 0 OID 17244)
-- Dependencies: 222
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clientes (id, usuario_id, nombre, email, telefono, direccion, tipo_cliente, fecha_registro) FROM stdin;
1	\N	Ana Gómez	ana@email.com	+56912345678	Av. Providencia 123, Santiago	premium	2026-03-29 22:25:53.794233
2	\N	Luis Pérez	luis@email.com	+56987654321	Calle Los Andes 456, Valparaíso	regular	2026-03-29 22:25:53.794233
4	\N	Carlos Rodríguez	carlos@email.com	+56999887766	Calle Principal 321, La Serena	regular	2026-03-29 22:25:53.794233
3	\N	María Fernández	maria@email.com	+56911223344	Av. Libertador 789, Concepción	premium	2026-03-29 22:25:53.794233
\.


--
-- TOC entry 5029 (class 0 OID 17329)
-- Dependencies: 232
-- Data for Name: detalles_pedido; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalles_pedido (id, pedido_id, producto_id, cantidad, precio_unitario, descuento) FROM stdin;
1	1	2	2	35000.00	0.00
2	1	3	1	65000.00	0.00
3	2	2	1	35000.00	0.00
4	3	4	1	280000.00	0.00
6	5	2	3	35000.00	0.00
\.


--
-- TOC entry 5031 (class 0 OID 17354)
-- Dependencies: 234
-- Data for Name: envios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.envios (id, pedido_id, transportista_id, ruta_id, numero_guia, fecha_salida, fecha_entrega_estimada, fecha_entrega_real, estado_actual, ubicacion_actual, ultima_actualizacion, observaciones) FROM stdin;
1	1	1	1	GUI-001-2024	\N	\N	\N	entregado	Entregado a destinatario	2026-03-29 22:25:53.794233	\N
2	2	2	2	GUI-002-2024	\N	\N	\N	en_transito	Ruta 68 km 50	2026-03-29 22:25:53.794233	\N
3	3	3	2	GUI-003-2024	\N	\N	\N	en_preparacion	Centro de distribución Santiago	2026-03-29 22:25:53.794233	\N
\.


--
-- TOC entry 5033 (class 0 OID 17385)
-- Dependencies: 236
-- Data for Name: historial_estados_pedido; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historial_estados_pedido (id, pedido_id, estado_anterior, estado_nuevo, fecha_cambio, usuario_id, observacion) FROM stdin;
\.


--
-- TOC entry 5027 (class 0 OID 17306)
-- Dependencies: 230
-- Data for Name: pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedidos (id, cliente_id, fecha_pedido, total, estado, tipo_pago, notas, fecha_actualizacion) FROM stdin;
1	1	2026-03-29 22:25:53.794233	135000.00	entregado	tarjeta	\N	2026-03-29 22:25:53.794233
2	2	2026-03-29 22:25:53.794233	35000.00	enviado	transferencia	\N	2026-03-29 22:25:53.794233
3	3	2026-03-29 22:25:53.794233	280000.00	pagado	contraentrega	\N	2026-03-29 22:25:53.794233
5	4	2026-03-29 23:02:56.511038	105000.00	pendiente	efectivo	\N	2026-03-29 23:02:56.511038
\.


--
-- TOC entry 5021 (class 0 OID 17266)
-- Dependencies: 224
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productos (id, nombre, descripcion, categoria, precio, stock, stock_minimo, imagen_url, activo, fecha_creacion) FROM stdin;
3	Teclado Mecánico	Switch rojos, RGB, inalámbrico	Accesorios	85000.00	30	5	https://via.placeholder.com/200x200?text=Teclado	t	2026-03-29 22:25:53.794233
4	Monitor 24"	Full HD, 144Hz, 1ms	Electrónica	280000.00	20	5	https://via.placeholder.com/200x200?text=Monitor	t	2026-03-29 22:25:53.794233
6	Silla Gamer	Ergonómica, reclinable	Muebles	350000.00	12	3	https://via.placeholder.com/200x200?text=Silla	t	2026-03-29 22:25:53.794233
1	Laptop Gamer Pro 5	16GB RAM, 1TB SSD, RTX 4060	Electrónica	1250000.00	15	3	https://via.placeholder.com/200x200?text=Laptop	t	2026-03-29 22:25:53.794233
2	Mouse Inalámbrico	Ergonómico, 3 botones, batería 100h	Accesorios	35000.00	47	10	https://via.placeholder.com/200x200?text=Mouse	t	2026-03-29 22:25:53.794233
\.


--
-- TOC entry 5025 (class 0 OID 17294)
-- Dependencies: 228
-- Data for Name: rutas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rutas (id, origen, destino, distancia_km, tiempo_estimado_horas, activo) FROM stdin;
1	Santiago	Valparaíso	120.50	2.50	t
2	Santiago	Concepción	510.00	6.50	t
3	Santiago	La Serena	470.00	6.00	t
4	Santiago	Antofagasta	1360.00	15.00	t
5	Valparaíso	Santiago	120.50	2.50	t
\.


--
-- TOC entry 5023 (class 0 OID 17284)
-- Dependencies: 226
-- Data for Name: transportistas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transportistas (id, nombre, telefono, email, vehiculo, placa, capacidad_kg, activo) FROM stdin;
1	Andrés Rápido	+56911112222	andres@rapido.cl	Furgoneta Pequeña	AB1234	500.00	t
2	María Segura	+56933334444	maria@segura.cl	Camión Mediano	CD5678	2000.00	t
3	Transportes Chile	+56955556666	contacto@transchile.cl	Camión Grande	EF9012	5000.00	t
\.


--
-- TOC entry 5017 (class 0 OID 17226)
-- Dependencies: 220
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, email, password_hash, rol, activo, fecha_registro, ultimo_acceso) FROM stdin;
1	Administrador	admin@techlogistics.com	$2a$10$rVqRqUqUqUqUqUqUqUqUqOqUqUqUqUqUqUqUqUqUqUqUqUqUq	admin	t	2026-03-29 22:25:53.794233	\N
2	Juan	juanromero08p@gmail.com	$2b$10$t3gjcu7hP0wli0EoyKTg3OMfQp9LKd8NblqH8pZdDajyK0/QCAocO	usuario	t	2026-03-29 22:45:46.363412	2026-03-29 23:07:00.920069
\.


--
-- TOC entry 5048 (class 0 OID 0)
-- Dependencies: 221
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clientes_id_seq', 4, true);


--
-- TOC entry 5049 (class 0 OID 0)
-- Dependencies: 231
-- Name: detalles_pedido_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalles_pedido_id_seq', 6, true);


--
-- TOC entry 5050 (class 0 OID 0)
-- Dependencies: 233
-- Name: envios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.envios_id_seq', 4, true);


--
-- TOC entry 5051 (class 0 OID 0)
-- Dependencies: 235
-- Name: historial_estados_pedido_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historial_estados_pedido_id_seq', 2, true);


--
-- TOC entry 5052 (class 0 OID 0)
-- Dependencies: 229
-- Name: pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedidos_id_seq', 5, true);


--
-- TOC entry 5053 (class 0 OID 0)
-- Dependencies: 223
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productos_id_seq', 6, true);


--
-- TOC entry 5054 (class 0 OID 0)
-- Dependencies: 227
-- Name: rutas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rutas_id_seq', 5, true);


--
-- TOC entry 5055 (class 0 OID 0)
-- Dependencies: 225
-- Name: transportistas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transportistas_id_seq', 3, true);


--
-- TOC entry 5056 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 2, true);


--
-- TOC entry 4839 (class 2606 OID 17259)
-- Name: clientes clientes_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_email_key UNIQUE (email);


--
-- TOC entry 4841 (class 2606 OID 17257)
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- TOC entry 4851 (class 2606 OID 17342)
-- Name: detalles_pedido detalles_pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_pedido
    ADD CONSTRAINT detalles_pedido_pkey PRIMARY KEY (id);


--
-- TOC entry 4853 (class 2606 OID 17368)
-- Name: envios envios_pedido_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.envios
    ADD CONSTRAINT envios_pedido_id_key UNIQUE (pedido_id);


--
-- TOC entry 4855 (class 2606 OID 17366)
-- Name: envios envios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.envios
    ADD CONSTRAINT envios_pkey PRIMARY KEY (id);


--
-- TOC entry 4857 (class 2606 OID 17395)
-- Name: historial_estados_pedido historial_estados_pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_estados_pedido
    ADD CONSTRAINT historial_estados_pedido_pkey PRIMARY KEY (id);


--
-- TOC entry 4849 (class 2606 OID 17322)
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- TOC entry 4843 (class 2606 OID 17282)
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- TOC entry 4847 (class 2606 OID 17304)
-- Name: rutas rutas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rutas
    ADD CONSTRAINT rutas_pkey PRIMARY KEY (id);


--
-- TOC entry 4845 (class 2606 OID 17292)
-- Name: transportistas transportistas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transportistas
    ADD CONSTRAINT transportistas_pkey PRIMARY KEY (id);


--
-- TOC entry 4835 (class 2606 OID 17241)
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 4837 (class 2606 OID 17239)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4833 (class 1259 OID 17242)
-- Name: idx_usuarios_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);


--
-- TOC entry 4867 (class 2620 OID 17409)
-- Name: pedidos trigger_historial_estado; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_historial_estado AFTER UPDATE OF estado ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.registrar_historial_estado();


--
-- TOC entry 4868 (class 2620 OID 17407)
-- Name: pedidos trigger_update_pedido_fecha; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_pedido_fecha BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.update_pedido_fecha_actualizacion();


--
-- TOC entry 4858 (class 2606 OID 17260)
-- Name: clientes clientes_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- TOC entry 4860 (class 2606 OID 17343)
-- Name: detalles_pedido detalles_pedido_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_pedido
    ADD CONSTRAINT detalles_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- TOC entry 4861 (class 2606 OID 17348)
-- Name: detalles_pedido detalles_pedido_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_pedido
    ADD CONSTRAINT detalles_pedido_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- TOC entry 4862 (class 2606 OID 17369)
-- Name: envios envios_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.envios
    ADD CONSTRAINT envios_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- TOC entry 4863 (class 2606 OID 17379)
-- Name: envios envios_ruta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.envios
    ADD CONSTRAINT envios_ruta_id_fkey FOREIGN KEY (ruta_id) REFERENCES public.rutas(id);


--
-- TOC entry 4864 (class 2606 OID 17374)
-- Name: envios envios_transportista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.envios
    ADD CONSTRAINT envios_transportista_id_fkey FOREIGN KEY (transportista_id) REFERENCES public.transportistas(id);


--
-- TOC entry 4865 (class 2606 OID 17396)
-- Name: historial_estados_pedido historial_estados_pedido_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_estados_pedido
    ADD CONSTRAINT historial_estados_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- TOC entry 4866 (class 2606 OID 17401)
-- Name: historial_estados_pedido historial_estados_pedido_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_estados_pedido
    ADD CONSTRAINT historial_estados_pedido_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4859 (class 2606 OID 17323)
-- Name: pedidos pedidos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


-- Completed on 2026-03-29 23:12:25

--
-- PostgreSQL database dump complete
--

\unrestrict SC3XHk7qsbxsOkDrSyCCnG7fJLG9May2hUc6iSYzCVnlqAzjjw2UD4Cd2fiuOXX

