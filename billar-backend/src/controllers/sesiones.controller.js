import sesionesService from '../services/sesiones.service.js';

export class SesionesController {
  
  async listarMesas(req, res, next) {
    try {
      const mesasConSesion = await sesionesService.listarMesas();
      return res.json(mesasConSesion);
    } catch (error) {
      console.error('=== [listarMesas] Excepción en controlador ===:', error);
      next(error);
    }
  }

  async abrirMesa(req, res, next) {
    try {
      const { id_mesa, nombre_cliente, tarifa_aplicada } = req.body;
      const data = await sesionesService.abrirMesa(id_mesa, nombre_cliente, tarifa_aplicada);
      
      return res.status(200).json({
        mensaje: 'Mesa abierta exitosamente',
        id_sesion: data.id_sesion,
        sesion_activa: data.sesion_activa,
        sesion: data.sesion_activa
      });
    } catch (error) {
      console.error('=== [abrirMesa] Excepción en controlador ===:', error);
      const status = error.status || 500;
      return res.status(status).json({ error: error.message || 'Error interno del servidor al abrir la mesa' });
    }
  }

  async pausarMesa(req, res, next) {
    try {
      const { id_sesion } = req.body;
      const sesionActualizada = await sesionesService.pausarMesa(id_sesion);

      return res.json({
        mensaje: 'Mesa pausada exitosamente',
        segundos_acumulados: sesionActualizada.segundos_acumulados,
        sesion: sesionActualizada
      });
    } catch (error) {
      console.error('=== [pausarMesa] Excepción en controlador ===:', error);
      const status = error.status || 500;
      return res.status(status).json({ error: error.message || 'Error interno del servidor al pausar la mesa' });
    }
  }

  async reanudarMesa(req, res, next) {
    try {
      const { id_sesion } = req.body;
      const sesionActualizada = await sesionesService.reanudarMesa(id_sesion);

      return res.json({
        mensaje: 'Mesa reanudada exitosamente',
        sesion: sesionActualizada
      });
    } catch (error) {
      console.error('=== [reanudarMesa] Excepción en controlador ===:', error);
      const status = error.status || 500;
      return res.status(status).json({ error: error.message || 'Error interno del servidor al reanudar la mesa' });
    }
  }

  async agregarConsumo(req, res, next) {
    try {
      const { id_sesion, id_producto, cantidad } = req.body;
      const nuevoConsumo = await sesionesService.agregarConsumo(id_sesion, id_producto, cantidad);

      return res.status(201).json({
        mensaje: 'Consumo agregado exitosamente',
        consumo: nuevoConsumo
      });
    } catch (error) {
      console.error('=== [agregarConsumo] Excepción en controlador ===:', error);
      const status = error.status || 500;
      return res.status(status).json({ error: error.message || 'Error interno al agregar consumo' });
    }
  }

  async obtenerConsumosSesion(req, res, next) {
    try {
      const { id_sesion } = req.params;
      const consumosFormateados = await sesionesService.obtenerConsumosSesion(id_sesion);
      return res.json(consumosFormateados);
    } catch (error) {
      console.error('=== [obtenerConsumosSesion] Excepción en controlador ===:', error);
      const status = error.status || 500;
      return res.status(status).json({ error: error.message || 'Error interno al obtener consumos' });
    }
  }

  async cobrarMesa(req, res, next) {
    try {
      const { id_sesion, metodo_pago = 'EFECTIVO' } = req.body;
      const resultado = await sesionesService.cobrarMesa(id_sesion, metodo_pago);

      return res.json({
        mensaje: 'Mesa cobrada exitosamente',
        ...resultado
      });
    } catch (error) {
      console.error('=== [cobrarMesa] Excepción en controlador ===:', error);
      const status = error.status || 500;
      return res.status(status).json({ error: error.message || 'Error interno al cobrar mesa' });
    }
  }
}

export default new SesionesController();
