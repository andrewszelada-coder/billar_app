import { supabase } from '../config/supabase.js';

export class MesasController {
  // GET /api/mesas -> Listar mesas
  async listar(req, res, next) {
    try {
      const { data, error } = await supabase
        .from('mesas')
        .select('*')
        .order('id_mesa', { ascending: true });

      if (error) throw error;
      return res.json(data || []);
    } catch (err) {
      next(err);
    }
  }

  // POST /api/mesas -> Crear nueva mesa
  async crear(req, res, next) {
    try {
      const { numero, tipo = 'Pool', tarifa_hora = 20 } = req.body;
      if (!numero) {
        return res.status(400).json({ error: 'El número o nombre de la mesa es requerido' });
      }

      const { data, error } = await supabase
        .from('mesas')
        .insert([{
          numero,
          tipo: tipo || 'Pool',
          tarifa_hora: Number(tarifa_hora),
          estado: 'LIBRE'
        }])
        .select('*')
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/mesas/:id -> Actualizar mesa (nombre, tipo o tarifa)
  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const { numero, tipo, tarifa_hora, estado } = req.body;

      const updates = {};
      if (numero !== undefined) updates.numero = numero;
      if (tipo !== undefined) updates.tipo = tipo;
      if (tarifa_hora !== undefined) updates.tarifa_hora = Number(tarifa_hora);
      if (estado !== undefined) updates.estado = estado;

      const { data, error } = await supabase
        .from('mesas')
        .update(updates)
        .eq('id_mesa', id)
        .select('*')
        .single();

      if (error) throw error;
      return res.json(data);
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/mesas/:id -> Eliminar mesa
  async eliminar(req, res, next) {
    try {
      const { id } = req.params;
      const { error } = await supabase
        .from('mesas')
        .delete()
        .eq('id_mesa', id);

      if (error) throw error;
      return res.json({ mensaje: 'Mesa eliminada exitosamente' });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/mesas/tarifa-global -> Actualizar tarifa a todas las mesas
  async actualizarTarifaGlobal(req, res, next) {
    try {
      const { tarifa_hora } = req.body;
      if (!tarifa_hora || Number(tarifa_hora) <= 0) {
        return res.status(400).json({ error: 'Tarifa inválida' });
      }

      const { data, error } = await supabase
        .from('mesas')
        .update({ tarifa_hora: Number(tarifa_hora) })
        .neq('id_mesa', 0)
        .select('*');

      if (error) throw error;
      return res.json({ mensaje: 'Tarifa global actualizada exitosamente', mesas: data });
    } catch (err) {
      next(err);
    }
  }
}

export default new MesasController();
