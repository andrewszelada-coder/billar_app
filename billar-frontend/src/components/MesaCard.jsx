import React, { useState } from 'react';
import useTimer from '../hooks/useTimer';

const MesaCard = ({
  mesa = {},
  id_mesa: id_mesa_prop,
  habilitarGracia = false,
  minutosGracia = 3,
  onStart,
  onPause,
  onResume,
  onAddConsumo,
  onCheckout
}) => {
  const id_mesa = id_mesa_prop ?? mesa?.id_mesa ?? mesa?.id;
  const { numero, estado, tarifa_hora, sesion_activa } = mesa ?? {};

  // Usar el custom hook useTimer alimentándose 100% de la sesion_activa del backend
  const { formattedTime, totalMinutes } = useTimer(
    sesion_activa?.hora_inicio,
    sesion_activa?.segundos_acumulados ?? 0,
    estado
  );

  const getBadgeStyle = () => {
    switch (estado) {
      case 'LIBRE':
        return {
          cardBg: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1',
          badgeBg: 'bg-emerald-600 text-white',
          statusText: 'LIBRE'
        };
      case 'OCUPADA':
        return {
          cardBg: 'bg-white dark:bg-slate-800 border-amber-500/50 dark:border-amber-600/50 shadow-md shadow-amber-500/5 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/20 hover:-translate-y-1',
          badgeBg: 'bg-amber-600 text-white',
          statusText: 'OCUPADA'
        };
      case 'PAUSADA':
        return {
          cardBg: 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-xl hover:-translate-y-1',
          badgeBg: 'bg-slate-600 text-slate-100',
          statusText: 'PAUSADA'
        };
      default:
        return {
          cardBg: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          badgeBg: 'bg-slate-700 text-white',
          statusText: estado ?? 'LIBRE'
        };
    }
  };

  const style = getBadgeStyle();

  const formatHoraInicio = () => {
    if (!sesion_activa?.hora_inicio) return '';
    const rawHora = sesion_activa.hora_inicio;
    const horaInicioStr = (typeof rawHora === 'string' && !rawHora.endsWith('Z') && !rawHora.includes('T')) ? `${rawHora}Z` : rawHora;
    const date = new Date(horaInicioStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`rounded-2xl border-2 p-5 flex flex-col justify-between transition-all duration-300 ease-in-out space-y-4 ${style.cardBg}`}>
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{numero ?? `Mesa ${id_mesa ?? ''}`}</h2>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tarifa: Bs {tarifa_hora ?? 0}/hr</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${style.badgeBg}`}>
          {style.statusText}
        </span>
      </div>

      {/* Reloj Digital HH:MM:SS */}
      <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700/60 text-center space-y-1">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tiempo Transcurrido</span>
        <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-wider">
          {formattedTime}
        </div>
        {habilitarGracia && estado === 'OCUPADA' && totalMinutes <= minutosGracia && (
          <span className="inline-block text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
            Gracia Inicial ({minutosGracia} min)
          </span>
        )}
        {(estado === 'OCUPADA' || estado === 'PAUSADA') && sesion_activa?.hora_inicio && (
          <div className="pt-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            Iniciado a las: {formatHoraInicio()}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="space-y-3 pt-1">
        {estado === 'LIBRE' && (
          <button
            onClick={() => {
              const targetIdMesa = String(id_mesa || mesa?.id_mesa || mesa?.id || '').trim();
              if (targetIdMesa) {
                onStart?.(targetIdMesa, tarifa_hora);
              } else {
                console.error('[MesaCard] Error: id_mesa no fue encontrado:', { id_mesa_prop, id_mesa, mesa });
                alert('Error al obtener el ID de la mesa.');
              }
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer hover:scale-[1.01]"
          >
            <span>▶</span> Iniciar Hora
          </button>
        )}

        {estado === 'OCUPADA' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => sesion_activa?.id_sesion && onPause?.(sesion_activa.id_sesion)}
              className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 border border-slate-300 dark:border-slate-600"
            >
              <span>⏸</span> Pausar
            </button>
            <button
              onClick={() => onAddConsumo?.(mesa)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
            >
              <span>🥤</span> + Consumo
            </button>
            <button
              onClick={() => onCheckout?.(mesa)}
              className="col-span-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <span>🏁</span> Cobrar Mesa
            </button>
          </div>
        )}

        {estado === 'PAUSADA' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => sesion_activa?.id_sesion && onResume?.(sesion_activa.id_sesion)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
            >
              <span>▶</span> Reanudar
            </button>
            <button
              onClick={() => onAddConsumo?.(mesa)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
            >
              <span>🥤</span> + Consumo
            </button>
            <button
              onClick={() => onCheckout?.(mesa)}
              className="col-span-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <span>🏁</span> Cobrar Mesa
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MesaCard;
