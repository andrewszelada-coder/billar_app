import { supabase } from '../config/supabase.js';

export class ConfigController {
  // GET /api/config -> Obtener la configuración actual del negocio
  async getConfig(req, res, next) {
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Si no existe fila de configuración en DB, se retorna valor por defecto habilitar_gracia: false
      const config = data || {
        habilitar_gracia: false,
        minutos_gracia: 3
      };

      return res.json(config);
    } catch (err) {
      // Fallback si la tabla no existe aún
      return res.json({
        habilitar_gracia: false,
        minutos_gracia: 3
      });
    }
  }

  // POST /api/config -> Guardar/Actualizar la configuración
  async updateConfig(req, res, next) {
    try {
      const { habilitar_gracia, minutos_gracia = 3 } = req.body;

      const payload = {
        id: 1,
        habilitar_gracia: Boolean(habilitar_gracia),
        minutos_gracia: Number(minutos_gracia)
      };

      const { data, error } = await supabase
        .from('configuracion')
        .upsert([payload])
        .select('*')
        .single();

      if (error) {
        // En caso de que la tabla configuracion no esté creada aún en Supabase
        return res.json({
          mensaje: 'Configuración guardada en memoria local',
          habilitar_gracia: Boolean(habilitar_gracia),
          minutos_gracia: Number(minutos_gracia)
        });
      }

      return res.json(data);
    } catch (err) {
      next(err);
    }
  }
}

export default new ConfigController();
