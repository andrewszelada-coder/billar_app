import React, { useState, useEffect } from 'react';
import { getReportesDashboard } from '../services/api';

const ReportesView = () => {
  const [data, setData] = useState({
    dia: { tiempo: 0, consumos: 0, total: 0 },
    semana: { tiempo: 0, consumos: 0, total: 0 },
    mes: { tiempo: 0, consumos: 0, total: 0 },
    totalSesiones: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportes = async () => {
      try {
        setLoading(true);
        const report = await getReportesDashboard();
        if (report) setData(report);
      } catch (err) {
        console.error('Error al cargar reportes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportes();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-800 dark:text-slate-100">
      {/* Header Estilo SaaS */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">📊 Business Intelligence & Reportes</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Indicadores clave de rendimiento (KPIs) de ventas y tiempo de juego</p>
      </div>

      {loading ? (
        <div className="text-center p-12 text-slate-400 font-bold">Cargando métricas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Ganancia del Día */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Hoy</span>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                Día
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              Bs {data.dia.total.toFixed(2)}
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Tiempo de Mesas:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">Bs {data.dia.tiempo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Consumos de Productos:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">Bs {data.dia.consumos.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Card Ganancia de la Semana */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Esta Semana</span>
              <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                Semana
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              Bs {data.semana.total.toFixed(2)}
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Tiempo de Mesas:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">Bs {data.semana.tiempo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Consumos de Productos:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">Bs {data.semana.consumos.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Card Ganancia del Mes */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Este Mes</span>
              <span className="text-xs bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-800 px-2.5 py-0.5 rounded-full font-bold">
                Mes
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              Bs {data.mes.total.toFixed(2)}
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Tiempo de Mesas:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">Bs {data.mes.tiempo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Consumos de Productos:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">Bs {data.mes.consumos.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportesView;
