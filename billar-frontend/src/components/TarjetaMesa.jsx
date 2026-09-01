import React, { useState, useEffect } from 'react';
import useTimer from '../hooks/useTimer';
import { Play, Utensils, Banknote, Clock, Sparkles } from 'lucide-react';

const TarjetaMesa = ({ mesa, onAbrir, onAbrirConsumo, onAbrirCobro }) => {
  const isOcupada = mesa.estado === 'OCUPADA';
  const horaInicio = mesa.sesion_activa?.hora_inicio;
  const tarifaHora = Number(mesa.tarifa_hora || 20);
  
  const { formattedTime, totalMinutes } = useTimer(isOcupada ? horaInicio : null);

  // Cálculo estimado en vivo del tiempo ($Bs)
  const esGracia = isOcupada && totalMinutes <= 3;
  const montoTiempoEstimado = esGracia ? 0 : Number(((totalMinutes / 60) * tarifaHora).toFixed(2));

  return (
    <div
      className={`relative rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between select-none min-h-[280px] bg-slate-800/90 border backdrop-blur-md ${
        isOcupada
          ? 'border-rose-500/40 ring-2 ring-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
          : 'border-emerald-500/30 hover:border-emerald-400/70 shadow-lg shadow-slate-950/50'
      }`}
    >
      {/* Header Tarjeta */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-extrabold">
            {mesa.tipo}
          </span>
          <h3 className="text-2xl font-black text-slate-100 tracking-tight mt-0.5">
            {mesa.numero}
          </h3>
        </div>
        
        {/* Badge de Estado */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-md ${
            isOcupada
              ? 'bg-rose-500 text-white animate-pulse shadow-rose-950/60'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isOcupada ? 'bg-white' : 'bg-emerald-400'}`}></span>
          {mesa.estado}
        </span>
      </div>

      {/* Contenido Central: Cronómetro y Monto Estimado */}
      <div className="my-5 flex flex-col items-center justify-center text-center">
        {isOcupada ? (
          <div className="space-y-2">
            {/* Cronómetro Gigante */}
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-6 h-6 text-rose-400 animate-spin-slow" />
              <span className="font-mono text-4xl sm:text-5xl font-black text-rose-400 tracking-widest drop-shadow-md">
                {formattedTime}
              </span>
            </div>

            {/* Monto Acumulado Estimado */}
            <div className="flex flex-col items-center">
              <span className="text-2xl font-extrabold text-amber-400 tracking-tight">
                Bs. {montoTiempoEstimado.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Monto de Tiempo
              </span>
            </div>

            {esGracia && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold px-3 py-0.5 rounded-full mt-1">
                <Sparkles className="w-3 h-3" /> Tiempo de Gracia (&le; 3 min)
              </span>
            )}
          </div>
        ) : (
          <div className="text-center py-4 space-y-1">
            <div className="text-3xl font-black text-slate-200">
              Bs. {tarifaHora.toFixed(2)}
            </div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
              Tarifa por Hora
            </span>
          </div>
        )}
      </div>

      {/* Botones de Acción (Touch-First) */}
      {!isOcupada ? (
        <button
          onClick={() => onAbrir(mesa.id_mesa)}
          className="w-full py-4 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-base uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
        >
          <Play className="w-6 h-6 fill-current" />
          INICIAR MESA
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onAbrirConsumo(mesa)}
            className="py-3.5 px-3 bg-slate-700 hover:bg-slate-600 active:scale-95 text-amber-300 font-bold text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 border border-slate-600 transition shadow-md cursor-pointer"
          >
            <Utensils className="w-5 h-5 text-amber-400" />
            Snacks
          </button>
          
          <button
            onClick={() => onAbrirCobro(mesa)}
            className="py-3.5 px-3 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 transition cursor-pointer"
          >
            <Banknote className="w-5 h-5" />
            Cobrar
          </button>
        </div>
      )}
    </div>
  );
};

export default TarjetaMesa;
