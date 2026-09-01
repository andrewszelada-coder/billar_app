import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para JWT
api.interceptors.request.use((config) => {
  const session = localStorage.getItem('billiard_session');
  if (session) {
    try {
      const parsed = JSON.parse(session);
      if (parsed?.access_token) {
        config.headers.Authorization = `Bearer ${parsed.access_token}`;
      }
    } catch (e) {}
  }
  return config;
});

// Auth
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

// Mesas y Configuración
export const getMesas = async () => {
  const response = await api.get('/mesas');
  return response.data;
};

export const crearMesa = async ({ numero, tipo = 'Pool', tarifa_hora = 20 }) => {
  const response = await api.post('/mesas', {
    numero,
    tipo,
    tarifa_hora: Number(tarifa_hora)
  });
  return response.data;
};

export const actualizarMesa = async (id, payload) => {
  const response = await api.put(`/mesas/${id}`, payload);
  return response.data;
};

export const eliminarMesa = async (id) => {
  const response = await api.delete(`/mesas/${id}`);
  return response.data;
};

export const getConfiguracion = async () => {
  const response = await api.get('/config');
  return response.data;
};

export const guardarConfiguracion = async (config) => {
  const response = await api.post('/config', config);
  return response.data;
};

// Sesiones
export const abrirMesa = async (id_mesa, tarifa_aplicada) => {
  if (!id_mesa) {
    throw new Error('El parámetro id_mesa es requerido');
  }
  const payload = {
    id_mesa: String(id_mesa).trim(),
    tarifa_aplicada: Number(tarifa_aplicada || 20)
  };
  console.log('[api.js] Enviando payload a POST /sesiones/abrir:', payload);
  const response = await api.post('/sesiones/abrir', payload);
  return response.data;
};

export const pausarMesa = async (id_sesion) => {
  const response = await api.post('/sesiones/pausar', { id_sesion });
  return response.data;
};

export const reanudarMesa = async (id_sesion) => {
  const response = await api.post('/sesiones/reanudar', { id_sesion });
  return response.data;
};

export const agregarConsumo = async ({ id_sesion, id_producto, cantidad }) => {
  const response = await api.post('/sesiones/consumo', {
    id_sesion,
    id_producto: String(id_producto).trim(),
    cantidad: Number(cantidad)
  });
  return response.data;
};

export const getConsumosSesion = async (id_sesion) => {
  const response = await api.get(`/sesiones/consumos/${id_sesion}`);
  return response.data;
};

export const cobrarMesa = async ({ id_sesion, metodo_pago = 'EFECTIVO' }) => {
  const response = await api.post('/sesiones/cobrar', {
    id_sesion,
    metodo_pago
  });
  return response.data;
};

// Inventario / Productos
export const getProductos = async () => {
  const response = await api.get('/productos');
  return response.data;
};

export const crearProducto = async (producto) => {
  const response = await api.post('/productos', producto);
  return response.data;
};

export const actualizarProducto = async (id, producto) => {
  const response = await api.put(`/productos/${id}`, producto);
  return response.data;
};

export const eliminarProducto = async (id) => {
  const response = await api.delete(`/productos/${id}`);
  return response.data;
};

// Reportes BI
export const getReportesDashboard = async () => {
  const response = await api.get('/reportes/dashboard');
  return response.data;
};

export default api;
