import React, { useState } from 'react';
import { useReportes } from '../hooks/useReportes';
import { formatearFecha } from '../utils/dateUtils';

const ReportesView = () => {
  const { data, loading, mesasMap, sesionesPorMesa, mesasIdsOrdenadas } = useReportes();
  const [expandedMesa, setExpandedMesa] = useState(null);

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
        <>
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

          {/* Historial de Mesas (Acordeón) */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm mt-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">📜 Historial de Uso por Mesa</h2>
            {mesasIdsOrdenadas.length === 0 ? (
              <p className="text-sm text-slate-500">No hay registros de historial de mesas.</p>
            ) : (
              <div className="space-y-4">
                {mesasIdsOrdenadas.map((mesaId) => {
                  const isExpanded = expandedMesa === mesaId;
                  const nombreMesa = mesasMap[mesaId] || `Mesa ${mesaId}`;
                  const sesiones = sesionesPorMesa[mesaId].sort((a, b) => new Date(b.hora_fin) - new Date(a.hora_fin)); // Más recientes primero
                  
                  return (
                    <div key={mesaId} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedMesa(isExpanded ? null : mesaId)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white text-lg">{nombreMesa}</span>
                          <span className="text-xs text-slate-500">{sesiones.length} sesiones registradas</span>
                        </div>
                        <span className="text-slate-400 font-bold text-xl">{isExpanded ? '−' : '+'}</span>
                      </button>
                      
                      {isExpanded && (
                        <div className="p-4 bg-white dark:bg-slate-800">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                              <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">
                                  <th className="p-3">Inicio</th>
                                  <th className="p-3">Fin</th>
                                  <th className="p-3 text-right">Tiempo</th>
                                  <th className="p-3 text-right">Costo Tiempo (Bs)</th>
                                  <th className="p-3 text-right">Consumos (Bs)</th>
                                  <th className="p-3 text-right">Total Cobrado (Bs)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                {sesiones.map((sesion) => {
                                  const totalTiempo = Number(sesion.total_tiempo || 0);
                                  const totalConsumos = Number(sesion.total_consumos || 0);
                                  const totalPagado = totalTiempo + totalConsumos;
                                  
                                  const segs = Number(sesion.segundos_acumulados || 0);
                                  const hrs = Math.floor(segs / 3600);
                                  const mins = Math.floor((segs % 3600) / 60);
                                  
                                  return (
                                    <tr key={sesion.id_sesion} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                                      <td className="p-3 text-slate-700 dark:text-slate-300">{formatearFecha(sesion.hora_inicio, sesion.created_at)}</td>
                                      <td className="p-3 text-slate-700 dark:text-slate-300">{formatearFecha(sesion.hora_fin, sesion.hora_inicio || sesion.created_at)}</td>
                                      <td className="p-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                                        {hrs > 0 ? `${hrs}h ` : ''}{mins}m
                                      </td>
                                      <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                                        {totalTiempo.toFixed(2)}
                                      </td>
                                      <td className="p-3 text-right text-blue-600 dark:text-blue-400 font-bold font-mono">
                                        {totalConsumos.toFixed(2)}
                                      </td>
                                      <td className="p-3 text-right text-slate-900 dark:text-white font-black font-mono">
                                        {totalPagado.toFixed(2)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReportesView;
