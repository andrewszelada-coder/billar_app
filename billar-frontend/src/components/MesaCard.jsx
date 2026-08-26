import React, { useState, useEffect } from 'react';

const MesaCard = ({ mesa, habilitarGracia = false, minutosGracia = 3, onStart, onPause, onResume, onAddConsumo, onCheckout }) => {
  const { id_mesa, numero, estado, tarifa_hora, sesion_activa } = mesa;
  const [segundosTotales, setSegundosTotales] = useState(0);

  useEffect(() => {
    let interval = null;
    if (estado === 'OCUPADA' && sesion_activa) {
      const updateTimer = () => {
        const horaInicio = new Date(sesion_activa.hora_inicio).getTime();
        const horaActual = new Date().getTime();
        const segundosActuales = Math.floor(Math.max(0, horaActual - horaInicio) / 1000);
        const acumuladosSegundos = (sesion_activa.minutos_acumulados || 0) * 60;
        setSegundosTotales(acumuladosSegundos + segundosActuales);
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000); // Actualización segundo a segundo
    } else if (estado === 'PAUSADA' && sesion_activa) {
      setSegundosTotales((sesion_activa.minutos_acumulados || 0) * 60);
    } else {
      setSegundosTotales(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [estado, sesion_activa]);

  const formatTiempoHHMMSS = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const minutosTranscurridos = Math.floor(segundosTotales / 60);

  const getBadgeStyle = () => {
    switch (estado) {
      case 'LIBRE':
        return {
          cardBg: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 shadow-sm hover:shadow-md',
          badgeBg: 'bg-emerald-600 text-white',
          statusText: 'LIBRE'
        };
      case 'OCUPADA':
        return {
          cardBg: 'bg-white dark:bg-slate-800 border-amber-500/50 dark:border-amber-600/50 shadow-md shadow-amber-500/5',
          badgeBg: 'bg-amber-600 text-white',
          statusText: 'OCUPADA'
        };
      case 'PAUSADA':
        return {
          cardBg: 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600',
          badgeBg: 'bg-slate-600 text-slate-100',
          statusText: 'PAUSADA'
        };
      default:
        return {
          cardBg: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          badgeBg: 'bg-slate-700 text-white',
          statusText: estado
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <div className={`rounded-2xl border-2 p-5 flex flex-col justify-between transition-all space-y-4 ${style.cardBg}`}>
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{numero}</h2>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tarifa: Bs {tarifa_hora}/hr</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${style.badgeBg}`}>
          {style.statusText}
        </span>
      </div>

      {/* Reloj Digital HH:MM:SS */}
      <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700/60 text-center space-y-1">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tiempo Transcurrido</span>
        <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-wider">
          {formatTiempoHHMMSS(segundosTotales)}
        </div>
        {habilitarGracia && estado === 'OCUPADA' && minutosTranscurridos <= minutosGracia && (
          <span className="inline-block text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
            Gracia Inicial ({minutosGracia} min)
          </span>
        )}
      </div>

      {/* Acciones */}
      <div className="space-y-2 pt-1">
        {estado === 'LIBRE' && (
          <button
            onClick={() => onStart(id_mesa)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <span>▶</span> Iniciar Hora
          </button>
        )}

        {estado === 'OCUPADA' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onPause(sesion_activa?.id_sesion)}
              className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 border border-slate-300 dark:border-slate-600"
            >
              <span>⏸</span> Pausar
            </button>
            <button
              onClick={() => onAddConsumo(mesa)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
            >
              <span>🥤</span> + Consumo
            </button>
            <button
              onClick={() => onCheckout(mesa)}
              className="col-span-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <span>🏁</span> Cobrar Mesa
            </button>
          </div>
        )}

        {estado === 'PAUSADA' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onResume(sesion_activa?.id_sesion)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
            >
              <span>▶</span> Reanudar
            </button>
            <button
              onClick={() => onAddConsumo(mesa)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
            >
              <span>🥤</span> + Consumo
            </button>
            <button
              onClick={() => onCheckout(mesa)}
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
