import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getMesas = async () => {
  const response = await api.get('/mesas');
  return response.data;
};

export const getProductos = async () => {
  const response = await api.get('/productos');
  return response.data;
};

export const abrirMesa = async (id_mesa) => {
  const response = await api.post('/sesiones/abrir', { id_mesa: Number(id_mesa) });
  return response.data;
};

export const agregarConsumo = async ({ id_sesion, id_producto, cantidad }) => {
  const response = await api.post('/sesiones/consumo', {
    id_sesion,
    id_producto: Number(id_producto),
    cantidad: Number(cantidad)
  });
  return response.data;
};

export const cobrarMesa = async ({ id_sesion, metodo_pago = 'EFECTIVO' }) => {
  const response = await api.post('/sesiones/cobrar', {
    id_sesion,
    metodo_pago
  });
  return response.data;
};

export default api;
