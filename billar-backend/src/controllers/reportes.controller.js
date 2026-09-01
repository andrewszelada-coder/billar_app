import { supabase } from '../config/supabase.js';

export class ReportesController {
  async getDashboardReport(req, res, next) {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      
      const dayOfWeek = now.getDay() || 7; // 1 (Lun) a 7 (Dom)
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Consultar sesiones finalizadas
      const { data: sesiones, error } = await supabase
        .from('sesiones_mesa')
        .select('*')
        .eq('estado', 'FINALIZADA');

      if (error) throw error;

      let diaTiempo = 0, diaConsumos = 0;
      let semanaTiempo = 0, semanaConsumos = 0;
      let mesTiempo = 0, mesConsumos = 0;

      (sesiones || []).forEach(s => {
        const fechaFin = new Date(s.hora_fin || s.created_at || now).toISOString();
        const tiempo = Number(s.total_tiempo || 0);
        const consumos = Number(s.total_consumos || 0);

        if (fechaFin >= startOfMonth) {
          mesTiempo += tiempo;
          mesConsumos += consumos;
          if (fechaFin >= startOfWeek) {
            semanaTiempo += tiempo;
            semanaConsumos += consumos;
            if (fechaFin >= startOfDay) {
              diaTiempo += tiempo;
              diaConsumos += consumos;
            }
          }
        }
      });

      return res.json({
        dia: {
          tiempo: Number(diaTiempo.toFixed(2)),
          consumos: Number(diaConsumos.toFixed(2)),
          total: Number((diaTiempo + diaConsumos).toFixed(2))
        },
        semana: {
          tiempo: Number(semanaTiempo.toFixed(2)),
          consumos: Number(semanaConsumos.toFixed(2)),
          total: Number((semanaTiempo + semanaConsumos).toFixed(2))
        },
        mes: {
          tiempo: Number(mesTiempo.toFixed(2)),
          consumos: Number(mesConsumos.toFixed(2)),
          total: Number((mesTiempo + mesConsumos).toFixed(2))
        },
        totalSesiones: (sesiones || []).length,
        sesionesDetalle: sesiones || []
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new ReportesController();
