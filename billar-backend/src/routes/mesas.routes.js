import express from 'express';
import mesasController from '../controllers/mesas.controller.js';

const router = express.Router();

router.get('/', (req, res, next) => mesasController.listar(req, res, next));
router.post('/', (req, res, next) => mesasController.crear(req, res, next));
router.post('/tarifa-global', (req, res, next) => mesasController.actualizarTarifaGlobal(req, res, next));
router.put('/:id', (req, res, next) => mesasController.actualizar(req, res, next));
router.delete('/:id', (req, res, next) => mesasController.eliminar(req, res, next));

export default router;
