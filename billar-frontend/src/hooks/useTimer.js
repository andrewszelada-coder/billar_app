import { useState, useEffect } from 'react';

/**
 * Hook custom para calcular y formatear el tiempo transcurrido en vivo a partir de una sesion_activa.
 * @param {string | Date} horaInicio 
 * @param {number} segundosAcumulados 
 * @param {string} estado 
 * @returns { object } { formattedTime, totalMinutes, secondsElapsed }
 */
export const useTimer = (horaInicio, segundosAcumulados = 0, estado = 'OCUPADA') => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const safeAcumulados = Number(segundosAcumulados) || 0;

    if (estado === 'PAUSADA') {
      setElapsed(safeAcumulados);
      return;
    }

    if (!horaInicio || (estado !== 'OCUPADA' && estado !== 'ACTIVA')) {
      setElapsed(safeAcumulados);
      return;
    }

    const calculateElapsed = () => {
      try {
        if (!horaInicio) {
          setElapsed(safeAcumulados);
          return;
        }

        let startMs = 0;
        if (horaInicio instanceof Date) {
          startMs = horaInicio.getTime();
        } else if (typeof horaInicio === 'string' || typeof horaInicio === 'number') {
          let str = String(horaInicio).trim();
          if (str.includes(' ') && !str.includes('T')) {
            str = str.replace(' ', 'T');
          }
          if (!str.includes('Z') && !str.includes('+') && !str.includes('-')) {
            str += 'Z';
          }
          startMs = Date.parse(str);
        }

        const nowMs = Date.now();

        if (isNaN(startMs) || startMs <= 0) {
          setElapsed(safeAcumulados);
          return;
        }

        const tramoSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000));
        setElapsed(safeAcumulados + tramoSecs);
      } catch (err) {
        setElapsed(safeAcumulados);
      }
    };

    calculateElapsed();
    const intervalId = setInterval(calculateElapsed, 1000);

    return () => clearInterval(intervalId);
  }, [horaInicio, segundosAcumulados, estado]);

  const safeElapsed = isNaN(elapsed) || elapsed < 0 ? 0 : elapsed;
  const hours = Math.floor(safeElapsed / 3600);
  const minutes = Math.floor((safeElapsed % 3600) / 60);
  const seconds = safeElapsed % 60;

  const pad = (num) => String(num ?? 0).padStart(2, '0');

  const formattedTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return {
    formattedTime,
    totalMinutes: Math.floor(safeElapsed / 60),
    secondsElapsed: safeElapsed
  };
};

export default useTimer;
