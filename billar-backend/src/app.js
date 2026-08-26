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

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 1000,
  max: 20,
  message: {
    error: 'Demasiadas solicitudes simultáneas. Por favor intenta de nuevo en un segundo.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/sesiones', sesionesRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/reportes', reportesRoutes);

app.use((err, req, res, next) => {
  console.error('[Error de Servidor]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    code: err.code || 'INTERNAL_ERROR'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[BilliardOS Backend] Servidor ejecutándose en http://localhost:${PORT}`);
  });
}

export default app;
