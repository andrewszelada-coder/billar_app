const db = require('../config/db');

class MesasController {
  async listarMesas(req, res, next) {
    try {
      const query = `
        SELECT 
          m.id,
          m.numero,
          m.nombre,
          m.estado,
          m.tarifa_hora,
          s.id AS sesion_activa_id,
          s.hora_inicio
        FROM mesas m
        LEFT JOIN sesiones s ON s.mesa_id = m.id AND s.estado = 'ACTIVA'
        ORDER BY m.id ASC;
      `;
      const result = await db.query(query);
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MesasController();
