import express from 'express';
import sesionesController from '../controllers/sesiones.controller.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// 0. GET /api/mesas
router.get('/mesas', (req, res, next) => sesionesController.listarMesas(req, res, next));

// GET /api/productos (Catálogo para consumos)
router.get('/productos', async (req, res, next) => {
  try {
    const { data: productos, error } = await supabase.from('productos').select('*').eq('activo', true);
    if (error) throw error;
    res.json(productos);
  } catch (err) {
    next(err);
  }
});

// 1. POST /api/sesiones/abrir
router.post('/abrir', (req, res, next) => sesionesController.abrirMesa(req, res, next));

// 2. POST /api/sesiones/consumo
router.post('/consumo', (req, res, next) => sesionesController.agregarConsumo(req, res, next));

// 3. POST /api/sesiones/cobrar
router.post('/cobrar', (req, res, next) => sesionesController.cobrarMesa(req, res, next));

export default router;


