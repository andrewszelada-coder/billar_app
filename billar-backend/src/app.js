const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const mesasRoutes = require('./routes/mesas.routes');
const sesionesRoutes = require('./routes/sesiones.routes');
const consumosRoutes = require('./routes/consumos.routes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware de seguridad y parsing
app.use(cors());
app.use(express.json());

// REGLA DE NEGOCIO / TECNICA: Middleware de Rate Limiting (máximo 5 peticiones por segundo)
const apiLimiter = rateLimit({
  windowMs: 1000, // 1 segundo
  max: 5, // Límite de 5 peticiones por ventana por IP
  message: {
    error: 'Demasiadas solicitudes simultáneas. Por favor intenta de nuevo en un segundo.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

// Rutas API
app.use('/api/mesas', mesasRoutes);
app.use('/api/sesiones', sesionesRoutes);
app.use('/api/consumos', consumosRoutes);

// Manejador de errores global
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

module.exports = app;
