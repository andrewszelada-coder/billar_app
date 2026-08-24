const express = require('express');
const router = express.Router();
const consumosController = require('../controllers/consumos.controller');

router.post('/', consumosController.agregarConsumo);

module.exports = router;
