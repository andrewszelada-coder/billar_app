import { supabase } from '../config/supabase.js';
import { abrirMesaSchema, agregarConsumoSchema, cobrarMesaSchema } from '../validations/sesion.schema.js';

export class SesionesController {
  // 1. POST /abrir: Recibe id_mesa -> Insert en sesiones_mesa y cambia estado de la mesa a 'OCUPADA'
  async abrirMesa(req, res, next) {
    try {
      const { id_mesa } = abrirMesaSchema.parse(req.body);

      // Verificar estado actual de la mesa
      const { data: mesa, error: errMesa } = await supabase
        .from('mesas')
        .select('id_mesa, tarifa_hora, estado')
        .eq('id_mesa', id_mesa)
        .single();

      if (errMesa || !mesa) {
        return res.status(404).json({ error: 'Mesa no encontrada', code: 'MESA_NOT_FOUND' });
      }

      if (mesa.estado !== 'LIBRE') {
        return res.status(409).json({ error: 'La mesa ya se encuentra ocupada o en otro estado', code: 'MESA_OCUPADA' });
      }

      // Cambiar estado de la mesa a 'OCUPADA'
      const { error: errUpdateMesa } = await supabase
        .from('mesas')
        .update({ estado: 'OCUPADA' })
        .eq('id_mesa', id_mesa);

      if (errUpdateMesa) {
        throw new Error(`Error al actualizar estado de mesa: ${errUpdateMesa.message}`);
      }

      // Insert en la tabla sesiones_mesa registrando tarifa_aplicada
      const { data: sesion, error: errSesion } = await supabase
        .from('sesiones_mesa')
        .insert([
          {
            id_mesa: id_mesa,
            hora_inicio: new Date().toISOString(),
            tarifa_aplicada: mesa.tarifa_hora,
            estado: 'ACTIVA'
          }
        ])
        .select('id_sesion, id_mesa, hora_inicio, estado, tarifa_aplicada')
        .single();

      if (errSesion) {
        throw new Error(`Error al crear sesión: ${errSesion.message}`);
      }

      return res.status(201).json({
        mensaje: 'Mesa abierta exitosamente',
        id_sesion: sesion.id_sesion,
        sesion
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message, code: 'VALIDATION_ERROR' });
      }
      next(error);
    }
  }

  // 2. POST /consumo: Recibe id_sesion (UUID), id_producto, cantidad -> Insert en consumos_sesion
  async agregarConsumo(req, res, next) {
    try {
      const { id_sesion, id_producto, cantidad } = agregarConsumoSchema.parse(req.body);

      // Verificar que la sesión existe y está ACTIVA
      const { data: sesion, error: errSesion } = await supabase
        .from('sesiones_mesa')
        .select('id_sesion, estado')
        .eq('id_sesion', id_sesion)
        .single();

      if (errSesion || !sesion || sesion.estado !== 'ACTIVA') {
        return res.status(400).json({ error: 'La sesión no existe o no se encuentra activa', code: 'SESION_INVALIDA' });
      }

      // Consultar producto para obtener el precio_actual
      const { data: producto, error: errProducto } = await supabase
        .from('productos')
        .select('id_producto, precio_actual, stock, activo')
        .eq('id_producto', id_producto)
        .single();

      if (errProducto || !producto) {
        return res.status(404).json({ error: 'Producto no encontrado', code: 'PRODUCTO_NOT_FOUND' });
      }

      if (!producto.activo) {
        return res.status(400).json({ error: 'El producto no está activo', code: 'PRODUCTO_INACTIVO' });
      }

      const precio_unitario = Number(producto.precio_actual);
      const subtotal = Number((precio_unitario * cantidad).toFixed(2));

      // Insertar consumo en consumos_sesion
      const { data: nuevoConsumo, error: errInsertConsumo } = await supabase
        .from('consumos_sesion')
        .insert([
          {
            id_sesion: id_sesion,
            id_producto: id_producto,
            cantidad,
            precio_unitario,
            subtotal
          }
        ])
        .select('*')
        .single();

      if (errInsertConsumo) {
        throw new Error(`Error al registrar consumo: ${errInsertConsumo.message}`);
      }

      return res.status(201).json({
        mensaje: 'Consumo agregado exitosamente',
        consumo: nuevoConsumo
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message, code: 'VALIDATION_ERROR' });
      }
      next(error);
    }
  }

  // 3. POST /cobrar: Recibe id_sesion (UUID) -> Regla crítica de negocio
  async cobrarMesa(req, res, next) {
    try {
      const { id_sesion, metodo_pago = 'EFECTIVO' } = cobrarMesaSchema.parse(req.body);

      // Leer la hora_inicio de la sesión desde Supabase en sesiones_mesa
      const { data: sesion, error: errSesion } = await supabase
        .from('sesiones_mesa')
        .select('*, mesas(tarifa_hora)')
        .eq('id_sesion', id_sesion)
        .single();

      if (errSesion || !sesion) {
        return res.status(404).json({ error: 'Sesión no encontrada', code: 'SESION_NOT_FOUND' });
      }

      if (sesion.estado !== 'ACTIVA') {
        return res.status(400).json({ error: 'La sesión ya fue cobrada o no está activa', code: 'SESION_INACTIVA' });
      }

      const horaInicio = new Date(sesion.hora_inicio).getTime();
      const horaActual = new Date().getTime();
      const diffMs = Math.max(0, horaActual - horaInicio);
      const minutosTotales = Math.floor(diffMs / (1000 * 60));

      const tarifaHora = Number(sesion.tarifa_aplicada || sesion.mesas?.tarifa_hora || 20.00);
      let totalTiempo = 0;

      // Regla crítica de negocio:
      // Si la diferencia con la hora actual es menor o igual a 3 minutos (tiempo de gracia), el costo de tiempo es 0.
      // Si es mayor, calcula (minutos_totales / 60) * tarifa_hora.
      if (minutosTotales > 3) {
        const horasDecimales = minutosTotales / 60;
        totalTiempo = Number((horasDecimales * tarifaHora).toFixed(2));
      }

      // Sumar consumos registrados
      const { data: consumos, error: errConsumos } = await supabase
        .from('consumos_sesion')
        .select('subtotal')
        .eq('id_sesion', id_sesion);

      if (errConsumos) {
        throw new Error(`Error al consultar consumos: ${errConsumos.message}`);
      }

      const totalConsumos = (consumos || []).reduce((sum, item) => sum + Number(item.subtotal), 0);
      const totalPagar = Number((totalTiempo + totalConsumos).toFixed(2));
      const horaFin = new Date().toISOString();

      // Actualizar sesión a FINALIZADA
      const { error: errUpdateSesion } = await supabase
        .from('sesiones_mesa')
        .update({
          hora_fin: horaFin,
          minutos_jugados: minutosTotales,
          total_tiempo: totalTiempo,
          total_consumos: totalConsumos,
          metodo_pago,
          estado: 'FINALIZADA'
        })
        .eq('id_sesion', id_sesion);

      if (errUpdateSesion) {
        throw new Error(`Error al cerrar la sesión: ${errUpdateSesion.message}`);
      }

      // Actualizar el estado de la mesa a 'LIBRE'
      const { error: errUpdateMesa } = await supabase
        .from('mesas')
        .update({ estado: 'LIBRE' })
        .eq('id_mesa', sesion.id_mesa);

      if (errUpdateMesa) {
        throw new Error(`Error al liberar la mesa: ${errUpdateMesa.message}`);
      }

      return res.json({
        mensaje: 'Mesa cobrada exitosamente',
        id_sesion: sesion.id_sesion,
        id_mesa: sesion.id_mesa,
        hora_inicio: sesion.hora_inicio,
        hora_fin: horaFin,
        minutos_jugados: minutosTotales,
        tarifa_hora: tarifaHora,
        total_tiempo: totalTiempo,
        total_consumos: totalConsumos,
        total_pagar: totalPagar,
        estado: 'FINALIZADA'
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message, code: 'VALIDATION_ERROR' });
      }
      next(error);
    }
  }
  // 0. GET /mesas: Consulta todas las mesas e incluye la sesión activa (hora_inicio, id_sesion) si la mesa está OCUPADA
  async listarMesas(req, res, next) {
    try {
      const { data: mesas, error: errMesas } = await supabase
        .from('mesas')
        .select('*')
        .order('id_mesa', { ascending: true });

      if (errMesas) {
        throw new Error(`Error al consultar mesas: ${errMesas.message}`);
      }

      // Obtener sesiones activas para relacionar hora_inicio
      const { data: sesionesActivas, error: errSesiones } = await supabase
        .from('sesiones_mesa')
        .select('id_sesion, id_mesa, hora_inicio, tarifa_aplicada, estado')
        .eq('estado', 'ACTIVA');

      if (errSesiones) {
        console.warn('Error obteniendo sesiones activas:', errSesiones.message);
      }

      const sesionesMap = new Map();
      (sesionesActivas || []).forEach(s => sesionesMap.set(s.id_mesa, s));

      const mesasConSesion = mesas.map(m => {
        const sesionActiva = m.estado === 'OCUPADA' ? sesionesMap.get(m.id_mesa) || null : null;
        return {
          ...m,
          sesion_activa: sesionActiva
        };
      });

      return res.json(mesasConSesion);
    } catch (error) {
      next(error);
    }
  }
}

export default new SesionesController();


