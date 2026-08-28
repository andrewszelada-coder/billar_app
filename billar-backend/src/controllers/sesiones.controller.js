import { supabase } from '../config/supabase.js';

export class SesionesController {
  // 0. GET /mesas: Consulta todas las mesas e incluye la sesión activa (hora_inicio, id_sesion, minutos_acumulados) si la mesa está OCUPADA o PAUSADA
  async listarMesas(req, res, next) {
    try {
      const { data: mesas, error: errMesas } = await supabase
        .from('mesas')
        .select('*')
        .order('id_mesa', { ascending: true });

      if (errMesas) {
        throw new Error(`Error al consultar mesas: ${errMesas.message}`);
      }

      // Obtener sesiones activas o pausadas
      const { data: sesionesActivas, error: errSesiones } = await supabase
        .from('sesiones_mesa')
        .select('id_sesion, id_mesa, hora_inicio, hora_pausa, minutos_acumulados, tarifa_aplicada, estado')
        .in('estado', ['ACTIVA', 'PAUSADA']);

      if (errSesiones) {
        console.warn('Error obteniendo sesiones activas/pausadas:', errSesiones.message);
      }

      const sesionesMap = new Map();
      (sesionesActivas || []).forEach(s => sesionesMap.set(s.id_mesa, s));

      const mesasConSesion = mesas.map(m => {
        const sesionActiva = (m.estado === 'OCUPADA' || m.estado === 'PAUSADA') ? sesionesMap.get(m.id_mesa) || null : null;
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

  // 1. POST /abrir: Recibe id_mesa -> Insert en sesiones_mesa y cambia estado de la mesa a 'OCUPADA'
  async abrirMesa(req, res, next) {
    try {
      const { id_mesa } = req.body;
      if (!id_mesa) return res.status(400).json({ error: 'id_mesa requerido' });

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
        return res.status(409).json({ error: 'La mesa ya se encuentra ocupada o pausada', code: 'MESA_OCUPADA' });
      }

      // Cambiar estado de la mesa a 'OCUPADA'
      await supabase.from('mesas').update({ estado: 'OCUPADA' }).eq('id_mesa', id_mesa);

      // Insert en la tabla sesiones_mesa registrando tarifa_aplicada y minutos_acumulados = 0
      const { data: sesion, error: errSesion } = await supabase
        .from('sesiones_mesa')
        .insert([
          {
            id_mesa: id_mesa,
            hora_inicio: new Date().toISOString(),
            minutos_acumulados: 0,
            tarifa_aplicada: mesa.tarifa_hora,
            estado: 'ACTIVA'
          }
        ])
        .select('*')
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
      next(error);
    }
  }

  // 1.5 POST /pausar: Pausa el tiempo guardando minutos jugados hasta el momento
  async pausarMesa(req, res, next) {
    try {
      const { id_sesion } = req.body;
      if (!id_sesion) return res.status(400).json({ error: 'id_sesion requerido' });

      const { data: sesion, error: errSesion } = await supabase
        .from('sesiones_mesa')
        .select('*')
        .eq('id_sesion', id_sesion)
        .single();

      if (errSesion || !sesion) return res.status(404).json({ error: 'Sesión no encontrada' });
      if (sesion.estado !== 'ACTIVA') return res.status(400).json({ error: 'La sesión no está activa para ser pausada' });

      const horaInicioStr = sesion.hora_inicio.endsWith('Z') ? sesion.hora_inicio : `${sesion.hora_inicio}Z`;
      const horaInicio = new Date(horaInicioStr).getTime();
      const horaActual = new Date().getTime();
      const tramoMinutos = Math.max(0, horaActual - horaInicio) / (1000 * 60);
      const totalAcumulado = Number((sesion.minutos_acumulados || 0)) + tramoMinutos;

      // Actualizar sesión a PAUSADA y guardar minutos
      const { error: errUpdateSesion } = await supabase
        .from('sesiones_mesa')
        .update({
          estado: 'PAUSADA',
          minutos_acumulados: totalAcumulado,
          hora_pausa: new Date().toISOString()
        })
        .eq('id_sesion', id_sesion);

      if (errUpdateSesion) throw errUpdateSesion;

      // Cambiar mesa a PAUSADA
      await supabase.from('mesas').update({ estado: 'PAUSADA' }).eq('id_mesa', sesion.id_mesa);

      return res.json({ mensaje: 'Mesa pausada exitosamente', minutos_acumulados: totalAcumulado });
    } catch (error) {
      next(error);
    }
  }

  // 1.6 POST /reanudar: Reanuda el tiempo
  async reanudarMesa(req, res, next) {
    try {
      const { id_sesion } = req.body;
      if (!id_sesion) return res.status(400).json({ error: 'id_sesion requerido' });

      const { data: sesion, error: errSesion } = await supabase
        .from('sesiones_mesa')
        .select('*')
        .eq('id_sesion', id_sesion)
        .single();

      if (errSesion || !sesion) return res.status(404).json({ error: 'Sesión no encontrada' });
      if (sesion.estado !== 'PAUSADA') return res.status(400).json({ error: 'La sesión no está pausada' });

      // Reiniciar hora_inicio al momento actual para la nueva etapa
      const { error: errUpdateSesion } = await supabase
        .from('sesiones_mesa')
        .update({
          estado: 'ACTIVA',
          hora_inicio: new Date().toISOString(),
          hora_pausa: null
        })
        .eq('id_sesion', id_sesion);

      if (errUpdateSesion) throw errUpdateSesion;

      await supabase.from('mesas').update({ estado: 'OCUPADA' }).eq('id_mesa', sesion.id_mesa);

      return res.json({ mensaje: 'Mesa reanudada exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  // 2. POST /consumo: Recibe id_sesion (UUID), id_producto, cantidad -> Insert en consumos_sesion
  async agregarConsumo(req, res, next) {
    try {
      const { id_sesion, id_producto, cantidad } = req.body;
      if (!id_sesion || !id_producto || !cantidad) {
        return res.status(400).json({ error: 'Campos requeridos faltantes' });
      }

      // Consultar producto
      const { data: producto, error: errProducto } = await supabase
        .from('productos')
        .select('*')
        .eq('id_producto', id_producto)
        .single();

      if (errProducto || !producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const precio_unitario = Number(producto.precio_actual);
      const subtotal = Number((precio_unitario * cantidad).toFixed(2));

      // Insertar consumo
      const { data: nuevoConsumo, error: errInsertConsumo } = await supabase
        .from('consumos_sesion')
        .insert([
          {
            id_sesion,
            id_producto,
            cantidad: Number(cantidad),
            precio_unitario,
            subtotal
          }
        ])
        .select('*')
        .single();

      if (errInsertConsumo) throw errInsertConsumo;

      // Descontar stock si existe
      if (producto.stock !== undefined && producto.stock !== null) {
        await supabase.from('productos').update({
          stock: Math.max(0, producto.stock - cantidad)
        }).eq('id_producto', id_producto);
      }

      return res.status(201).json({
        mensaje: 'Consumo agregado exitosamente',
        consumo: nuevoConsumo
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /consumos/:id_sesion -> Obtener consumos de la sesión
  async obtenerConsumosSesion(req, res, next) {
    try {
      const { id_sesion } = req.params;
      const { data: consumos, error } = await supabase
        .from('consumos_sesion')
        .select('*, productos(nombre)')
        .eq('id_sesion', id_sesion);

      if (error) throw error;
      return res.json(consumos || []);
    } catch (err) {
      next(err);
    }
  }

  // 3. POST /cobrar: Finaliza el cobro considerando minutos totales y la opción configurable de minutos de gracia
  async cobrarMesa(req, res, next) {
    try {
      const { id_sesion, metodo_pago = 'EFECTIVO' } = req.body;
      if (!id_sesion) return res.status(400).json({ error: 'id_sesion es requerido' });

      const { data: sesion, error: errSesion } = await supabase
        .from('sesiones_mesa')
        .select('*, mesas(tarifa_hora)')
        .eq('id_sesion', id_sesion)
        .single();

      if (errSesion || !sesion) {
        return res.status(404).json({ error: 'Sesión no encontrada' });
      }

      if (sesion.estado === 'FINALIZADA') {
        return res.status(400).json({ error: 'La sesión ya fue cobrada' });
      }

      // Consultar configuración para saber si la gracia está habilitada
      const { data: configData } = await supabase.from('configuracion').select('*').single();
      const habilitarGracia = configData ? Boolean(configData.habilitar_gracia) : false;
      const minutosGracia = configData ? Number(configData.minutos_gracia || 3) : 3;

      let minutosTramoActual = 0;
      if (sesion.estado === 'ACTIVA') {
        const horaInicioStr = sesion.hora_inicio.endsWith('Z') ? sesion.hora_inicio : `${sesion.hora_inicio}Z`;
        const horaInicio = new Date(horaInicioStr).getTime();
        const horaActual = new Date().getTime();
        minutosTramoActual = Math.max(0, horaActual - horaInicio) / (1000 * 60);
      }

      const minutosTotales = (sesion.minutos_acumulados || 0) + minutosTramoActual;
      const tarifaHora = Number(sesion.tarifa_aplicada || sesion.mesas?.tarifa_hora || 20.00);
      
      let totalTiempo = 0;
      // Regla dinámica: Si la gracia está deshabilitada, se cobra siempre el tiempo transcurrido desde el minuto 1.
      if (!habilitarGracia || minutosTotales > minutosGracia) {
        totalTiempo = Number(((minutosTotales / 60) * tarifaHora).toFixed(2));
      }

      // Sumar consumos
      const { data: consumos, error: errConsumos } = await supabase
        .from('consumos_sesion')
        .select('*, productos(nombre)')
        .eq('id_sesion', id_sesion);

      if (errConsumos) throw errConsumos;

      const totalConsumos = (consumos || []).reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
      const totalPagar = Number((totalTiempo + totalConsumos).toFixed(2));
      const horaFin = new Date().toISOString();

      // Actualizar sesión
      await supabase
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

      // Liberar la mesa
      await supabase.from('mesas').update({ estado: 'LIBRE' }).eq('id_mesa', sesion.id_mesa);

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
        consumos: consumos || [],
        estado: 'FINALIZADA'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SesionesController();
