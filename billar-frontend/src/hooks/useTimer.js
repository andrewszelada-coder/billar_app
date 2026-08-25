import { useState, useEffect } from 'react';

/**
 * Hook custom para calcular y formatear el tiempo transcurrido en vivo a partir de una hora_inicio.
 * Previene memory leaks limpiando el setInterval al desmontar o cambiar la fecha.
 * @param {string | Date} horaInicio 
 * @returns { object } { formattedTime, totalMinutes, secondsElapsed }
 */
export const useTimer = (horaInicio) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!horaInicio) {
      setElapsed(0);
      return;
    }

    const calculateElapsed = () => {
      const start = new Date(horaInicio).getTime();
      const now = new Date().getTime();
      const diffSeconds = Math.max(0, Math.floor((now - start) / 1000));
      setElapsed(diffSeconds);
    };

    calculateElapsed();
    const intervalId = setInterval(calculateElapsed, 1000);

    return () => clearInterval(intervalId);
  }, [horaInicio]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const pad = (num) => String(num).padStart(2, '0');

  const formattedTime = hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;

  return {
    formattedTime,
    totalMinutes: Math.floor(elapsed / 60),
    secondsElapsed: elapsed
  };
};

export default useTimer;
