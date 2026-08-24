import express from 'express';
import sesionesController from '../controllers/sesiones.controller.js';

const router = express.Router();

// 1. POST /api/sesiones/abrir
router.post('/abrir', (req, res, next) => sesionesController.abrir(req, res, next));

// 2. POST /api/sesiones/consumo
router.post('/consumo', (req, res, next) => sesionesController.consumo(req, res, next));

// 3. POST /api/sesiones/cobrar
router.post('/cobrar', (req, res, next) => sesionesController.cobrar(req, res, next));

export default router;
