import { supabase } from '../config/supabase.js';

export class SesionesController {
  // 0. GET /api/mesas (o GET /api/sesiones/mesas): Consulta mesas y empaqueta la sesión activa con consumos
  async listarMesas(req, res, next) {
    try {
      // 1. Obtener todas las mesas ordenadas por ID
      const { data: mesas, error: errMesas } = await supabase
        .from('mesas')
        .select('*')
        .order('id_mesa', { ascending: true });

      if (errMesas) {
        throw new Error(`Error al consultar mesas: ${errMesas.message}`);
      }

      // 2. Obtener sesiones activas o pausadas (estado != 'FINALIZADA') ordenadas descendentemente por hora_inicio
      const { data: sesionesActivas, error: errSesiones } = await supabase
        .from('sesiones_mesa')
        .select('id_sesion, id_mesa, nombre_cliente, hora_inicio, hora_fin, segundos_acumulados, tarifa_aplicada, estado')
        .neq('estado', 'FINALIZADA')
        .order('hora_inicio', { ascending: false });

      if (errSesiones) {
        console.warn('Error obteniendo sesiones activas/pausadas:', errSesiones.message);
      }

      // 3. Obtener consumos de las sesiones activas/pausadas
      const idsSesionesActivas = (sesionesActivas || []).map(s => s.id_sesion);
      let todosConsumos = [];
      if (idsSesionesActivas.length > 0) {
        const { data: dataConsumos, error: errConsumos } = await supabase
          .from('consumos_sesion')
          .select('id_consumo, id_sesion, id_producto, cantidad, precio_unitario, subtotal, productos(nombre)')
          .in('id_sesion', idsSesionesActivas);
        
        if (!errConsumos) {
          todosConsumos = dataConsumos || [];
        }
      }

      const consumosMap = new Map();
      todosConsumos.forEach(c => {
        const key = String(c.id_sesion);
        const list = consumosMap.get(key) || [];
        list.push({
          id_consumo: c.id_consumo,
          id_producto: c.id_producto,
          nombre_producto: c.productos?.nombre || 'Producto',
          cantidad: Number(c.cantidad),
          precio_unitario: Number(c.precio_unitario),
          subtotal: Number(c.subtotal)
        });
        consumosMap.set(key, list);
      });

      // Mapa de la sesión activa más reciente por mesa
      const sesionesMap = new Map();
      (sesionesActivas || []).forEach(s => {
        const key = String(s.id_mesa);
        if (!sesionesMap.has(key)) {
          sesionesMap.set(key, s);
        }
      });

      // Empaquetar sesión activa en cada mesa con estructura JSON exacta
      const mesasConSesion = mesas.map(m => {
        const realId = String(m.id_mesa ?? m.id);
        const isOccupiedOrPaused = m.estado === 'OCUPADA' || m.estado === 'PAUSADA';
        const sesion = isOccupiedOrPaused ? sesionesMap.get(realId) || null : null;

        return {
          id_mesa: realId,
          numero: m.numero,
          tipo: m.tipo,
          tarifa_hora: Number(m.tarifa_hora),
          estado: m.estado,
          sesion_activa: sesion ? {
            id_sesion: sesion.id_sesion,
            hora_inicio: sesion.hora_inicio,
            segundos_acumulados: Number(sesion.segundos_acumulados) || 0,
            tarifa_aplicada: Number(sesion.tarifa_aplicada || m.tarifa_hora),
            estado: sesion.estado,
            consumos: consumosMap.get(String(sesion.id_sesion)) || []
          } : null
        };
      });

      return res.json(mesasConSesion);

    } catch (error) {
      next(error);
    }
  }

  // 1. POST /api/sesiones/abrir: Recibe id_mesa, nombre_cliente y tarifa_aplicada -> Actualiza mesa a OCUPADA e inserta en sesiones_mesa
  async abrirMesa(req, res, next) {
    console.log('=== [abrirMesa] Datos recibidos del frontend ===:', req.body);
    try {
      const { id_mesa, nombre_cliente, tarifa_aplicada } = req.body;
      if (!id_mesa) {
        console.error('[abrirMesa] Error: id_mesa es obligatorio');
        return res.status(400).json({ error: 'El parámetro id_mesa es requerido' });
      }

      // 0. Limpieza preventiva defensiva: Finalizar cualquier sesión previa no cerrada en esta mesa
      const { error: errCleanup } = await supabase
        .from('sesiones_mesa')
        .update({
          estado: 'FINALIZADA',
          hora_fin: new Date().toISOString()
        })
        .eq('id_mesa', id_mesa)
        .in('estado', ['ACTIVA', 'PAUSADA']);

      if (errCleanup) {
        console.warn('[abrirMesa] Advertencia en limpieza preventiva de sesiones:', errCleanup.message);
      }

      // Verificar existencia y estado actual de la mesa
      const { data: mesa, error: errMesa } = await supabase
        .from('mesas')
        .select('id_mesa, tarifa_hora, estado')
        .eq('id_mesa', id_mesa)
        .single();

      if (errMesa || !mesa) {
        console.error('[abrirMesa] Error al consultar mesa en Supabase:', errMesa);
        return res.status(404).json({ error: 'Mesa no encontrada en la base de datos', code: 'MESA_NOT_FOUND' });
      }

      if (mesa.estado !== 'LIBRE') {
        console.warn(`[abrirMesa] Advertencia: Mesa ${id_mesa} ya está en estado ${mesa.estado}`);
        return res.status(409).json({ error: `La mesa ya se encuentra en estado ${mesa.estado}`, code: 'MESA_OCUPADA' });
      }

      // Cambiar estado de la mesa a 'OCUPADA'
      const { error: errUpdateMesa } = await supabase.from('mesas').update({ estado: 'OCUPADA' }).eq('id_mesa', id_mesa);
      if (errUpdateMesa) {
        console.error('[abrirMesa] Error al actualizar estado de la mesa en Supabase:', errUpdateMesa);
        return res.status(500).json({ error: `Error en Supabase al actualizar mesa: ${errUpdateMesa.message}` });
      }

      // Insertar nueva sesión activa en sesiones_mesa
      const horaInicio = new Date().toISOString();
      const payloadInsert = {
        id_mesa: String(id_mesa).trim(),
        nombre_cliente: (nombre_cliente ? String(nombre_cliente).trim() : null),
        hora_inicio: horaInicio,
        segundos_acumulados: 0,
        tarifa_aplicada: Number(tarifa_aplicada || mesa.tarifa_hora),
        estado: 'ACTIVA'
      };

      console.log('=== [abrirMesa] Payload a insertar en sesiones_mesa ===:', payloadInsert);

      const { data: sesion, error: errSesion } = await supabase
        .from('sesiones_mesa')
        .insert([payloadInsert])
        .select('*')
        .single();

      if (errSesion) {
        console.error('=== [abrirMesa] ERROR CRÍTICO EN SUPABASE al insertar sesión ===:', errSesion);
        return res.status(500).json({ error: `Error en Supabase al insertar sesión: ${errSesion.message}` });
      }

      console.log('=== [abrirMesa] Sesión creada exitosamente en Supabase ===:', sesion);

      const sesionActiva = {
        id_sesion: sesion.id_sesion,
        id_mesa: String(sesion.id_mesa),
        hora_inicio: sesion.hora_inicio,
        segundos_acumulados: Number(sesion.segundos_acumulados || 0),
        tarifa_aplicada: Number(sesion.tarifa_aplicada),
        estado: sesion.estado || 'ACTIVA',
        consumos: []
      };


      return res.status(200).json({
        mensaje: 'Mesa abierta exitosamente',
        id_sesion: sesion.id_sesion,
        sesion_activa: sesionActiva,
        sesion: sesionActiva
      });
    } catch (error) {
      console.error('=== [abrirMesa] Excepción en controlador ===:', error);
      return res.status(500).json({ error: error.message || 'Error interno del servidor al abrir la mesa' });
    }
  }

  // 1.5 POST /api/sesiones/pausar: Pausa el tiempo guardando segundos transcurridos en el tramo actual
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

      const horaInicio = new Date(sesion.hora_inicio).getTime();
      const horaActual = Date.now();
      const tramoSegundos = Math.max(0, Math.floor((horaActual - horaInicio) / 1000));
      const totalSegundos = (Number(sesion.segundos_acumulados) || 0) + tramoSegundos;

      // Actualizar sesión a PAUSADA y guardar segundos acumulados
      const { data: sesionActualizada, error: errUpdateSesion } = await supabase
        .from('sesiones_mesa')
        .update({
          estado: 'PAUSADA',
          segundos_acumulados: totalSegundos
        })
        .eq('id_sesion', id_sesion)
        .select('*')
        .single();

      if (errUpdateSesion) throw errUpdateSesion;

      // Cambiar mesa a PAUSADA
      await supabase.from('mesas').update({ estado: 'PAUSADA' }).eq('id_mesa', sesion.id_mesa);

      return res.json({
        mensaje: 'Mesa pausada exitosamente',
        segundos_acumulados: totalSegundos,
        sesion: {
          ...sesionActualizada,
          segundos_acumulados: totalSegundos
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 1.6 POST /api/sesiones/reanudar: Reanuda la sesión fijando nueva hora_inicio sin borrar segundos_acumulados
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

      const nuevaHoraInicio = new Date().toISOString();

      // Reiniciar hora_inicio al momento actual para la nueva etapa activa (manteniendo segundos_acumulados intactos)
      const { data: sesionActualizada, error: errUpdateSesion } = await supabase
        .from('sesiones_mesa')
        .update({
          estado: 'ACTIVA',
          hora_inicio: nuevaHoraInicio
        })
        .eq('id_sesion', id_sesion)
        .select('*')
        .single();

      if (errUpdateSesion) throw errUpdateSesion;

      // Cambiar mesa a OCUPADA
      await supabase.from('mesas').update({ estado: 'OCUPADA' }).eq('id_mesa', sesion.id_mesa);

      return res.json({
        mensaje: 'Mesa reanudada exitosamente',
        sesion: {
          ...sesionActualizada,
          segundos_acumulados: Number(sesionActualizada.segundos_acumulados || 0)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 2. POST /api/sesiones/consumo: Agregar consumo a la sesión activa
  async agregarConsumo(req, res, next) {
    console.log('=== [agregarConsumo] Datos recibidos ===:', req.body);
    try {
      const { id_sesion, id_producto, cantidad } = req.body;
      if (!id_sesion || !id_producto || !cantidad) {
        console.error('[agregarConsumo] Faltan parámetros obligatorios');
        return res.status(400).json({ error: 'Campos requeridos faltantes: id_sesion, id_producto, cantidad' });
      }

      // Consultar producto
      const { data: producto, error: errProducto } = await supabase
        .from('productos')
        .select('*')
        .eq('id_producto', id_producto)
        .single();

      if (errProducto || !producto) {
        console.error('[agregarConsumo] Producto no encontrado:', errProducto);
        return res.status(404).json({ error: 'Producto no encontrado en el inventario' });
      }

      const precio_unitario = Number(producto.precio_actual || producto.precio || 0);
      const subtotal = Number((precio_unitario * Number(cantidad)).toFixed(2));

      // Insertar consumo en consumos_sesion
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
        .select('*, productos(nombre)')
        .single();

      if (errInsertConsumo) {
        console.error('=== [agregarConsumo] ERROR CRÍTICO EN SUPABASE ===:', errInsertConsumo);
        return res.status(500).json({
          error: `Error al registrar consumo en Supabase: ${errInsertConsumo.message}`,
          details: errInsertConsumo
        });
      }

      console.log('=== [agregarConsumo] Consumo registrado con éxito ===:', nuevoConsumo);

      // Descontar stock si aplica
      if (producto.stock !== undefined && producto.stock !== null) {
        await supabase.from('productos').update({
          stock: Math.max(0, producto.stock - cantidad)
        }).eq('id_producto', id_producto);
      }

      return res.status(201).json({
        mensaje: 'Consumo agregado exitosamente',
        consumo: {
          ...nuevoConsumo,
          nombre_producto: nuevoConsumo.productos?.nombre || producto.nombre
        }
      });
    } catch (error) {
      console.error('=== [agregarConsumo] Excepción no controlada ===:', error);
      return res.status(500).json({ error: error.message || 'Error interno al agregar consumo' });
    }
  }

  // GET /api/sesiones/consumos/:id_sesion -> Obtener consumos de la sesión
  async obtenerConsumosSesion(req, res, next) {
    try {
      const { id_sesion } = req.params;
      const { data: consumos, error } = await supabase
        .from('consumos_sesion')
        .select('*, productos(nombre)')
        .eq('id_sesion', id_sesion);

      if (error) throw error;
      
      const consumosFormateados = (consumos || []).map(c => ({
        id_consumo: c.id_consumo,
        id_producto: c.id_producto,
        nombre_producto: c.productos?.nombre || 'Producto',
        cantidad: Number(c.cantidad),
        precio_unitario: Number(c.precio_unitario),
        subtotal: Number(c.subtotal)
      }));

      return res.json(consumosFormateados);
    } catch (err) {
      next(err);
    }
  }

  // 3. POST /api/sesiones/cobrar: Finaliza el cobro de la sesión
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

      // Consultar configuración de minutos de gracia
      const { data: configData } = await supabase.from('configuracion').select('*').single();
      const habilitarGracia = configData ? Boolean(configData.habilitar_gracia) : false;
      const minutosGracia = configData ? Number(configData.minutos_gracia || 3) : 3;

      let segundosTramoActual = 0;
      if (sesion.estado === 'ACTIVA') {
        const horaInicio = new Date(sesion.hora_inicio).getTime();
        const horaActual = Date.now();
        segundosTramoActual = Math.max(0, Math.floor((horaActual - horaInicio) / 1000));
      }

      const segundosTotales = (Number(sesion.segundos_acumulados) || 0) + segundosTramoActual;
      const minutosTotales = Math.floor(segundosTotales / 60);
      const tarifaHora = Number(sesion.tarifa_aplicada || sesion.mesas?.tarifa_hora || 20.00);
      
      let totalTiempo = 0;
      if (!habilitarGracia || minutosTotales > minutosGracia) {
        totalTiempo = Number(((segundosTotales / 3600) * tarifaHora).toFixed(2));
      }

      // Sumar consumos
      const { data: consumos, error: errConsumos } = await supabase
        .from('consumos_sesion')
        .select('*, productos(nombre)')
        .eq('id_sesion', id_sesion);

      if (errConsumos) throw errConsumos;

      const consumosFormateados = (consumos || []).map(c => ({
        id_consumo: c.id_consumo,
        id_producto: c.id_producto,
        nombre_producto: c.productos?.nombre || 'Producto',
        cantidad: Number(c.cantidad),
        precio_unitario: Number(c.precio_unitario),
        subtotal: Number(c.subtotal)
      }));

      const totalConsumos = consumosFormateados.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
      const totalPagar = Number((totalTiempo + totalConsumos).toFixed(2));
      const horaFin = new Date().toISOString();

      // Actualizar sesión a FINALIZADA
      const { error: errUpdateSesion } = await supabase
        .from('sesiones_mesa')
        .update({
          hora_fin: horaFin,
          segundos_acumulados: segundosTotales,
          total_tiempo: totalTiempo,
          total_consumos: totalConsumos,
          estado: 'FINALIZADA'
        })
        .eq('id_sesion', id_sesion);

      if (errUpdateSesion) {
        console.error('[cobrarMesa] Error al finalizar sesión en Supabase:', errUpdateSesion);
        throw errUpdateSesion;
      }

      // Liberar la mesa (soporta id_mesa o id)
      let { error: errUpdateMesa } = await supabase
        .from('mesas')
        .update({ estado: 'LIBRE' })
        .eq('id_mesa', sesion.id_mesa);

      if (errUpdateMesa) {
        console.warn('[cobrarMesa] Error al liberar mesa por id_mesa, intentando por id:', errUpdateMesa.message);
        const { error: errAlt } = await supabase
          .from('mesas')
          .update({ estado: 'LIBRE' })
          .eq('id', sesion.id_mesa);

        if (errAlt) {
          console.error('[cobrarMesa] Error crítico al liberar mesa en Supabase:', errAlt);
        }
      }

      return res.json({
        mensaje: 'Mesa cobrada exitosamente',
        id_sesion: sesion.id_sesion,
        id_mesa: sesion.id_mesa,
        nombre_cliente: sesion.nombre_cliente,
        hora_inicio: sesion.hora_inicio,
        hora_fin: horaFin,
        minutos_jugados: minutosTotales,
        segundos_acumulados: segundosTotales,
        tarifa_hora: tarifaHora,
        total_tiempo: totalTiempo,
        total_consumos: totalConsumos,
        total_pagar: totalPagar,
        consumos: consumosFormateados,
        estado: 'FINALIZADA'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SesionesController();
