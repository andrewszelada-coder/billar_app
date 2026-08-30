import express from 'express';
import mesasController from '../controllers/mesas.controller.js';
import sesionesController from '../controllers/sesiones.controller.js';

const router = express.Router();

router.get('/', (req, res, next) => sesionesController.listarMesas(req, res, next));
router.post('/', (req, res, next) => mesasController.crear(req, res, next));
router.post('/tarifa-global', (req, res, next) => mesasController.actualizarTarifaGlobal(req, res, next));
router.put('/:id', (req, res, next) => mesasController.actualizar(req, res, next));
router.delete('/:id', (req, res, next) => mesasController.eliminar(req, res, next));

export default router;
