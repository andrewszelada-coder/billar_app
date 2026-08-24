import { supabase } from '../config/supabase.js';
import { abrirSesionSchema, agregarConsumoSchema, cobrarSesionSchema } from '../validations/sesion.schema.js';

export class SesionesController {
  // 1. POST /abrir: Recibe id_mesa -> Cambia mesa a 'OCUPADA' e inserta nueva sesión
  async abrir(req, res, next) {
    try {
      const { id_mesa } = abrirSesionSchema.parse(req.body);

      // Verificar estado actual de la mesa
      const { data: mesa, error: errMesa } = await supabase
        .from('mesas')
        .select('id, estado')
        .eq('id', id_mesa)
        .single();

      if (errMesa || !mesa) {
        return res.status(404).json({ error: 'Mesa no encontrada', code: 'MESA_NOT_FOUND' });
      }

      if (mesa.estado !== 'LIBRE') {
        return res.status(409).json({ error: 'La mesa ya se encuentra ocupada o por cobrar', code: 'MESA_OCUPADA' });
      }

      // Cambiar estado de la mesa a 'OCUPADA'
      const { error: errUpdateMesa } = await supabase
        .from('mesas')
        .update({ estado: 'OCUPADA' })
        .eq('id', id_mesa);

      if (errUpdateMesa) {
        throw new Error(`Error al actualizar estado de mesa: ${errUpdateMesa.message}`);
      }

      // Insertar nueva sesión activa
      const { data: sesion, error: errSesion } = await supabase
        .from('sesiones')
        .insert([
          {
            mesa_id: id_mesa,
            hora_inicio: new Date().toISOString(),
            estado: 'ACTIVA'
          }
        ])
        .select('id')
        .single();

      if (errSesion) {
        throw new Error(`Error al crear sesión: ${errSesion.message}`);
      }

      return res.status(201).json({
        mensaje: 'Mesa abierta exitosamente',
        id_sesion: sesion.id
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message, code: 'VALIDATION_ERROR' });
      }
      next(error);
    }
  }

  // 2. POST /consumo: Recibe id_sesion, id_producto, cantidad -> Añade consumo
  async consumo(req, res, next) {
    try {
      const { id_sesion, id_producto, cantidad } = agregarConsumoSchema.parse(req.body);

      // Verificar que la sesión esté ACTIVA
      const { data: sesion, error: errSesion } = await supabase
        .from('sesiones')
        .select('id, estado')
        .eq('id', id_sesion)
        .single();

      if (errSesion || !sesion || sesion.estado !== 'ACTIVA') {
        return res.status(400).json({ error: 'La sesión no existe o no está activa', code: 'SESION_INVALIDA' });
      }

      // Consultar producto para obtener precio oficial
      const { data: producto, error: errProducto } = await supabase
        .from('productos')
        .select('id, precio')
        .eq('id', id_producto)
        .single();

      if (errProducto || !producto) {
        return res.status(404).json({ error: 'Producto no encontrado', code: 'PRODUCTO_NOT_FOUND' });
      }

      const precio_unitario = Number(producto.precio);
      const subtotal = Number((precio_unitario * cantidad).toFixed(2));

      // Registrar consumo en consumos_sesion
      const { data: nuevoConsumo, error: errInsertConsumo } = await supabase
        .from('consumos_sesion')
        .insert([
          {
            sesion_id: id_sesion,
            producto_id: id_producto,
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
        mensaje: 'Consumo registrado exitosamente',
        consumo: nuevoConsumo
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message, code: 'VALIDATION_ERROR' });
      }
      next(error);
    }
  }

  // 3. POST /cobrar: Recibe id_sesion -> Regla de cortesía de 3 min + cálculo exacto + FINALIZADA
  async cobrar(req, res, next) {
    try {
      const { id_sesion } = cobrarSesionSchema.parse(req.body);

      // Consultar sesión y mesa asociada (para tarifa_hora)
      const { data: sesion, error: errSesion } = await supabase
        .from('sesiones')
        .select(`
          id,
          mesa_id,
          hora_inicio,
          estado,
          mesas ( tarifa_hora )
        `)
        .eq('id', id_sesion)
        .single();

      if (errSesion || !sesion) {
        return res.status(404).json({ error: 'Sesión no encontrada', code: 'SESION_NOT_FOUND' });
      }

      if (sesion.estado !== 'ACTIVA') {
        return res.status(400).json({ error: 'La sesión ya fue cerrada o anulada', code: 'SESION_YA_CERRADA' });
      }

      const horaInicio = new Date(sesion.hora_inicio).getTime();
      const horaActual = new Date().getTime();
      const diffMs = Math.max(0, horaActual - horaInicio);
      const minutosTotales = Math.floor(diffMs / (1000 * 60));

      const tarifaHora = Number(sesion.mesas?.tarifa_hora || 15.00);
      let montoTiempo = 0;

      // REGLA DE ORO DE TIEMPO:
      // <= 3 minutos: costo de tiempo es 0.
      // > 3 minutos: (minutos_totales / 60) * tarifa_hora.
      if (minutosTotales > 3) {
        const horasDecimales = minutosTotales / 60;
        montoTiempo = Number((horasDecimales * tarifaHora).toFixed(2));
      }

      // Obtener suma de consumos
      const { data: consumos, error: errConsumos } = await supabase
        .from('consumos_sesion')
        .select('subtotal')
        .eq('sesion_id', id_sesion);

      if (errConsumos) {
        throw new Error(`Error al consultar consumos: ${errConsumos.message}`);
      }

      const montoConsumos = (consumos || []).reduce((sum, item) => sum + Number(item.subtotal), 0);
      const montoTotal = Number((montoTiempo + montoConsumos).toFixed(2));
      const horaFin = new Date().toISOString();

      // Actualizar sesión a FINALIZADA
      const { error: errUpdateSesion } = await supabase
        .from('sesiones')
        .update({
          hora_fin: horaFin,
          minutos_jugados: minutosTotales,
          monto_tiempo: montoTiempo,
          monto_consumos: montoConsumos,
          monto_total: montoTotal,
          estado: 'FINALIZADA'
        })
        .eq('id', id_sesion);

      if (errUpdateSesion) {
        throw new Error(`Error al cerrar sesión: ${errUpdateSesion.message}`);
      }

      // Liberar mesa a estado 'LIBRE'
      const { error: errUpdateMesa } = await supabase
        .from('mesas')
        .update({ estado: 'LIBRE' })
        .eq('id', sesion.mesa_id);

      if (errUpdateMesa) {
        throw new Error(`Error al liberar mesa: ${errUpdateMesa.message}`);
      }

      return res.json({
        mensaje: 'Mesa cobrada y liberada exitosamente',
        id_sesion: sesion.id,
        minutos_jugados: minutosTotales,
        monto_tiempo: montoTiempo,
        monto_consumos: montoConsumos,
        monto_total: montoTotal
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors[0].message, code: 'VALIDATION_ERROR' });
      }
      next(error);
    }
  }
}

export default new SesionesController();
