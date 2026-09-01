import express from 'express';
import configController from '../controllers/config.controller.js';

const router = express.Router();

router.get('/', (req, res, next) => configController.getConfig(req, res, next));
router.post('/', (req, res, next) => configController.updateConfig(req, res, next));

export default router;
