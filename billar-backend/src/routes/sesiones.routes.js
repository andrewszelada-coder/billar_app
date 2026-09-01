import express from 'express';
import sesionesController from '../controllers/sesiones.controller.js';

const router = express.Router();

// 0. GET /mesas y /sesiones/mesas
router.get('/mesas', (req, res, next) => sesionesController.listarMesas(req, res, next));
router.get('/sesiones/mesas', (req, res, next) => sesionesController.listarMesas(req, res, next));

// 1. POST /abrir y /sesiones/abrir
router.post('/abrir', (req, res, next) => sesionesController.abrirMesa(req, res, next));
router.post('/sesiones/abrir', (req, res, next) => sesionesController.abrirMesa(req, res, next));

// 1.5 POST /pausar y /sesiones/pausar
router.post('/pausar', (req, res, next) => sesionesController.pausarMesa(req, res, next));
router.post('/sesiones/pausar', (req, res, next) => sesionesController.pausarMesa(req, res, next));

// 1.6 POST /reanudar y /sesiones/reanudar
router.post('/reanudar', (req, res, next) => sesionesController.reanudarMesa(req, res, next));
router.post('/sesiones/reanudar', (req, res, next) => sesionesController.reanudarMesa(req, res, next));

// 2. POST /consumo y /sesiones/consumo
router.post('/consumo', (req, res, next) => sesionesController.agregarConsumo(req, res, next));
router.post('/sesiones/consumo', (req, res, next) => sesionesController.agregarConsumo(req, res, next));

// GET /consumos/:id_sesion y /sesiones/consumos/:id_sesion
router.get('/consumos/:id_sesion', (req, res, next) => sesionesController.obtenerConsumosSesion(req, res, next));
router.get('/sesiones/consumos/:id_sesion', (req, res, next) => sesionesController.obtenerConsumosSesion(req, res, next));

// 3. POST /cobrar y /sesiones/cobrar
router.post('/cobrar', (req, res, next) => sesionesController.cobrarMesa(req, res, next));
router.post('/sesiones/cobrar', (req, res, next) => sesionesController.cobrarMesa(req, res, next));

export default router;
