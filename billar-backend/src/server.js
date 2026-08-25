import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import sesionesRouter from './routes/sesiones.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares base
app.use(cors());
app.use(express.json());

// Middleware de Rate Limiting (Máximo 5 peticiones por segundo para evitar doble-clic)
const rateLimiter = rateLimit({
  windowMs: 1000,
  max: 5,
  message: {
    error: 'Demasiadas solicitudes en poco tiempo. Por favor espera un momento.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', rateLimiter);

// Rutas de API
app.use('/api/sesiones', sesionesRouter);
app.use('/api', sesionesRouter);


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
