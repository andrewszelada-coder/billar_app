import express from 'express';
import sesionesController from '../controllers/sesiones.controller.js';

const router = express.Router();

// 1. POST /api/sesiones/abrir
router.post('/abrir', (req, res, next) => sesionesController.abrirMesa(req, res, next));

// 2. POST /api/sesiones/consumo
router.post('/consumo', (req, res, next) => sesionesController.agregarConsumo(req, res, next));

// 3. POST /api/sesiones/cobrar
router.post('/cobrar', (req, res, next) => sesionesController.cobrarMesa(req, res, next));

export default router;

