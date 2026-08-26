import express from 'express';
import productosController from '../controllers/productos.controller.js';

const router = express.Router();

router.get('/', (req, res, next) => productosController.listar(req, res, next));
router.post('/', (req, res, next) => productosController.crear(req, res, next));
router.put('/:id', (req, res, next) => productosController.actualizar(req, res, next));
router.delete('/:id', (req, res, next) => productosController.eliminar(req, res, next));

export default router;
