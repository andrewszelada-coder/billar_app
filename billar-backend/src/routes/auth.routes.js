import express from 'express';
import authController from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));

export default router;
