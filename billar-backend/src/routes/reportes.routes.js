import express from 'express';
import reportesController from '../controllers/reportes.controller.js';

const router = express.Router();

router.get('/dashboard', (req, res, next) => reportesController.getDashboardReport(req, res, next));

export default router;
