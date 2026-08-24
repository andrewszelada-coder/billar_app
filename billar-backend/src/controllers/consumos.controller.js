const billiardService = require('../services/billiard.service');
const { agregarConsumoSchema } = require('../schemas/billiard.schema');

class ConsumosController {
  async agregarConsumo(req, res, next) {
    try {
      const parsed = agregarConsumoSchema.parse(req.body);
      const consumo = await billiardService.agregarConsumo(
        parsed.sesion_id,
        parsed.producto_id,
        parsed.cantidad
      );
      res.status(201).json({
        mensaje: 'Consumo agregado exitosamente',
        consumo
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message, code: 'VALIDATION_ERROR' });
      }
      next(error);
    }
  }
}

module.exports = new ConsumosController();
