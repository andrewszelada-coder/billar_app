import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

/**
 * REGLAS DE NEGOCIO EN TIEMPO REAL:
 * - Muestra minutos y segundos sin memory leaks (useEffect limpia el interval).
 * - Gracia de 3 minutos: Si tiempo transcurrido es < 3 min, costo tiempo = $0.00.
 */
export function CronometroMesa({ horaInicio, tarifaHora }) {
  const [tiempo, setTiempo] = useState({ minutos: 0, segundos: 0, costoCalculado: 0, esGracia: false });

  useEffect(() => {
    if (!horaInicio) return;

    const actualizarCronometro = () => {
      const inicio = new Date(horaInicio).getTime();
      const ahora = new Date().getTime();
      const diffMs = Math.max(0, ahora - inicio);
      
      const totalSegundos = Math.floor(diffMs / 1000);
      const minutos = Math.floor(totalSegundos / 60);
      const segundos = totalSegundos % 60;

      let costo = 0;
      let esGracia = false;

      if (minutos < 3) {
        costo = 0;
        esGracia = true;
      } else {
        const horasDecimales = minutos / 60;
        costo = Number((horasDecimales * tarifaHora).toFixed(2));
      }

      setTiempo({ minutos, segundos, costoCalculado: costo, esGracia });
    };

    // Actualización inmediata + intervalo cada 1 segundo
    actualizarCronometro();
    const intervalId = setInterval(actualizarCronometro, 1000);

    // Limpieza estricta de memoria al desmontar
    return () => clearInterval(intervalId);
  }, [horaInicio, tarifaHora]);

  const formatoCero = (num) => String(num).padStart(2, '0');

  return (
    <div className="bg-slate-950/70 border border-slate-700/60 rounded-xl p-4 flex flex-col items-center justify-center my-3">
      <div className="flex items-center gap-2 text-slate-400 mb-1 text-xs font-semibold uppercase tracking-wider">
        <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span>Tiempo Transcurrido</span>
      </div>

      <div className="text-3xl font-extrabold text-white tracking-widest font-mono">
        {formatoCero(tiempo.minutos)}:{formatoCero(tiempo.segundos)}
      </div>

      <div className="mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
        {tiempo.esGracia ? (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
            🎁 Cortesía (Primeros 3 min gratis)
          </span>
        ) : (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
            Estimado Tiempo: ${tiempo.costoCalculado.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}
