import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes.js';
import sesionesRoutes from './routes/sesiones.routes.js';
import mesasRoutes from './routes/mesas.routes.js';
import productosRoutes from './routes/productos.routes.js';
import reportesRoutes from './routes/reportes.routes.js';
import configRoutes from './routes/config.routes.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares base
app.use(cors());
app.use(express.json());

// Middleware de Rate Limiting
const rateLimiter = rateLimit({
  windowMs: 1000,
  max: 20,
  message: {
    error: 'Demasiadas solicitudes en poco tiempo. Por favor espera un momento.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', rateLimiter);

// Registros de Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/sesiones', sesionesRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/config', configRoutes);

// Retrocompatibilidad para endpoints legados
app.use('/api', sesionesRoutes);

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('[Error Servidor]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    code: err.code || 'INTERNAL_SERVER_ERROR'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[BilliardOS Backend] Servidor corriendo en puerto ${PORT}`);
  });
}

export default app;
