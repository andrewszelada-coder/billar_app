import { supabase } from '../config/supabase.js';

export class SesionesService {
  async listarMesas() {
    // 1. Obtener todas las mesas ordenadas por ID
    const { data: mesas, error: errMesas } = await supabase
      .from('mesas')
      .select('*')
      .order('id_mesa', { ascending: true });

    if (errMesas) throw new Error(`Error al consultar mesas: ${errMesas.message}`);

    // 2. Obtener sesiones activas o pausadas
    const { data: sesionesActivas, error: errSesiones } = await supabase
      .from('sesiones_mesa')
      .select('id_sesion, id_mesa, nombre_cliente, hora_inicio, hora_fin, segundos_acumulados, tarifa_aplicada, estado')
      .neq('estado', 'FINALIZADA')
      .order('hora_inicio', { ascending: false });

    if (errSesiones) {
      console.warn('Error obteniendo sesiones activas/pausadas:', errSesiones.message);
    }

    // 3. Obtener consumos
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

    const sesionesMap = new Map();
    (sesionesActivas || []).forEach(s => {
      const key = String(s.id_mesa);
      if (!sesionesMap.has(key)) {
        sesionesMap.set(key, s);
      }
    });

    return mesas.map(m => {
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
  }

  async abrirMesa(id_mesa, nombre_cliente, tarifa_aplicada) {
    if (!id_mesa) {
      const err = new Error('El parámetro id_mesa es requerido');
      err.status = 400;
      throw err;
    }

    // Limpieza preventiva
    await supabase
      .from('sesiones_mesa')
      .update({
        estado: 'FINALIZADA',
        hora_fin: new Date().toISOString()
      })
      .eq('id_mesa', id_mesa)
      .in('estado', ['ACTIVA', 'PAUSADA']);

    const { data: mesa, error: errMesa } = await supabase
      .from('mesas')
      .select('id_mesa, tarifa_hora, estado')
      .eq('id_mesa', id_mesa)
      .single();

    if (errMesa || !mesa) {
      const err = new Error('Mesa no encontrada en la base de datos');
      err.status = 404;
      throw err;
    }

    if (mesa.estado !== 'LIBRE') {
      const err = new Error(`La mesa ya se encuentra en estado ${mesa.estado}`);
      err.status = 409;
      throw err;
    }

    const { error: errUpdateMesa } = await supabase.from('mesas').update({ estado: 'OCUPADA' }).eq('id_mesa', id_mesa);
    if (errUpdateMesa) throw new Error(`Error en Supabase al actualizar mesa: ${errUpdateMesa.message}`);

    const horaInicio = new Date().toISOString();
    const payloadInsert = {
      id_mesa: String(id_mesa).trim(),
      nombre_cliente: (nombre_cliente ? String(nombre_cliente).trim() : null),
      hora_inicio: horaInicio,
      segundos_acumulados: 0,
      tarifa_aplicada: Number(tarifa_aplicada || mesa.tarifa_hora),
      estado: 'ACTIVA'
    };

    const { data: sesion, error: errSesion } = await supabase
      .from('sesiones_mesa')
      .insert([payloadInsert])
      .select('*')
      .single();

    if (errSesion) throw new Error(`Error en Supabase al insertar sesión: ${errSesion.message}`);

    return {
      id_sesion: sesion.id_sesion,
      sesion_activa: {
        id_sesion: sesion.id_sesion,
        id_mesa: String(sesion.id_mesa),
        hora_inicio: sesion.hora_inicio,
        segundos_acumulados: Number(sesion.segundos_acumulados || 0),
        tarifa_aplicada: Number(sesion.tarifa_aplicada),
        estado: sesion.estado || 'ACTIVA',
        consumos: []
      }
    };
  }

  async pausarMesa(id_sesion) {
    if (!id_sesion) {
      const err = new Error('id_sesion requerido');
      err.status = 400;
      throw err;
    }

    const { data: sesion, error: errSesion } = await supabase
      .from('sesiones_mesa')
      .select('*')
      .eq('id_sesion', id_sesion)
      .single();

    if (errSesion || !sesion) {
      const err = new Error('Sesión no encontrada');
      err.status = 404;
      throw err;
    }
    if (sesion.estado !== 'ACTIVA') {
      const err = new Error('La sesión no está activa para ser pausada');
      err.status = 400;
      throw err;
    }

    const horaInicio = new Date(sesion.hora_inicio).getTime();
    const horaActual = Date.now();
    const tramoSegundos = Math.max(0, Math.floor((horaActual - horaInicio) / 1000));
    const totalSegundos = (Number(sesion.segundos_acumulados) || 0) + tramoSegundos;

    const { data: sesionActualizada, error: errUpdateSesion } = await supabase
      .from('sesiones_mesa')
      .update({ estado: 'PAUSADA', segundos_acumulados: totalSegundos })
      .eq('id_sesion', id_sesion)
      .select('*')
      .single();

    if (errUpdateSesion) throw errUpdateSesion;
    await supabase.from('mesas').update({ estado: 'PAUSADA' }).eq('id_mesa', sesion.id_mesa);

    return { ...sesionActualizada, segundos_acumulados: totalSegundos };
  }

  async reanudarMesa(id_sesion) {
    if (!id_sesion) {
      const err = new Error('id_sesion requerido');
      err.status = 400;
      throw err;
    }

    const { data: sesion, error: errSesion } = await supabase
      .from('sesiones_mesa')
      .select('*')
      .eq('id_sesion', id_sesion)
      .single();

    if (errSesion || !sesion) {
      const err = new Error('Sesión no encontrada');
      err.status = 404;
      throw err;
    }
    if (sesion.estado !== 'PAUSADA') {
      const err = new Error('La sesión no está pausada');
      err.status = 400;
      throw err;
    }

    const nuevaHoraInicio = new Date().toISOString();
    const { data: sesionActualizada, error: errUpdateSesion } = await supabase
      .from('sesiones_mesa')
      .update({ estado: 'ACTIVA', hora_inicio: nuevaHoraInicio })
      .eq('id_sesion', id_sesion)
      .select('*')
      .single();

    if (errUpdateSesion) throw errUpdateSesion;
    await supabase.from('mesas').update({ estado: 'OCUPADA' }).eq('id_mesa', sesion.id_mesa);

    return { ...sesionActualizada, segundos_acumulados: Number(sesionActualizada.segundos_acumulados || 0) };
  }

  async agregarConsumo(id_sesion, id_producto, cantidad) {
    if (!id_sesion || !id_producto || !cantidad) {
      const err = new Error('Campos requeridos faltantes: id_sesion, id_producto, cantidad');
      err.status = 400;
      throw err;
    }

    const { data: producto, error: errProducto } = await supabase
      .from('productos')
      .select('*')
      .eq('id_producto', id_producto)
      .single();

    if (errProducto || !producto) {
      const err = new Error('Producto no encontrado en el inventario');
      err.status = 404;
      throw err;
    }

    const precio_unitario = Number(producto.precio_actual || producto.precio || 0);
    const subtotal = Number((precio_unitario * Number(cantidad)).toFixed(2));

    const { data: nuevoConsumo, error: errInsertConsumo } = await supabase
      .from('consumos_sesion')
      .insert([{ id_sesion, id_producto, cantidad: Number(cantidad), precio_unitario, subtotal }])
      .select('*, productos(nombre)')
      .single();

    if (errInsertConsumo) throw new Error(`Error al registrar consumo: ${errInsertConsumo.message}`);

    if (producto.stock !== undefined && producto.stock !== null) {
      await supabase.from('productos').update({
        stock: Math.max(0, producto.stock - cantidad)
      }).eq('id_producto', id_producto);
    }

    return { ...nuevoConsumo, nombre_producto: nuevoConsumo.productos?.nombre || producto.nombre };
  }

  async obtenerConsumosSesion(id_sesion) {
    const { data: consumos, error } = await supabase
      .from('consumos_sesion')
      .select('*, productos(nombre)')
      .eq('id_sesion', id_sesion);

    if (error) throw error;
    
    return (consumos || []).map(c => ({
      id_consumo: c.id_consumo,
      id_producto: c.id_producto,
      nombre_producto: c.productos?.nombre || 'Producto',
      cantidad: Number(c.cantidad),
      precio_unitario: Number(c.precio_unitario),
      subtotal: Number(c.subtotal)
    }));
  }

  async cobrarMesa(id_sesion, metodo_pago) {
    if (!id_sesion) {
      const err = new Error('id_sesion es requerido');
      err.status = 400;
      throw err;
    }

    const { data: sesion, error: errSesion } = await supabase
      .from('sesiones_mesa')
      .select('*, mesas(tarifa_hora)')
      .eq('id_sesion', id_sesion)
      .single();

    if (errSesion || !sesion) {
      const err = new Error('Sesión no encontrada');
      err.status = 404;
      throw err;
    }
    if (sesion.estado === 'FINALIZADA') {
      const err = new Error('La sesión ya fue cobrada');
      err.status = 400;
      throw err;
    }

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

    if (errUpdateSesion) throw errUpdateSesion;

    let { error: errUpdateMesa } = await supabase
      .from('mesas')
      .update({ estado: 'LIBRE' })
      .eq('id_mesa', sesion.id_mesa);

    if (errUpdateMesa) {
      await supabase.from('mesas').update({ estado: 'LIBRE' }).eq('id', sesion.id_mesa);
    }

    return {
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
    };
  }
}

export default new SesionesService();
