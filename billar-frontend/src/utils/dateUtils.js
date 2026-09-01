/**
 * Utilidades puras para el manejo y cálculo de fechas y tiempos en el billar.
 */

export const formatearFecha = (fechaStr, fallbackStr = null) => {
  const target = fechaStr || fallbackStr;
  if (!target) return 'N/A';
  
  let dateStr = target;
  // Solo agregamos la 'Z' si NO termina en Z y NO tiene un offset de zona horaria (ej. +00:00 o -04:00)
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:?\d{2}$/)) {
    dateStr += 'Z';
  }
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'N/A';
  
  return date.toLocaleString(undefined, { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const calcularSegundosTranscurridos = (horaInicio) => {
  if (!horaInicio) return 0;
  let dateStr = horaInicio;
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:?\d{2}$/)) {
    dateStr += 'Z';
  }
  const inicioDate = new Date(dateStr).getTime();
  if (isNaN(inicioDate) || inicioDate <= 0) return 0;
  
  const horaActual = Date.now();
  return Math.max(0, Math.floor((horaActual - inicioDate) / 1000));
};

export const calcularCostoTiempo = (segundosTotales, tarifaHora, configGracia) => {
  const minutosTotales = Math.floor(segundosTotales / 60);
  const tieneGraciaActiva = configGracia?.habilitar_gracia;
  const minsGracia = configGracia?.minutos_gracia || 3;
  
  if (!tieneGraciaActiva || minutosTotales > minsGracia) {
    return Number(((segundosTotales / 3600) * Number(tarifaHora)).toFixed(2));
  }
  return 0;
};
