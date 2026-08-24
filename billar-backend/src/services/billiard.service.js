const db = require('../config/db');

/**
 * REGLAS DE NEGOCIO IMPLEMENTADAS:
 * 1. Tiempo de cortesía (Gracia): 3 minutos. Si transcurre < 3 min -> 0 costo.
 * 2. Si transcurre >= 3 min -> Se cobra desde el minuto 1.
 * 3. Cálculo por minuto exacto: (Minutos_Transcurridos / 60) * Tarifa_Hora.
 * 4. Fuente de verdad: TIMESTAMP de PostgreSQL (`NOW()`).
 */
function calcularDetalleTiempo(horaInicio, horaFin, tarifaHora) {
  const inicio = new Date(horaInicio).getTime();
  const fin = new Date(horaFin).getTime();
  
  // Diferencia en milisegundos y conversión a minutos transcurridos
  const diffMs = Math.max(0, fin - inicio);
  const minutosExactos = Math.floor(diffMs / (1000 * 60));
  
  let montoTiempo = 0;

  // Aplica regla de 3 minutos de gracia
  if (minutosExactos >= 3) {
    const horasDecimales = minutosExactos / 60;
    montoTiempo = Number((horasDecimales * Number(tarifaHora)).toFixed(2));
  }

  return {
    minutosExactos,
    montoTiempo
  };
}

class BilliardService {
  // Abrir mesa (Control de Concurrencia mediante Transacción y Lock / Índice Único)
  async abrirMesa(mesaId) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Bloquear registro de la mesa para evitar modificaciones concurrentes
      const resMesa = await client.query(
        'SELECT id, estado FROM mesas WHERE id = $1 FOR UPDATE',
        [mesaId]
      );

      if (resMesa.rowCount === 0) {
        const err = new Error('Mesa no encontrada');
        err.status = 44;
        throw err;
      }

      const mesa = resMesa.rows[0];
      if (mesa.estado !== 'LIBRE') {
        const err = new Error('La mesa ya se encuentra ocupada o por cobrar');
        err.status = 409; // Conflict (Control de Concurrencia)
        throw err;
      }

      // Actualizar estado de mesa a OCUPADA
      await client.query(
        "UPDATE mesas SET estado = 'OCUPADA' WHERE id = $1",
        [mesaId]
      );

      // Crear nueva sesión activa
      const resSesion = await client.query(
        `INSERT INTO sesiones (mesa_id, hora_inicio, estado) 
         VALUES ($1, NOW(), 'ACTIVA') 
         RETURNING id, mesa_id, hora_inicio, estado`,
        [mesaId]
      );

      await client.query('COMMIT');
      return resSesion.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      // Manejar violación del índice único `idx_sesion_activa_por_mesa` (código postgres 23505)
      if (error.code === '23505') {
        const conflictErr = new Error('Conflicto: Ya existe una sesión activa para esta mesa');
        conflictErr.status = 409;
        throw conflictErr;
      }
      throw error;
    } finally {
      client.release();
    }
  }

  // Calcular precierre / cierre en tiempo real usando TIMESTAMP de la base de datos
  async obtenerPreCierre(sesionId) {
    const query = `
      SELECT 
        s.id AS sesion_id,
        s.mesa_id,
        s.hora_inicio,
        s.estado AS estado_sesion,
        m.numero AS numero_mesa,
        m.nombre AS nombre_mesa,
        m.tarifa_hora,
        NOW() AS hora_actual,
        COALESCE(
          (SELECT SUM(subtotal) FROM consumos_sesion WHERE sesion_id = s.id), 
          0.00
        ) AS monto_consumos
      FROM sesiones s
      JOIN mesas m ON m.id = s.mesa_id
      WHERE s.id = $1 AND s.estado = 'ACTIVA';
    `;

    const result = await db.query(query, [sesionId]);
    if (result.rowCount === 0) {
      const err = new Error('Sesión activa no encontrada');
      err.status = 404;
      throw err;
    }

    const row = result.rows[0];
    const detalleTiempo = calcularDetalleTiempo(row.hora_inicio, row.hora_actual, row.tarifa_hora);
    
    const montoConsumos = Number(row.monto_consumos);
    const montoTotal = Number((detalleTiempo.montoTiempo + montoConsumos).toFixed(2));

    return {
      sesion_id: row.sesion_id,
      mesa_id: row.mesa_id,
      numero_mesa: row.numero_mesa,
      nombre_mesa: row.nombre_mesa,
      hora_inicio: row.hora_inicio,
      hora_cierre_calculado: row.hora_actual,
      tarifa_hora: Number(row.tarifa_hora),
      minutos_jugados: detalleTiempo.minutosExactos,
      monto_tiempo: detalleTiempo.montoTiempo,
      monto_consumos: montoConsumos,
      monto_total: montoTotal
    };
  }

  // Agregar consumo a mesa OCUPADA
  async agregarConsumo(sesionId, productoId, cantidad) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Validar sesión activa
      const resSesion = await client.query(
        'SELECT s.id, s.estado, m.estado AS estado_mesa FROM sesiones s JOIN mesas m ON m.id = s.mesa_id WHERE s.id = $1 FOR UPDATE',
        [sesionId]
      );

      if (resSesion.rowCount === 0 || resSesion.rows[0].estado !== 'ACTIVA') {
        const err = new Error('La sesión no está activa');
        err.status = 400;
        throw err;
      }

      // Obtener producto y precio oficial
      const resProd = await client.query(
        'SELECT id, nombre, precio, stock FROM productos WHERE id = $1 AND activo = TRUE',
        [productoId]
      );

      if (resProd.rowCount === 0) {
        const err = new Error('Producto no encontrado o inactivo');
        err.status = 404;
        throw err;
      }

      const prod = resProd.rows[0];
      const precioUnitario = Number(prod.precio);
      const subtotal = Number((precioUnitario * cantidad).toFixed(2));

      // Registrar consumo
      const resConsumo = await client.query(
        `INSERT INTO consumos_sesion (sesion_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [sesionId, productoId, cantidad, precioUnitario, subtotal]
      );

      await client.query('COMMIT');
      return resConsumo.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Cierre Inmutable de Mesa
  async cerrarSesion(sesionId) {
    const preCierre = await this.obtenerPreCierre(sesionId);
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Actualizar Sesión a FINALIZADA guardando los montos inmutables
      const resSesion = await client.query(
        `UPDATE sesiones 
         SET 
           hora_fin = $1,
           minutos_jugados = $2,
           monto_tiempo = $3,
           monto_consumos = $4,
           monto_total = $5,
           estado = 'FINALIZADA'
         WHERE id = $6 AND estado = 'ACTIVA'
         RETURNING *`,
        [
          preCierre.hora_cierre_calculado,
          preCierre.minutos_jugados,
          preCierre.monto_tiempo,
          preCierre.monto_consumos,
          preCierre.monto_total,
          sesionId
        ]
      );

      // Liberar mesa a estado LIBRE
      await client.query(
        "UPDATE mesas SET estado = 'LIBRE' WHERE id = $1",
        [preCierre.mesa_id]
      );

      await client.query('COMMIT');
      return {
        mensaje: 'Mesa cerrada exitosamente',
        desglose: resSesion.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new BilliardService();
