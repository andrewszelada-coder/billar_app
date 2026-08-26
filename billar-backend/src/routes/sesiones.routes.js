import express from 'express';
import sesionesController from '../controllers/sesiones.controller.js';

const router = express.Router();

// 0. GET /api/sesiones/mesas
router.get('/mesas', (req, res, next) => sesionesController.listarMesas(req, res, next));

// 1. POST /api/sesiones/abrir
router.post('/abrir', (req, res, next) => sesionesController.abrirMesa(req, res, next));

// 1.5 POST /api/sesiones/pausar
router.post('/pausar', (req, res, next) => sesionesController.pausarMesa(req, res, next));

// 1.6 POST /api/sesiones/reanudar
router.post('/reanudar', (req, res, next) => sesionesController.reanudarMesa(req, res, next));

// 2. POST /api/sesiones/consumo
router.post('/consumo', (req, res, next) => sesionesController.agregarConsumo(req, res, next));

// GET /api/sesiones/consumos/:id_sesion
router.get('/consumos/:id_sesion', (req, res, next) => sesionesController.obtenerConsumosSesion(req, res, next));

// 3. POST /api/sesiones/cobrar
router.post('/cobrar', (req, res, next) => sesionesController.cobrarMesa(req, res, next));

export default router;
